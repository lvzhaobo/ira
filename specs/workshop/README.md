# Workshop 规格（统一真源）

本目录存放 **IRA 5 天 Workshop** 各模块的 **Proposal / Spec / TC / 任务拆解 / OpenAPI** 等契约类文档，与 `modules-practice/` 下的**练习代码**分离，便于产品、架构与研发在同一「书架」评审与版本管理。

## 布局

| 子目录 | 模块 | 练习代码（实现） |
|--------|------|------------------|
| [`module-03-knowledge-copaw/`](./module-03-knowledge-copaw/) | M3 知识库与问答（CoPaw 底座） | `modules-practice/module-03/` |

其他模块（M1 / M2 / M4 / M5）的规格后续可逐步迁入 `specs/workshop/<module-id>/`，与现有 `specs/copaw-repowiki/`（CoPaw 知识库）并存。

## 约定

- **相对路径**：各包内 Markdown 中的 `docs/`、`openapi/` 均相对于该包根目录（例如 `specs/workshop/module-03-knowledge-copaw/`）。
- **仓库根相对路径**：跨目录说明或 CI 中可使用 `specs/workshop/...` 自仓库根起算。
