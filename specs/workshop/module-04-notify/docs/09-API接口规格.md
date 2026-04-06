# 09 — API 接口规格

| 属性 | 内容 |
|------|------|
| **模块编号** | M4 |
| **模块名称** | 团队协作 · 舆情/趋势与多渠道推送 |
| **文档包版本** | v1.2 |
| **技术栈** | 前端 React · 后端 Flask · 代码 GitHub |
| **开发方式** | CoPaw + 本模块 Spec |
| **模块侧重** | 消息获取 + 舆情/趋势规则 + 钉钉/飞书/邮件；Git 分支分工与合并规范。 |

---

## 1. 约定

- **Base**：`/api/v1`；**JSON**。  
- **鉴权**：`Bearer`；规则与试发需 **运营** 或 **管理员**。  
- **合规**：正式 `dispatch` 前须通过 **合规扫描**（BFF 内部模块或 `POST /compliance/scan`，若未实现则 **dryRun** 为默认 P0）。

### 1.1 统一错误体

`code` 前缀 **`M4_`**。

### 1.2 业务错误码

| HTTP | `code` | 说明 |
|------|--------|------|
| 400 | `M4_VALIDATION_ERROR` | |
| 401 | `M4_UNAUTHORIZED` | |
| 403 | `M4_FORBIDDEN` | |
| 404 | `M4_RULE_NOT_FOUND` / `M4_CHANNEL_NOT_FOUND` | |
| 409 | `M4_RULE_DISABLED` | |
| 422 | `M4_COMPLIANCE_BLOCK` | 扫描拦截 |
| 429 | `M4_RATE_LIMIT` | 渠道/用户频控 |
| 503 | `M4_CHANNEL_UNAVAILABLE` | 钉钉/飞书/邮件不可用 |

---

## 2. DTO

### 2.1 `NotifyRule`

| 字段 | 类型 | 说明 |
|------|------|------|
| `ruleId` | string (UUID) | |
| `name` | string | |
| `enabled` | boolean | |
| `triggerType` | string | `manual` / `schedule` / `event`（event 对接 M1/M2 **预留**，P0 可仅 manual+schedule） |
| `scheduleCron` | string \| null | |
| `condition` | object | **JSON 逻辑**，如 `{ "keywords":[], "minSeverity":"high" }`，P0 可简化为关键词包含 |
| `templateId` | string \| null | 关联模板 |
| `channelIds` | string[] | 目标渠道配置 ID |
| `createdAt` | string | |
| `updatedAt` | string | |

### 2.2 `MessageTemplate`

| 字段 | 类型 | 说明 |
|------|------|------|
| `templateId` | string (UUID) | |
| `name` | string | |
| `channelType` | string | `dingtalk` / `feishu` / `email` |
| `subject` | string \| null | 邮件用 |
| `bodyMarkdown` | string | 支持 `{{var}}` 变量 |
| `version` | number | 递增 |

### 2.3 `ChannelConfigSummary`

| 字段 | 类型 | 说明 |
|------|------|------|
| `channelId` | string (UUID) | |
| `type` | string | dingtalk/feishu/email |
| `label` | string | 展示名 |
| `enabled` | boolean | |
| `lastTestStatus` | string \| null | `ok` / `fail` |

### 2.4 `Delivery`

| 字段 | 类型 | 说明 |
|------|------|------|
| `deliveryId` | string (UUID) | |
| `ruleId` | string \| null | |
| `channelId` | string | |
| `status` | string | `pending` / `sent` / `failed` / `blocked` |
| `dryRun` | boolean | |
| `payloadPreview` | string | 截断展示 |
| `errorCode` | string \| null | |
| `traceId` | string | |
| `createdAt` | string | |

---

## 3. 端点明细

### 3.1 `GET /notify/health`

**响应** `200`：`{ "status": "ok", "module": "M4" }`

---

### 3.2 `GET /notify/rules`

**Query**：`cursor`、`limit`（默认 20）、`enabledOnly`

**响应** `200`：`{ "items": [ NotifyRule ], "nextCursor", "hasMore" }`

---

### 3.3 `POST /notify/rules`

**Body**：`NotifyRule` 创建子集（无 `ruleId`/`createdAt`）

**响应** `201`：`{ "rule": { … } }`

---

### 3.4 `GET /notify/rules/{ruleId}`

**响应** `200`：`NotifyRule`

---

### 3.5 `PATCH /notify/rules/{ruleId}`

**Body**：部分字段 `name`、`enabled`、`condition`、`channelIds`、`templateId`、`scheduleCron`

**响应** `200`：更新后 `NotifyRule`

---

### 3.6 `DELETE /notify/rules/{ruleId}`

**响应** `204` 或 `200` + `deleted: true`

---

### 3.7 消息模板（与 `10` §2.2 一致）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/notify/templates` | 列表，`cursor` / `limit` |
| POST | `/notify/templates` | 创建；body 含 `name`、`channelType`、`subject?`、`bodyMarkdown` |
| GET | `/notify/templates/{templateId}` | 详情 |
| PATCH | `/notify/templates/{templateId}` | 更新；`version` 递增策略由服务端定义 |
| DELETE | `/notify/templates/{templateId}` | 无规则引用或允许级联时删除 |

---

### 3.8 `POST /notify/dispatch`

手动或规则触发发送。

**Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ruleId` | string | 否 | 与 `channelIds`+`payload` 二选一 |
| `channelIds` | string[] | 否 | 直发 |
| `payload` | object | 是 | `title`、`body` 或模板变量 `variables: {}` |
| `dryRun` | boolean | 否 | 默认 **true**（P0 安全默认，显式 `false` 才真发） |
| `sourceRef` | string | 否 | 关联 M1 `messageId` 等，**预留** |

**响应** `200`：

```json
{ "delivery": { "deliveryId": "…", "status": "sent|blocked|pending", "dryRun": true, "traceId": "…" } }
```

---

### 3.9 `GET /notify/deliveries`

**Query**：`cursor`、`limit`、`ruleId`、`status`、`from`、`to`

**响应** `200`：`{ "items": [ Delivery ], "nextCursor", "hasMore" }`

---

### 3.10 `POST /notify/channels/{type}/test`

`type`：`dingtalk` | `feishu` | `email`

**Body**：`{ "channelId": "uuid" }` 或内联测试凭据（**仅 dev**，prod 必须用 `channelId`）

**响应** `200`：`{ "ok": true, "latencyMs": 120 }`

---

### 3.11 `GET /notify/channels`

列出 `ChannelConfigSummary[]`，供 UI 选择。

---

## 4. 与 M1 / M2 / CoPaw

- **触发源**：轮询 M1 API 或订阅事件 **在实现期** 接线；本 `09` **不强制** 新端点。  
- **CoPaw Channel**：出站可与 Channel 双写，**文案与 traceId** 须与 `Delivery` 一致（见 `README` §CoPaw）。

---

## 5. OpenAPI

建议 `openapi/m4-notify.yaml`。

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-04 | 按 M4 生成 |
| v1.2 | 2026-04-04 | 规则 CRUD、模板、dispatch、deliveries、错误码 |
