# ira.vin Mock API 规格（形态参考，非官方文档）

**Base**：部署根路径，例如 `https://your-ira-vin.example.com`。下文路径均为 **追加** 在该主机名后。

**`IRA_VIN_MOCK_BASE`**：BFF、Glue 连接器与 CoPaw Skill/Cron 的出站 Base 建议统一读此环境变量（**不含尾部 `/`**）。**正式对外域名**（如是否固定为 `https://ira.vin`）在部署敲定后，将本文件中的示例 Base、各模块 **`09`** 示例 URL 与 **`docs-5modules/02-.../08`** 说明改为与线上一致即可；**路径段**仍以本文 **`/mock/v1/...`** 为真源。

---

## 0. 仿门户 HTML（与 JSON 同源联调）

| 路径 | 说明 |
|------|------|
| **`GET /`** | 深色门户首页，卡片链到下列三页 |
| **`GET /mock/page/sina/finance`** | 红顶栏 + 资讯列表；**浏览器内 `fetch`** 同域 `…/sina/finance/news/list.json` |
| **`GET /mock/page/eastmoney/flash`** | 橙色顶栏 + 快讯时间轴；**`fetch`** `…/eastmoney/api/news/flash` |
| **`GET /mock/page/wind/terminal`** | 深色终端风；输入 `windCode` 后 **`fetch`** `…/wind/market/snapshot` |

**兼容**：`GET /mock/v1/page/sina/news-sample.html` → **302** 至 `/mock/page/sina/finance`。

**子路径部署**：若应用不在域名根目录，`fetch('/mock/v1/...')` 会失败。可在反代设置 `X-Forwarded-Prefix` 并在前端使用 `const BASE = document.querySelector('meta[name=api-base]')?.content || ''` 等模式拼接 URL（或模板注入 `API_BASE`）。

---

## 1. 新浪财经风格（列表 JSON）

**`GET /mock/v1/sina/finance/news/list.json`**

**Query**：`page`（默认 1）、`pageSize`（默认 20）

**响应形态**（示意多层 `result.status.code` + `data.items[]`，常见门户 API 习惯）：

| 字段路径 | 类型 | 说明 |
|----------|------|------|
| `result.status.code` | number | `0` 成功 |
| `result.data.items[].id` | string | 上游主键（可作 `external_ref`） |
| `result.data.items[].title` | string | |
| `result.data.items[].summary` | string | |
| `result.data.items[].ctime` | string | `YYYY-MM-DD HH:mm:ss`（适配器需转 ISO UTC） |
| `result.data.items[].channel` | string | 映射 `category` |
| `result.data.items[].url` | string | 原文链接 |

**M2 归一化**：`external_ref = "sina:" + id`，`source_system = "ira_vin_sina"`。

---

## 2. 东方财富风格（快讯列表）

**`GET /mock/v1/eastmoney/api/news/flash`**

**Query**：`page`、`pageSize`

**响应形态**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | |
| `data[]` | array | 快讯列表 |
| `data[].art_code` | string | 主键 |
| `data[].title` | string | |
| `data[].digest` | string | 摘要 |
| `data[].show_time` | string | 展示时间 |
| `data[].column` | string | 板块标签 |

**M2 归一化**：`external_ref = "em:" + art_code`。

---

## 3. Wind 风格（快照，REST 简化）

**`GET /mock/v1/wind/market/snapshot`**

**Query**：`windCode`（必填，如 `600519.SH`）

**响应形态**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `requestId` | string | 追踪用 |
| `errorCode` | number | `0` 成功 |
| `snap` | object | |
| `snap.windCode` | string | |
| `snap.securityName` | string | 证券简称 |
| `snap.last` | number | 最新价（演示） |
| `snap.changePct` | number | 涨跌幅 |
| `snap.updateTime` | string | ISO-8601 |

**用途**：演示「机构终端式」键名与数值类型；写入 M1 时通常转成 **一条短讯式** `research_messages` 或进入 M2 侧缓存表（按你队 `10` 设计）。

---

## 4. OpenAI 兼容（M3/M5 共用 LLM 形态）

**`POST /mock/v1/openai/v1/chat/completions`**

**Headers**：`Content-Type: application/json`

**Body**（节选，与 OpenAI Chat Completions 对齐）：

```json
{
  "model": "ira-vin-mock",
  "messages": [
    { "role": "system", "content": "你是投研助手（演示）。" },
    { "role": "user", "content": "贵州茅台短期走势怎么看？" }
  ]
}
```

**响应**：含 `choices[0].message.content` 的固定结构；`id`、`created`、`usage` 占位。

**M3**：BFF 将 citations 拼进 prompt 或二次解析；本 Mock **仅返回纯文本**，复杂 `QueryResponse` 用 §5。

**M5**：可把多 Agent 提示拆成多次调用本接口，或由 BFF 直接调 §6。

---

## 5. M3 捷径：`QueryResponse` 形

**`POST /mock/v3/knowledge/qa`**

**Body**：

```json
{
  "question": "该基金股票仓位如何？",
  "documentId": "optional-uuid"
}
```

**响应**（对齐 M3 `09` §2.4 `QueryResponse` 字段名）：

- `answer`、`citations[]`（`chunkId`、`documentId`、`score`、`snippet`）、`traceId`、`declined`、`declineReason`。

---

## 6. M5 捷径：单轮发言批量（供 BFF 翻译）

**`POST /mock/v5/experts/utterances-preview`**

**Body**：

```json
{
  "topic": "讨论标的 000001.OF",
  "roundNo": 1
}
```

**响应**：

- `newUtterances[]`：含 `agentId`（`M5-BULL` / `M5-BEAR` / `M5-MOD`）、`content`、`roundNo`、`seq` 等，便于与 **`05-模块.../09`** `Utterance` 对齐（真实 `sessionId` 仍由正式 BFF 生成）。

---

## 7. 建议客户端配置示例

```text
# M2 适配器
SINA_FEED_URL=${IRA_VIN_MOCK_BASE}/mock/v1/sina/finance/news/list.json
EASTMONEY_FLASH_URL=${IRA_VIN_MOCK_BASE}/mock/v1/eastmoney/api/news/flash
WIND_SNAPSHOT_URL=${IRA_VIN_MOCK_BASE}/mock/v1/wind/market/snapshot

# LLM
OPENAI_API_BASE=${IRA_VIN_MOCK_BASE}/mock/v1/openai/v1
OPENAI_API_KEY=dummy
```

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-04 | 初版：新浪/东财/Wind 形态 + OpenAI + M3/M5 捷径 |
| v1.1 | 2026-04-04 | §0 仿门户 HTML 与 JSON 同源对接；旧 sina 路径 302 |
