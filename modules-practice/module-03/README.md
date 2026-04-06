# M3 · 知识库环节（CoPaw 底座）— 练习代码

本目录为 Workshop **Module 03** 的 **上机实现与联调**（BFF 示例、`frontend/` 最小页、CoPaw Skill 等）。

## 规格真源（统一在 `specs/`）

契约、验收与任务拆解 **不在本目录**：请以仓库 **`specs/workshop/module-03-knowledge-copaw/`** 为真源（与代码分离，便于评审与版本管理）。

**流程**：先 **[Proposal 评审通过](../../specs/workshop/module-03-knowledge-copaw/docs/00-Proposal-知识库-CoPaw底座.md)**，再 **[Spec](../../specs/workshop/module-03-knowledge-copaw/docs/01-Spec-知识库与问答-CoPaw底座-v0.1.md)** 定稿并 **冻结**，**[TC](../../specs/workshop/module-03-knowledge-copaw/docs/02-验收清单与TC.md)** 对齐冻结版。

## 文档清单（推荐阅读顺序）

| 序号 | 文档 | 说明 |
|------|------|------|
| 1 | [00-Proposal…](../../specs/workshop/module-03-knowledge-copaw/docs/00-Proposal-知识库-CoPaw底座.md) | 立项与范围：**评审通过后再冻结 Spec** |
| 2 | [01-Spec…](../../specs/workshop/module-03-knowledge-copaw/docs/01-Spec-知识库与问答-CoPaw底座-v0.1.md) | API 契约、CoPaw 映射；**冻结后为开发/验收真源** |
| 3 | [02-TC…](../../specs/workshop/module-03-knowledge-copaw/docs/02-验收清单与TC.md) | AC / TC，对齐 **已冻结 Spec** |

### 上机执行（Qoder Quest）

| 序号 | 文档 | 说明 |
|------|------|------|
| 4 | [03-任务地图…](../../specs/workshop/module-03-knowledge-copaw/docs/03-任务地图与Qoder-Quest执行指南.md) | **整体地图**、依赖图、**API/JSON 统一约定** |
| 5 | [tasks/README](../../specs/workshop/module-03-knowledge-copaw/docs/tasks/README.md) | **Task 索引**；各 Task 见同目录 `T-A.md`～`T-F.md` |

**建议**：每开一个 Qoder Quest，附上 **`03` §3** + **当前 `tasks/T-*.md`**；一 Task 一 Quest 最稳。

## 可选补充（教学法，非契约）

| 文档 | 说明 |
|------|------|
| [投研助手-knowledge-Qoder-Quest-设计方案](../../specs/workshop/module-03-knowledge-copaw/docs/投研助手-knowledge-Qoder-Quest-设计方案.md) | Qoder Quest 拆条、IRA 路径对照；**不替代** `01-Spec` |

## OpenAPI

- [kb-qa-contract.yaml](../../specs/workshop/module-03-knowledge-copaw/openapi/kb-qa-contract.yaml)

## 项目能否基于 CoPaw 开发？

**可以。** Proposal 与 Spec 中已约定：**CoPaw 负责对话入口、Skill、Workflow**；**BFF 负责 REST、入库、组装 `evidence_refs` 与 trace**。实现时以 **`01` 冻结版** 契约为准。

## 旧路径说明

历史上文档曾放在本目录下的 `docs/`、`openapi/`；已迁入 `specs/workshop/module-03-knowledge-copaw/`。若本地仍有书签，请见 [docs/README.md](./docs/README.md) 重定向说明。
