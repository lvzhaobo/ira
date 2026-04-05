每次回复都使用中文,每次都要回复"靓仔"

# M2 Glue Coding · 多源数据 — Agent 开发指南

> **⚠️ Agent 工作原则（Spec Coding 范式）**
> 1. **优先"抄"代码**：先读取 `m2-glue-reference/` 和 `ira-vin-mocks/` 的现有实现，理解结构、命名、风格后再扩展
> 2. **禁止重新发明轮子**：已有 Mock Provider、Job FSM、React 组件、Flask 路由必须复用或在此基础上修改
> 3. **契约优先**：代码必须与 `09-API接口规格.md`、`10-数据模型与存储规格.md` 严格对齐
> 4. **风格一致**：JSON 用 `camelCase`，时间用 ISO-8601 UTC，密钥用 `secret_ref`（禁止明文）

---

## 模块概述

| 属性 | 内容 |
|------|------|
| **模块编号** | M2 |
| **模块名称** | Glue Coding · 多源数据（Wind / 新浪 / 东财等） |
| **技术栈** | 前端 React · 后端 Flask · PostgreSQL · GitHub |
| **核心职责** | 多源行情与资讯的采集、清洗、调度与可观测；数据管道与失败降级 |
| **API 前缀** | `/api/v1/ingest` |

---

## 📂 当前目录文件索引（Agent 必读）

### 1️⃣ 可"抄"的参考代码（优先使用）

| 资源 | 路径 | 用途 |
|------|------|------|
| **M2 骨架代码** | [`m2-glue-reference/`](./m2-glue-reference/) | Provider 接口 + Mock 实现 + Job FSM + pytest |
| **M2 参考前端** | [`m2-glue-reference/frontend/`](./m2-glue-reference/frontend/) | React 运维台 SPA（`npm run dev` → `http://127.0.0.1:5180`） |
| **Mock 数据源** | [`ira-vin-mocks/`](./ira-vin-mocks/) | 新浪/东财/Wind 模拟 API + 仿门户页面 |
| **UI 主视觉** | [`ui-master-demo/index.html`](./ui-master-demo/index.html) | 深蓝主色 + 红色强调的 UI 风格参考 |

### 2️⃣ 规格文档（契约真源）

| 优先级 | 文档 | 路径 |
|--------|------|------|
| **P0** | API 接口规格 | [`02-模块-GlueCoding-多源数据/09-API接口规格.md`](./02-模块-GlueCoding-多源数据/09-API接口规格.md) |
| **P0** | 数据模型与存储 | [`02-模块-GlueCoding-多源数据/10-数据模型与存储规格.md`](./02-模块-GlueCoding-多源数据/10-数据模型与存储规格.md) |
| **P0** | 功能规格说明 | [`02-模块-GlueCoding-多源数据/06-功能规格说明.md`](./02-模块-GlueCoding-多源数据/06-功能规格说明.md) |
| P1 | 用户故事与验收 | [`02-模块-GlueCoding-多源数据/05-用户故事与验收标准.md`](./02-模块-GlueCoding-多源数据/05-用户故事与验收标准.md) |
| P1 | 测试策略 | [`02-模块-GlueCoding-多源数据/13-测试策略与质量门禁.md`](./02-模块-GlueCoding-多源数据/13-测试策略与质量门禁.md) |
| P1 | 实施里程碑 | [`02-模块-GlueCoding-多源数据/12-实施计划与里程碑.md`](./02-模块-GlueCoding-多源数据/12-实施计划与里程碑.md) |

### 3️⃣ 快速启动命令

```bash
# ① Mock 数据源（ira.vin 模拟）
cd ira-vin-mocks
pip install -r requirements.txt
python -m flask --app app:create_app run --port 8099

# ② M2 参考实现单测（先跑通再改）
cd m2-glue-reference
pip install -r requirements.txt
python -m pytest -q

# ③ React 运维台参考 UI
cd m2-glue-reference/frontend
npm install && npm run dev
```

---

## 核心契约速查

### API 端点（完整定义见 `09` §1）

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/ingest/health` | 健康检查 |
| `GET` | `/ingest/sources` | 数据源列表 |
| `GET` | `/ingest/sources/{sourceId}` | 数据源详情 |
| `POST` | `/ingest/jobs` | 触发同步任务 |
| `GET` | `/ingest/jobs` | 任务历史列表 |
| `GET` | `/ingest/jobs/{jobId}` | 任务详情 |

### 核心 DTO（完整定义见 `09` §2）

- **`DataSourceSummary`**：`sourceId`, `name`, `providerType`, `enabled`, `lastSuccessAt`, `lastJobStatus`, `configSummary`
- **`SyncJob`**：`jobId`, `sourceId`, `status`(`queued`/`running`/`success`/`failed`/`partial`/`cancelled`), `mode`, `stats`, `errors`

### 错误码（完整定义见 `09` §1.2）

| HTTP | Code | 说明 |
|------|------|------|
| 400 | `M2_VALIDATION_ERROR` | 参数非法 |
| 404 | `M2_SOURCE_NOT_FOUND` | 数据源不存在 |
| 409 | `M2_JOB_ALREADY_RUNNING` | 同源已有运行中任务 |
| 503 | `M2_UPSTREAM_UNAVAILABLE` | 上游数据源不可用 |

### 数据模型（完整定义见 `10`）

| 表名 | 说明 |
|------|------|
| `ingest_data_sources` | 数据源配置（`secret_ref` 引用，禁止明文） |
| `ingest_sync_jobs` | 同步任务记录 |
| `ingest_feed_items` | 可选缓冲表（M1 未联通时使用） |

---

## Mock 数据源（ira.vin）

| 数据源 | Mock 路径 | 归一化 `external_ref` |
|--------|-----------|----------------------|
| 新浪财经 | `GET ${IRA_VIN_MOCK_BASE}/mock/v1/sina/finance/news/list.json` | `sina:<id>` |
| 东方财富 | `GET ${IRA_VIN_MOCK_BASE}/mock/v1/eastmoney/api/news/flash` | `em:<art_code>` |
| Wind 快照 | `GET ${IRA_VIN_MOCK_BASE}/mock/v1/wind/market/snapshot?windCode=600519.SH` | 按 `10` 设计 |

> **环境变量**：`IRA_VIN_MOCK_BASE`（不含尾部 `/`），BFF/适配器 **勿写死 host**

---

## 架构与边界

### 逻辑架构

```
React SPA ↔ Flask API (/api/v1/ingest) ↔ Provider 适配器 ↔ 外部数据源 (Mock/Wind/Sina/东财)
                  ↓
         PostgreSQL (ingest_* 表)
                  ↓
         → M1 research_messages (成功路径写入)
         → M3 清洗文本导出 (P1)
```

### 兄弟模块边界

| 方向 | 约定 |
|------|------|
| → **M1** | 写入 `research_messages`（`source_system`=`glue`）；**不**经 M1 公开 REST 写入 |
| → **M3** | 只读导出/视图（P1，P0 不强制） |
| ← **CoPaw** | Cron/Skill 触发同步、MCP 封装数据源；批处理状态与幂等以 BFF + DB 为准 |

---

## 开发规范（必读）

1. **JSON 风格**：API 响应使用 `camelCase`，与 `09` 和全项目 OpenAPI 一致
2. **时间格式**：所有时间字段使用 **ISO-8601 UTC**
3. **密钥管理**：密钥仅通过 `secret_ref` 引用 KMS/环境变量，**禁止**明文入库或入 Spec
4. **幂等**：`POST /ingest/jobs` 建议支持 `Idempotency-Key`，相同 key 24h 内返回同一 `jobId`
5. **异步任务**：长任务使用异步 worker（线程/队列/FC），`POST /jobs` 立即返回 `queued`
6. **Blueprint**：后端使用 `data_pipeline_bp` 或 `ingest_bp`，前缀 `/api/v1/ingest`
7. **分支命名**：`feature/m2-<需求键>-<简述>`，如 `feature/m2-req-job-trigger`
8. **Commit 风格**：Conventional Commits — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

---

## 前端路由（React 运维台）

| 路由 | 职责 |
|------|------|
| `/ingest/sources` | 数据源卡片：状态、`lastSuccessAt`、启用开关 |
| `/ingest/jobs` | 任务历史表 + 筛选 `sourceId`/`status` |
| `/ingest/jobs/:jobId` | 详情：`stats`、`errors` 展开 |

- 页脚免责声明；运维页 **不** 展示 `secret_ref` 明文
- 触发任务后 **轮询** 或 **SSE**（P1）更新 `job.status`

---

## 里程碑与测试

> 详见 [`12-实施计划与里程碑.md`](./02-模块-GlueCoding-多源数据/12-实施计划与里程碑.md) 和 [`13-测试策略与质量门禁.md`](./02-模块-GlueCoding-多源数据/13-测试策略与质量门禁.md)

### 阶段目标

| 阶段 | 交付 | 关键 DoD |
|------|------|----------|
| **S0** | DB 迁移 + Mock Provider + 种子数据源 | `10` 表可建 |
| **S1** | `GET sources` + `POST jobs` + worker 骨架 | `09` 核心端点可用 |
| **S2** | `GET jobs` + 详情页 + 写 `ingest_feed_items`/M1 | 前后端跑通 |
| **S3** | 错误码、指标、`partial` 状态 | `09` §1.2 错误码对齐 |
| **S4** | 压测 + M1 联通验收 | `05` US-M2-001 通过 |

### 质量门禁

| 门禁 | 条件 | 阻塞 |
|------|------|------|
| G-M2-LINT | Lint 通过 | 是 |
| G-M2-UNIT | 单测全绿 | 是 |
| G-M2-INT | M2-I-JOB-01 + M2-I-FAIL-01 绿 | 是 |
| G-M2-SECRET | PR 不含明文密钥 | 是 |

---

## 扩展阅读索引

| 文档 | 路径 |
|------|------|
| 系统架构与技术选型 | [`02-模块-GlueCoding-多源数据/08-系统架构与技术选型.md`](./02-模块-GlueCoding-多源数据/08-系统架构与技术选型.md) |
| 非功能需求与约束 | [`02-模块-GlueCoding-多源数据/07-非功能需求与约束.md`](./02-模块-GlueCoding-多源数据/07-非功能需求与约束.md) |
| Agent 编排与安全 | [`02-模块-GlueCoding-多源数据/11-Agent编排与安全规格.md`](./02-模块-GlueCoding-多源数据/11-Agent编排与安全规格.md) |
| 需求追踪矩阵 | [`02-模块-GlueCoding-多源数据/14-需求追踪矩阵.md`](./02-模块-GlueCoding-多源数据/14-需求追踪矩阵.md) |
| 企业研发规范 | [`docs-5modules/00-全项目-企业研发规范-Mock.md`](../00-全项目-企业研发规范-Mock.md) |
| 阿里云资源清单 | [`docs-5modules/00-阿里云资源与CoPaw清单.md`](../00-阿里云资源与CoPaw清单.md) |
