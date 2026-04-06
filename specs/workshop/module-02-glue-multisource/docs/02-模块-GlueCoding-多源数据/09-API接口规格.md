# 09 — API 接口规格

| 属性 | 内容 |
|------|------|
| **模块编号** | M2 |
| **模块名称** | Glue Coding · 多源数据（Wind / 新浪等） |
| **文档包版本** | v1.2 |
| **技术栈** | 前端 React · 后端 Flask · 代码 GitHub |
| **开发方式** | CoPaw + 本模块 Spec |
| **模块侧重** | 多源行情与资讯的采集、清洗、调度与可观测；强调数据管道与失败降级。 |

---

## 1. 约定

- **Base**：`/api/v1`；**JSON**；时间 **ISO-8601 UTC**。  
- **鉴权**：`Bearer`；触发任务、改配置需 **运营/数据** 或 **服务账号** 角色（与全局 RBAC 对齐）。  
- **幂等**：`POST /ingest/jobs` 建议 `Idempotency-Key`；相同 key **24h** 内返回同一 `jobId`（或 **409**，团队冻结一种）。

### 1.1 统一错误体

```json
{
  "error": {
    "code": "M2_SOURCE_DISABLED",
    "message": "…",
    "traceId": "trace_xxx",
    "details": {}
  }
}
```

### 1.2 业务错误码

| HTTP | `code` | 说明 |
|------|--------|------|
| 400 | `M2_VALIDATION_ERROR` | 参数非法 |
| 401 | `M2_UNAUTHORIZED` | |
| 403 | `M2_FORBIDDEN` | 无运维权限 |
| 404 | `M2_SOURCE_NOT_FOUND` | 数据源不存在 |
| 409 | `M2_JOB_ALREADY_RUNNING` | 同源已有 running 任务（可配置是否允许并行） |
| 409 | `M2_IDEMPOTENCY_REPLAY` | 幂等重放与首次 body 不一致 |
| 503 | `M2_UPSTREAM_UNAVAILABLE` | Wind/新浪/Mock Provider 不可用 |

---

## 2. DTO

### 2.1 `DataSourceSummary`

| 字段 | 类型 | 说明 |
|------|------|------|
| `sourceId` | string (UUID) | |
| `name` | string | 展示名 |
| `providerType` | string | `wind` / `sina` / `mock` / `rss` / `manual`（可扩展，**不强制校验** P0） |
| `enabled` | boolean | |
| `lastSuccessAt` | string \| null | 最近一次成功同步结束时间 |
| `lastJobStatus` | string \| null | `success` / `failed` / `partial` / `running` |
| `configSummary` | string | **非密钥**摘要，如「标的池 A」 |

### 2.2 `SyncJob`

| 字段 | 类型 | 说明 |
|------|------|------|
| `jobId` | string (UUID) | |
| `sourceId` | string | |
| `status` | string | `queued` / `running` / `success` / `failed` / `partial` / `cancelled` |
| `mode` | string | `full` / `incremental` |
| `startedAt` | string \| null | |
| `completedAt` | string \| null | |
| `stats` | object | 见下 |
| `errorSummary` | string \| null | 失败时人类可读一行 |
| `errors` | object[] | 可选，抽样错误 `{ "code","message","batchHint" }` |

**`stats` 建议键**

| 键 | 类型 | 说明 |
|----|------|------|
| `fetched` | number | 拉取条数 |
| `normalized` | number | 清洗后条数 |
| `publishedToM1` | number | 写入 `research_messages` 条数（与 M1 对齐时） |
| `skipped` | number | 去重/无效跳过 |

---

## 3. 端点明细

### 3.1 `GET /ingest/health`

**响应** `200`：`{ "status": "ok", "module": "M2", "version": "1.0.0" }`

---

### 3.2 `GET /ingest/sources`

列出已配置数据源。

**Query**：`enabledOnly` (boolean，默认 false)

**响应** `200`：

```json
{ "items": [] }
```

`items`：`DataSourceSummary[]`。

---

### 3.3 `GET /ingest/sources/{sourceId}`

单源详情（**不含**密钥；密钥仅服务端与密钥管理）。

**响应** `200`：在 `DataSourceSummary` 基础上可增加 `createdAt`、`updatedAt`、`scheduleCron`（可空）。

---

### 3.4 `POST /ingest/jobs`

触发一次同步。

**Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sourceId` | string | 是 | UUID |
| `mode` | string | 否 | 默认 `incremental`；`full` 全量 |
| `dryRun` | boolean | 否 | `true` 时只拉取统计不写 M1（P1，可 501） |

**响应** `202` 或 `201`：

```json
{ "job": { "jobId": "…", "sourceId": "…", "status": "queued", "mode": "incremental", … } }
```

---

### 3.5 `GET /ingest/jobs/{jobId}`

任务详情，同 `SyncJob`。

**404**：`M2_JOB_NOT_FOUND`（含无权访问时也可用 404 防枚举）。

---

### 3.6 `GET /ingest/jobs`

历史任务列表。

**Query**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `sourceId` | string | — | 过滤 |
| `status` | string | — | 过滤 |
| `cursor` | string | — |  opaque |
| `limit` | int | 20 | 最大 100 |

**响应** `200`：`{ "items": [ SyncJob ], "nextCursor": null, "hasMore": false }`

---

## 4. 与 M1 / M3 的边界（实现约定）

| 方向 | 约定 |
|------|------|
| → **M1** | 任务成功路径将标准化后的资讯 **写入** `research_messages`（`source_system`=`glue` 或配置值，`external_ref` 填上游主键）；**不**经 M1 的公开 REST 写入，以免双通道。 |
| → **M3** | 可提供 **只读** 导出或视图供引用（P1）；P0 **不强制**。 |

**M1 未就绪时**：可先写入本模块 `ingest_feed_items`（`10` §2.3），再由迁移脚本刷入 M1。

---

## 5. OpenAPI

建议 `openapi/m2-ingest.yaml` 与本文同源。

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-04 | 按 M2 生成 |
| v1.2 | 2026-04-04 | DTO、错误码、任务列表、与 M1 写入约定 |
