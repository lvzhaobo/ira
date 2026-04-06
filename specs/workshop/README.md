# Workshop 规格（统一真源）

本目录存放 **IRA 5 天 Workshop** 各模块的 **Proposal / Spec / TC / 任务拆解 / OpenAPI** 等契约类文档，与 `modules-practice/` 下的**练习代码**分离，便于产品、架构与研发在同一「书架」评审与版本管理。

## 布局

| 子目录 | 模块 | 练习代码（实现） |
|--------|------|------------------|
| [`module-02-glue-multisource/`](./module-02-glue-multisource/) | M2 GlueCoding 多源数据 | `modules-practice/module-02/` |
| [`module-03-knowledge-copaw/`](./module-03-knowledge-copaw/) | M3 知识库与问答（CoPaw 底座） | `modules-practice/module-03/` |
| [`module-01-investment-assistant/`](./module-01-investment-assistant/) | M1 投研助手基础版 | `modules-practice/module-01-investment-assistant/` |
| [`module-04-notify/`](./module-04-notify/) | M4 多渠道推送 | `modules-practice/module-04/` |
| [`module-05-multi-agent/`](./module-05-multi-agent/) | M5 多 Agent 投研 | `modules-practice/module-05/` |
| [`templates/`](./templates/) | Spec 变更模板库 | 全组通用（CR/影响分析/回退） |
| [`deploy-templates-ecs/`](./deploy-templates-ecs/) | ECS 部署模板包（Nginx 之外） | `ira/`（部署工程模板） |

全项目级 Mock（跨模块引用）：[`00-全项目-企业研发规范-Mock.md`](./00-全项目-企业研发规范-Mock.md)、[`00-阿里云资源与CoPaw清单.md`](./00-阿里云资源与CoPaw清单.md)、[`00-CoPaw与五模块对接指南.md`](./00-CoPaw与五模块对接指南.md)。与现有 `specs/copaw-repowiki/`（CoPaw 知识库）并存。

## 约定

- **长篇规格**：M1 / M2 / M3 / M4 / M5 均在各自包下的 **`docs/`**（M2 另有子目录 `docs/02-模块-GlueCoding-多源数据/`）；包根仅保留 **`README.md`**、（如有）**`Agents.md`**、（M3）**`openapi/`**。
- **例外**：`modules-practice/module-02-gule-coding-v2/`（Glue UI 练习包）**不**对应 `specs/workshop` 子目录；M2 契约仍以 **`module-02-glue-multisource`** 为真源。
- **相对路径**：包内互链以当前 Markdown 所在目录为基准；指向全项目 `00-*` 时，自 `docs/` 下文件一般使用 **`../../00-*.md`**（即到 `specs/workshop/`）。
- **仓库根相对路径**：CI 或脚本中可使用 `specs/workshop/...`。

## 契约真源优先级（冲突时）

1. **模块 `docs/` +（如有）`openapi/`**：行为、字段、错误体、验收口径以此为准。  
2. **模块练习代码（`modules-practice/module-*`）**：实现可演进，但不得与 `docs/` 冻结契约冲突。  
3. **演示页 / 样例 / agent 辅助文档**：仅作实现参考，不覆盖契约真源。

## 冻结点建议（5天班级）

- **D2 结束**：冻结接口命名与路径前缀（避免 D3 联调漂移）。  
- **D3 结束**：冻结关键返回体与错误体（后续仅允许向后兼容新增可选字段）。  
- 若需变更，先改 `specs/workshop/.../docs` 再改代码，并记录版本说明。
