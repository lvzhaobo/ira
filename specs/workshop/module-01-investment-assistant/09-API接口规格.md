# 09 — API 接口规格

| 属性 | 内容 |
|------|------|
| **模块编号** | M1 |
| **模块名称** | Spec Coding · 投研页（消息与搜索） |
| **文档包版本** | v1.2 |
| **技术栈** | 前端 React · 后端 Flask · 代码 GitHub |
| **开发方式** | CoPaw + 本模块 Spec |
| **模块侧重** | 投研经理早会前在投研页查看、搜索、筛选与标记已读；强调规格驱动与 AC 可测。 |

---

## 1. 约定

- **Base URL**：`/api/v1`；**JSON**；时间 **ISO-8601 UTC**。  
- **鉴权**：`Authorization: Bearer <access_token>`；`userId` 由网关解析，**禁止**仅依赖 body 标识用户。  
- **幂等**：`PATCH` 已读支持请求头 `Idempotency-Key`（可选，与 `13` 对齐）。  
- **范围**：本文件仅描述 **M1 读模型 + 已读状态**。**不向本文读者承诺** M2 写入、M4 推送的实现细节；后续模块通过 **预留字段**（`sourceSystem`、`externalRef`、`metadata`）对齐，见 `10` §4。

### 1.1 统一错误体

```json
{
  "error": {
    "code": "M1_MESSAGE_NOT_FOUND",
    "message": "人类可读说明",
    "traceId": "trace_xxx",
    "details": {}
  }
}
```

### 1.2 业务错误码

| HTTP | `code` | 说明 |
|------|--------|------|
| 400 | `M1_VALIDATION_ERROR` | 参数非法（分页、日期格式等） |
| 401 | `M1_UNAUTHORIZED` | 未登录 |
| 403 | `M1_FORBIDDEN` | 无权限查看该消息 |
| 404 | `M1_MESSAGE_NOT_FOUND` | 消息不存在或对用户不可见 |
| 429 | `M1_RATE_LIMIT` | 限流（搜索） |

---

## 2. DTO 定义

### 2.1 `MessageSummary`（列表 / 搜索命中摘要）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `messageId` | string (UUID) | 是 | |
| `title` | string | 是 | 列表标题 |
| `summary` | string | 否 | 列表摘要，无则可为空串 |
| `publishedAt` | string | 是 | 发布时间 |
| `sourceType` | string | 否 | 预留：`manual` / `feed` / `glue` / `mock` 等，**M1 可不校验枚举** |
| `sourceName` | string | 否 | 展示用来源名 |
| `category` | string | 否 | 主题/频道，预留筛选 |
| `read` | boolean | 是 | **当前用户**是否已读 |
| `highlight` | string | 否 | 搜索高亮片段（HTML 转义后的安全子串，仅搜索接口返回） |

### 2.2 `MessageDetail`

继承摘要语义，额外字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `body` | string | 正文，Markdown 或 HTML，**与 `contentFormat` 一致** |
| `contentFormat` | string | `markdown` \| `html` \| `plain` |
| `links` | `LinkRef[]` | 外链/附件 |
| `metadata` | object | **扩展桶**，键值由后续模块约定；M1 原样存储与返回 |

**`LinkRef`**

| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | string | 展示文字 |
| `url` | string | HTTPS 优先 |

### 2.3 分页与游标

| 字段 | 类型 | 说明 |
|------|------|------|
| `nextCursor` | string \| null | 下一页游标；无更多为 `null` |
| `hasMore` | boolean | |

**游标不透明**：客户端 **不得** 解析；由服务端编码 `publishedAt` + `messageId`（或等价排序键）。

---

## 3. 端点明细

### 3.1 `GET /research/health`

**响应** `200`：

```json
{ "status": "ok", "module": "M1", "version": "1.0.0" }
```

---

### 3.2 `GET /research/messages`

消息流列表（按发布时间 **降序**）。

**Query**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `cursor` | string | — | 上一页 `nextCursor` |
| `limit` | integer | 20 | 1～100 |
| `unreadOnly` | boolean | false | `true` 时仅未读 |
| `category` | string | — | 可选，精确匹配 `category` |
| `sourceType` | string | — | 可选，过滤预留字段 |

**响应** `200`

```json
{
  "items": [],
  "nextCursor": null,
  "hasMore": false
}
```

`items`：`MessageSummary[]`。

---

### 3.3 `GET /research/messages/search`

关键词搜索（MVP：**标题 + 摘要 + 正文** 之一可配；实现可用 `ILIKE` 或全文检索，见 `10` §3）。

**Query**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `q` | string | 是 | 1～200 字符，trim 后非空 |
| `from` | string | 否 | ISO 日期下界（含），按 `publishedAt` |
| `to` | string | 否 | ISO 日期上界（含） |
| `cursor` | string | 否 | 分页 |
| `limit` | integer | 否 | 默认 20，最大 100 |

**响应** `200`：与 §3.2 同形；`MessageSummary.highlight` 建议填 **一段** 匹配上下文（已转义）。

**限流**：`429 M1_RATE_LIMIT`，建议搜索 **≤ 30 次/分钟/用户**（可配置）。

---

### 3.4 `GET /research/messages/{messageId}`

单条详情。路径参数 **UUID**。

**响应** `200`：`MessageDetail` 根级对象（或包在 `data.message`，团队冻结一种，**须与列表字段兼容**）。

**403**：用户无权访问该消息（若未来做行级权限）。  
**404**：不存在或已删除。

---

### 3.5 `PATCH /research/messages/{messageId}/read`

标记已读；**幂等**（重复调用仍为成功）。

**请求体**：可为空 `{}`，或显式：

```json
{ "read": true }
```

**响应** `200`

```json
{
  "messageId": "uuid",
  "read": true,
  "readAt": "2026-04-04T10:00:00Z"
}
```

**说明**：不支持 `read: false` 的「未读回滚」于 **P0**；若 P1 需要，另增 `DELETE .../read` 或 `PATCH` 扩展，并改 `09` 版本。

---

## 4. 与后续模块的契约边界（仅预留，M1 不实现）

| 后续模块 | 预留方式 | M1 行为 |
|----------|----------|---------|
| **M2** 多源写入 | `10` 表字段 `source_system`、`external_ref`、`ingested_at`；可选仅内部 API 写入 | M1 **不暴露** 写入消息的公开端点（种子/Migration 除外） |
| **M4** 订阅/事件 | `metadata` 中可放 `eventHints`；**不**在 M1 实现推送 | — |

---

## 5. OpenAPI

建议维护 `openapi/m1-research.yaml`，与本文 **path、字段名** 同源。

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-04 | 按 M1 生成 |
| v1.2 | 2026-04-04 | DTO、错误码、分页搜索已读全量契约；后续模块仅预留 |
