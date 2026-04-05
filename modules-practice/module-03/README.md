# quest-20260403 · 知识库环节（CoPaw 底座）单环节资料包

本目录为 Workshop **单环节** 自洽材料，严格 **三段式**：**Proposal → Spec（冻结）→ TC**，以 **CoPaw 作为集成与编排的基础底座** 叙述；**不要求**依赖本目录外的代码或文档即可完成设计与评审。

**流程**：先 **[Proposal 评审通过](./docs/00-Proposal-知识库-CoPaw底座.md)**，再将 **[Spec](./docs/01-Spec-知识库与问答-CoPaw底座-v0.1.md)** 定稿并 **冻结**（含义见 Spec §0，**不是** archive），**[TC](./docs/02-验收清单与TC.md)** 对齐该冻结版。

## 文档清单（推荐阅读顺序）

| 序号 | 文档 | 说明 |
|------|------|------|
| 1 | [docs/00-Proposal-知识库-CoPaw底座.md](./docs/00-Proposal-知识库-CoPaw底座.md) | 立项与范围：**评审通过后再冻结 Spec** |
| 2 | [docs/01-Spec-知识库与问答-CoPaw底座-v0.1.md](./docs/01-Spec-知识库与问答-CoPaw底座-v0.1.md) | API 契约、CoPaw 映射；**冻结后为开发/验收真源** |
| 3 | [docs/02-验收清单与TC.md](./docs/02-验收清单与TC.md) | AC / TC，对齐 **已冻结 Spec** |

### 上机执行（Qoder Quest）

| 序号 | 文档 | 说明 |
|------|------|------|
| 4 | [docs/03-任务地图与Qoder-Quest执行指南.md](./docs/03-任务地图与Qoder-Quest执行指南.md) | **整体地图**、依赖图、**API/JSON 统一约定**（防风格漂移） |
| 5 | [docs/tasks/README.md](./docs/tasks/README.md) | **Task 索引**；各 Task 见同目录 `T-A.md`～`T-F.md`（含 **Quest 输入模板**） |

**建议**：每开一个 Qoder Quest，附上 **`03` §3** + **当前 `tasks/T-*.md`**；一 Task 一 Quest 最稳。

## 可选补充（教学法，非契约）

| 文档 | 说明 |
|------|------|
| [docs/投研助手-knowledge-Qoder-Quest-设计方案.md](./docs/投研助手-knowledge-Qoder-Quest-设计方案.md) | **Qoder Quest** 拆条、Local/Remote、IRA 路径对照；**不替代** `01-Spec`。仅文档评审可忽略；上机练 Quest 或对接 IRA 代码时再看。 |

## 项目能否基于 CoPaw 开发？

**可以。** 本包在 Proposal 与 Spec 中已约定：**CoPaw 负责对话入口、Skill、Workflow**；**BFF 负责 REST、入库、组装 `evidence_refs` 与 trace**。实现时以 **`01` 冻结版** 契约为准。
