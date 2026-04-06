# Spec：知识库与研报问答（CoPaw 作为 Workshop 底座）v0.1

> **文档类型**:规格说明(契约 / 行为 / 模块边界)  
> **版本**:v0.1  
> **状态**:**草案**(待 Proposal 评审通过后标为 **已冻结**)  
> **日期**:2026-04-03  
> **依赖**:`00-Proposal-知识库-CoPaw底座.md`(须 **评审通过** 后本文方可定稿冻结)  
> **约束**:本 Spec 为 **本目录内单环节** 开发与验收真源;实现时可映射到任意仓库结构,但 **对外行为与本章 API 与数据模型一致**。  
>  
> **相关规范**:  
> - API 设计遵循 [`docs/standards/api-design.md`](standards/api-design.md)  
> - 后端实现遵循 [`docs/standards/backend-coding.md`](standards/backend-coding.md)  
> - 前端实现遵循 [`docs/standards/frontend-coding.md`](standards/frontend-coding.md)  
> - 技术契约详见 [`openapi/kb-qa-contract.yaml`](../openapi/kb-qa-contract.yaml)

---

## 0. 「冻结 Spec」是什么（≠ archive）

| 概念 | 含义 |
|------|------|
| **冻结 Spec** | 将 **某一版本**（如本文 v0.1）的章节（尤其 §3～§7）定为 **唯一基准**：开发按此实现，验收按 `02-TC` 对照 **同一版本**。变更不再口头漂移，须 **修订 Spec**（升小版本/变更说明）并同步 TC。 |
| **不是 archive** | **冻结 ≠ 归档（archive）**。归档多指文档/代码进入 **历史库、只读分支或档案库** 的管理动作；**冻结**是 **契约状态**：文档仍活跃维护，只是 **当前实现线** 以该版为准。 |
| **流程** | **Proposal 评审通过** → 将本 Spec **定稿并标记「已冻结」**（可在文首 `状态` 与变更记录中写明日期）→ `02-TC` 对齐该冻结版。 |

---

## 1. 术语

| 术语 | 含义 |
|------|------|
| **BFF** | 面向前端/渠道的业务服务层，承载 REST 与组装逻辑。 |
| **CoPaw** | Workshop 选定的 Agent 平台：Skill、Workflow、可选 Channel/Cron。 |
| **知识文档** | 已入库的一条逻辑文档，含 `doc_id` 与元数据。 |
| **证据引用** | 问答返回中指向某文档（及可选位置）的结构化条目 `evidence_refs[]`。 |

---

## 2. 逻辑架构

```
                    ┌─────────────────────────────────────┐
                    │            CoPaw                     │
                    │  Chat / Agent  │  Workflow (可选)    │
                    │       │        │       │             │
                    │       ▼        ▼       ▼             │
                    │    Skill: 调用 HTTP 至 BFF           │
                    └───────────────┬─────────────────────┘
                                    │ HTTPS
                                    ▼
                    ┌─────────────────────────────────────┐
                    │              BFF                     │
                    │  /kb/*  /research/qa/*  /compliance/* │
                    │  入库 JSON · 组装 evidence · trace   │
                    └─────────────────────────────────────┘
```

**原则**：CoPaw **不**作为合规规则的唯一定义处；合规扫描若存在，**仍经 BFF 统一出口**（与 `00-Proposal` 分工一致）。

---

## 3. API 契约(P0 必实现行为)

> **说明**:本节定义 API 的**业务行为语义**,技术细节(数据类型、验证规则、示例)详见 [`openapi/kb-qa-contract.yaml`](../openapi/kb-qa-contract.yaml)。

基路径:`/api/v1`(实现可调整版本前缀,但 **路径语义** 与本节一致)。

### 3.1 获取知识文档列表

- **方法/路径**：`GET /kb/documents`
- **成功 200**：JSON

```json
{
  "items": [
    {
      "doc_id": "string",
      "title": "string",
      "source_filename": "string",
      "ingested_at": "string (ISO8601)",
      "status": "ready | indexing | error",
      "bytes": 0
    }
  ]
}
```

- **说明**：`items` 可为空数组；`status` 在仅元数据阶段可恒为 `ready`（须在部署说明或 `02` 中约定演示口径）。

### 3.2 索引/管线状态（演示）

- **方法/路径**：`GET /kb/index/status`
- **成功 200**：

```json
{
  "index_ver": "string",
  "updated_at": "string (ISO8601)",
  "status": "idle | indexing | ready | error"
}
```

- **说明**：Workshop 允许 **固定示意值**，但字段名 **不得** 与本节冲突；升级通过 **可选字段** 追加。

### 3.3 上传材料（入库）

- **方法/路径**：`POST /research/qa/upload`
- **请求**：`multipart/form-data`，字段名 `file`（单文件）；可选 `title`。
- **成功 200**：

```json
{
  "doc_id": "string",
  "trace_id": "string",
  "message": "string"
}
```

- **失败**：4xx/5xx + 统一错误体（见 §7）。

### 3.4 研报问答

- **方法/路径**：`POST /research/qa/ask`
- **请求** JSON：

```json
{
  "query": "string",
  "session_id": "string | null",
  "spec_version": "string | null"
}
```

- **成功 200**：

```json
{
  "answer": "string",
  "evidence_refs": [
    {
      "doc_id": "string",
      "page": 0,
      "ref": "string",
      "retrieval_score": 0.0
    }
  ],
  "trace_id": "string",
  "model": "string",
  "compliance": {
    "decline_reason": "string | null"
  }
}
```

- **无可靠证据时**：`evidence_refs` 为 `[]`，`answer` 为统一拒答模板（文案在实现中常量配置），`compliance.decline_reason` 可填如 `NO_EVIDENCE`（与 `02` 一致）。

---

## 4. 数据与存储（逻辑）

| 资源 | 说明 |
|------|------|
| 知识元数据 | 持久化集合，每条对应 `doc_id` 与 §3.1 字段子集。 |
| 追溯 | `trace_id` 在 upload 与 ask 中生成或传递，可关联血缘查询（若实现）。 |

不要求指定存储介质（JSON 文件、SQLite 均可），但 **行为** 须满足列表与问答一致性。

---

## 5. CoPaw 映射（本环节必须定义的设计项）

### 5.1 Skill（至少一项，P0）

| Skill 逻辑名 | 行为 | 入参来源 | 出参去向 |
|--------------|------|----------|----------|
| `ira_research_ask` | 将用户问题转为 `POST /research/qa/ask` | CoPaw 对话上下文 | 将 `answer`、`evidence_refs` 格式化展示 |

**约束**：Skill **仅通过 HTTP** 调 BFF；密钥与基 URL 来自环境配置，**不入库**。

### 5.2 Workflow（可选，P1）

示例：`ingest_then_notify` —— 上传成功 →（可选）调用 BFF 查询 `GET /kb/index/status` → 发送站内或 Channel 消息。**步骤名与顺序** 写在 Workshop 演示脚本即可，本 Spec 只要求 **与 §3 API 兼容**。

### 5.3 与「入库」的关系

- 上传可由 **前端直调 BFF** 或 **CoPaw 工具链** 触发；**同一 `doc_id` 语义** 在列表与问答中一致。

---

## 6. 工作分解（Tasks）与并行

### 6.1 Spec 里用 Tasks，不用 Quest 编号

| 用语 | 用在哪 | 含义 |
|------|--------|------|
| **Task（T-xx）** | **本 Spec、排期、依赖图** | 可交付的工作包，有明确完成条件；**契约层唯一推荐拆分层级**。 |
| **Quest（产品）** | Qoder IDE **Quest 模式** | 一次「自主执行」会话，可 **覆盖一个或多个 Task**；由执行人选 Local/Remote，**不写入 Spec**。 |
| **Quest（教学法）** | 讲义、教案 | 「大任务拆子任务」的叙事名，**逻辑上对应一串 Task 的顺序/并行关系**，不必与产品 Quest 一一同名。 |

**结论**：拆分 Spec 时 → 拆成 **Tasks（T-A～F 或你们自定义 T-01…）**；上机时用 **几条 Quest** 去跑完这些 Task，由执行人自行映射（例如「Quest-1 = T-A+T-B」）。

### 6.2 Task 列表与并行关系

| Task ID | 内容 | 前置依赖 | 可与谁并行 |
|---------|------|----------|------------|
| T-A | 冻结 §3 OpenAPI 片段与错误体 | 无 | — |
| T-B | BFF：`GET /kb/documents`、`GET /kb/index/status` | T-A | 与 T-C 并行若契约已冻结 |
| T-C | BFF：`POST .../upload` 写元数据 | T-A | 与 T-B 并行若字段已对齐 |
| T-D | BFF：`POST .../ask` + `evidence_refs` 组装 | T-C（至少需有元数据结构） | — |
| T-E | 前端或 CoPaw 演示：列表 + 提问 | T-B、T-D | T-F 可与 T-E 并行（不同仓库） |
| T-F | CoPaw Skill `ira_research_ask` | T-D | 见上 |

**说明**：若 **同一开发者** 修改同一契约文件，T-B 与 T-C 建议 **串行** 或通过 **先合并 T-A** 再分头实现。

---

## 7. 错误响应（统一形状）

```json
{
  "error": "string",
  "code": "string",
  "trace_id": "string | null"
}
```

HTTP 状态码：客户端错误 4xx，服务端/上游 5xx；**业务拒答**（无证据）仍用 **200 + 空证据**，不用本错误体代替（与问答产品语义一致）。

---

## 8. 安全与合规（最小）

- 上传文件类型与大小限制在实现中配置；本 Spec 要求 **超限返回 4xx** 且 `error` 可读。  
- 不在响应中返回 **密钥与原始 Token**。  
- 对外演示数据 **脱敏**。

---

## 9. 版本与演进

- 本文件 **v0.1**：Proposal 通过后，**冻结** P0 字段名与 §3 行为，作为开发与 TC 基准。  
- 破坏性变更：**路径或必填字段变更** 须 bump 主版本或新增 `/v2` 前缀；**新增可选字段** 不视为破坏（仍建议记入变更记录）。

---

## 10. 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-04-03 | 初稿：API、CoPaw 映射、任务 DAG；§0 冻结说明；§6 **Tasks vs Quest** 用语（Spec 只拆 Task） |
