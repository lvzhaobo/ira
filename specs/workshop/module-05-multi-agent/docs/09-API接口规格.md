# 09 — API 接口规格

| 属性 | 内容 |
|------|------|
| **模块编号** | M5 |
| **模块名称** | Qoder Experts · 多 Agent 论股基 |
| **文档包版本** | v1.2 |
| **技术栈** | 前端 React · 后端 Flask · 代码 GitHub |
| **开发方式** | CoPaw + 本模块 Spec |
| **模块侧重** | 多角色 Agent 辩论、工具白名单、纪要导出与合规免责声明。 |

---

## 1. 约定

- **Base URL**：`/api/v1`（下文路径均相对 Base）。  
- **格式**：`Content-Type: application/json`；时间 ISO-8601 UTC（`2026-04-04T12:00:00Z`）。  
- **鉴权**：`Authorization: Bearer <access_token>`；`userId` 由网关/会话解析，**不得**信任 body 内的 user 字段作为鉴权依据。  
- **幂等**：`POST` 可带请求头 `Idempotency-Key: <uuid>`（创建会话、推进 turn 见各节）。  
- **`agentId`**：枚举与 `06` §1 一致：`M5-BULL` | `M5-BEAR` | `M5-MOD`（P1 可扩展 `M5-MACRO`）；与 `10` 库表一致。

### 1.1 统一成功包络（建议）

列表类接口可使用：

```json
{ "data": { }, "meta": { "requestId": "req_xxx" } }
```

### 1.2 统一错误体

```json
{
  "error": {
    "code": "M5_SESSION_NOT_FOUND",
    "message": "人类可读说明",
    "traceId": "trace_xxx",
    "details": { }
  }
}
```

### 1.3 业务错误码（节选，实现可扩展）

| HTTP | `code` | 说明 |
|------|--------|------|
| 400 | `M5_VALIDATION_ERROR` | 参数不合法 |
| 401 | `M5_UNAUTHORIZED` | 未登录或 Token 无效 |
| 403 | `M5_FORBIDDEN` | 非会话属主 |
| 404 | `M5_SESSION_NOT_FOUND` | 会话不存在 |
| 409 | `M5_SESSION_CLOSED` | 会话已 completed/failed，禁止再 turn |
| 409 | `M5_IDEMPOTENCY_REPLAY` | 相同 Idempotency-Key 重放，body 须与首次一致 |
| 429 | `M5_RATE_LIMIT` | 限流 |
| 503 | `M5_MODEL_UNAVAILABLE` | 模型侧不可用 |

---

## 2. 类型定义（DTO，前后端共用）

### 2.1 `AgentId`

字符串枚举：`M5-BULL` | `M5-BEAR` | `M5-MOD` | `M5-MACRO`（P1）。

### 2.2 `AgentProfileConfig`

```json
{
  "profile": "default",
  "promptVersion": "2026-04-04",
  "temperature": 0.3
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `profile` | string | 否 | 运营配置键，默认 `default` |
| `promptVersion` | string | 否 | 不填则服务端默认 |
| `temperature` | number | 否 | 0～2，越界 400 |

### 2.3 `CitationRef`

```json
{ "type": "chunk", "id": "m3-chunk-abc", "label": "研报片段" }
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | `chunk` / `quote` / `news` 等与 M2/M3 契约对齐 |
| `id` | string | 上游资源 ID |
| `label` | string | 可选，UI 短标签 |

### 2.4 `ToolCallSummary`（嵌在发言内）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | `debate_tool_calls.id` |
| `toolName` | string | 如 `m3.search_chunks` |
| `status` | string | `ok` / `error` |
| `summary` | string | 短摘要 |
| `citationRefs` | `CitationRef[]` | 可空 |
| `latencyMs` | number | 可空 |

### 2.5 `Utterance`

| 字段 | 类型 | 说明 |
|------|------|------|
| `utteranceId` | string (UUID) | |
| `sessionId` | string (UUID) | |
| `seq` | number | 会话内顺序 |
| `roundNo` | number | 辩论轮次 |
| `agentId` | `AgentId` | |
| `content` | string | Markdown 为主 |
| `contentFormat` | string | `markdown` \| `plain` |
| `structured` | object | 可空，机器可读块 |
| `toolCalls` | `ToolCallSummary[]` | 可空；详情可再查扩展接口（P1） |
| `modelName` | string | 可空 |
| `promptVersion` | string | 可空 |
| `createdAt` | string | ISO-8601 |

### 2.6 `DebateSession`

| 字段 | 类型 | 说明 |
|------|------|------|
| `sessionId` | string (UUID) | |
| `topic` | string | |
| `symbol` | string | 可空 |
| `symbolType` | string | 可空，见 `10` |
| `title` | string | 可空 |
| `status` | string | `draft` / `in_progress` / `completed` / `failed` / `archived` |
| `maxRounds` | number | |
| `agentProfiles` | object | key 为 `AgentId`，值为 `AgentProfileConfig` |
| `disclaimerVersion` | string | |
| `chatId` | string | 可空 |
| `createdAt` | string | |
| `updatedAt` | string | |

---

## 3. 端点明细

### 3.1 `GET /experts/health`

**响应** `200`：

```json
{ "status": "ok", "module": "M5", "version": "1.0.0" }
```

---

### 3.2 `POST /experts/sessions`

创建辩论会话。

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `topic` | string | 是 | 1～8000 字符（上限可配置） |
| `symbol` | string | 否 | 标的代码 |
| `symbolType` | string | 否 | `STOCK` / `FUND` / `INDEX` / `OTHER` |
| `title` | string | 否 | 自定义标题 |
| `maxRounds` | number | 否 | 默认 4，范围 1～16 |
| `agentProfiles` | object | 否 | `Record<AgentId, AgentProfileConfig>` |
| `chatId` | string | 否 | 挂载全局会话 |
| `disclaimerVersion` | string | 否 | 不填用服务端当前默认 |

**请求示例**

```json
{
  "topic": "请对比 XX 基金与基准在当前利率环境下的风险收益特征，不做买卖建议。",
  "symbol": "000001.OF",
  "symbolType": "FUND",
  "maxRounds": 4,
  "agentProfiles": {
    "M5-BULL": { "profile": "default", "temperature": 0.3 },
    "M5-BEAR": { "profile": "default", "temperature": 0.3 },
    "M5-MOD": { "profile": "summary_only", "temperature": 0.2 }
  }
}
```

**响应** `201`

```json
{
  "session": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "topic": "…",
    "symbol": "000001.OF",
    "symbolType": "FUND",
    "title": null,
    "status": "draft",
    "maxRounds": 4,
    "agentProfiles": { },
    "disclaimerVersion": "2026-04-04",
    "chatId": null,
    "createdAt": "2026-04-04T10:00:00Z",
    "updatedAt": "2026-04-04T10:00:00Z"
  }
}
```

**幂等**：相同 `Idempotency-Key` + 相同 user → 返回首次创建的 `session`（`200` 或 `201` 由团队约定，须文档化）。

---

### 3.3 `POST /experts/sessions/{sessionId}/turn`

推进编排：由服务端根据 `11` 规则生成 **下一条或一批** 发言（如同一轮 BULL+BEAR）。  

**路径参数**：`sessionId` (UUID)

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `mode` | string | 否 | `step`（默认）：下一步；`run_round`：尽量跑满当前轮双方；`finish`：仅请求生成 `M5-MOD` 纪要（须满足前置条件，否则 409） |
| `clientRequestId` | string | 否 | 幂等键，与 `Idempotency-Key` 二选一或同时（团队定一） |

**响应** `200`

```json
{
  "session": { },
  "newUtterances": [ ],
  "serverCursor": { "lastSeq": 5, "phase": "in_progress" }
}
```

- `session`：与 §2.6 同形，含更新后 `status`。  
- `newUtterances`：`Utterance[]`，按 `seq` 升序。  
- `phase`：可选实现字段，便于前端状态机（如 `waiting_model`）。

**错误**：`409 M5_SESSION_CLOSED`；`403` 非属主。

---

### 3.4 `GET /experts/sessions/{sessionId}`

拉取会话详情 + 发言列表（分页）。

**Query**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `utteranceAfterSeq` | number | — | 只返回 `seq > utteranceAfterSeq` |
| `limit` | number | 50 | 最大 200 |
| `includeToolCalls` | boolean | true | 是否在每条 utterance 嵌 `toolCalls` 摘要 |

**响应** `200`

```json
{
  "session": { },
  "utterances": [ ],
  "hasMore": false,
  "nextAfterSeq": 12
}
```

---

### 3.5 `GET /experts/sessions/{sessionId}/export`

导出纪要。

**Query**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `format` | string | `markdown` | `markdown` \| `pdf`（PDF 可异步，见下） |

**响应** `200`（`format=markdown`）

- `Content-Type: text/markdown; charset=utf-8`  
- Body 为纯 Markdown 文本（含固定免责声明块）。

**响应** `202`（`format=pdf` 且异步）

```json
{
  "jobId": "job_uuid",
  "status": "processing",
  "pollUrl": "/api/v1/experts/sessions/{sessionId}/export/jobs/{jobId}"
}
```

（若 P0 不做异步 PDF，可统一返回 `400` + `M5_VALIDATION_ERROR` 说明仅支持 markdown。）

---

## 4. 与兄弟模块

- 工具真实调用走 M2/M3 内部服务；**本 API 不直接暴露** Wind/向量细节，仅在 `toolCalls.citationRefs` 中体现引用。  
- 全局 Chat：创建时可带 `chatId`；是否在 `chat_messages` 写入摘要由集成方约定（可 P1）。

---

## 5. OpenAPI

建议由本文件生成或维护 `openapi/m5-experts.yaml`（单文件），CI 校验与前端 codegen 同源；**字段名以本文档为准**。

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-04 | 按 M5 生成 |
| v1.1 | 2026-04-04 | 端点表下补充 `agent_id` 与 `06` §1 对齐说明 |
| v1.2 | 2026-04-04 | DTO、错误码、各端点请求/响应与分页导出 |
