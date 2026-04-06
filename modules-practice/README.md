# modules-practice · 模块练习区

与仓库根目录 **`ira/` 主项目**并列：这里按 **M1～M5 风格**拆成多个自包含（或半自包含）练习包，便于分天教学与对照实现。

> 模拟数据免责声明同仓库根 `README.md` / `AGENTS.md`。

## 产品 / 教务入口

| 文档 | 用途 |
|------|------|
| **[WORKSHOP-五天一页纸.md](./WORKSHOP-五天一页纸.md)** | 五天路线图、**每日产出物**、与 **`ira/`** 关系（建议打印或投屏） |

## 模块索引表

| 模块 | 路径 | 主题 | 建议融入天数 | 与 `ira/` 关系 | 入口文档 / 说明 |
|------|------|------|----------------|----------------|------------------|
| **M1 基础版** | `module-01-investment-assistant/` + **`specs/workshop/module-01-investment-assistant/`** | 独立投研对话小全栈（简化实现） | D1～D2 对照 | 与 `ira` **同命题不同体量**，适合讲「从 Demo 到平台」 | **规格**：[module-01-investment-assistant/README.md](../specs/workshop/module-01-investment-assistant/README.md) → `docs/`；**代码**：[module-01-investment-assistant/README.md](./module-01-investment-assistant/README.md) |
| **M2 多源数据** | `module-02/` + **`specs/workshop/module-02-glue-multisource/`** | GlueCoding：多源采集、清洗、调度、可观测 | D4 主练 | `ira` **不替代**本模块；讲数据管道与合规 Provider | **规格**：[module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/README.md](../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/README.md)；**代码**：[module-02/README.md](./module-02/README.md) |
| **M2 改进版** | `module-02-gule-coding-v2/` | Glue 静态页 / 样式练习（参考 / 输出 / `my-style`） | D4 选做或对比 | **无** `specs/workshop` 子包；Spec 以 **M2 主规格包** 为准 | [README.md](./module-02-gule-coding-v2/README.md)、`AGENTS.md`、`reference/README.md` |
| **M3 知识库** | `module-03/` + **`specs/workshop/module-03-knowledge-copaw/`** | 知识库与问答；**Proposal → Spec → TC**；CoPaw 分工 | **D3 核心** | 教「如何把能力接进类似 `ira` 的平台」 | **规格**：[specs/workshop/module-03-knowledge-copaw/docs/](../specs/workshop/module-03-knowledge-copaw/docs/)；**代码**：[module-03/README.md](./module-03/README.md) |
| **M4 推送** | `module-04/` + **`specs/workshop/module-04-notify/`** | 多渠道推送样例（Flask + React） | D4～D5 专题 | 叙事上可接工作台「触达/告警」 | **规格**：[module-04-notify/README.md](../specs/workshop/module-04-notify/README.md)；**样例**：[module-04/README.md](./module-04/README.md) |
| **M5 多 Agent** | `module-05/` + **`specs/workshop/module-05-multi-agent/`** | 多 Agent 基金投研平台（Flask + SQLAlchemy 等） | D4 加深 | 与 `ira` **编排深度**对照；子项目独立配置 | **规格**：[module-05-multi-agent/README.md](../specs/workshop/module-05-multi-agent/README.md)；**代码**：`backend/README.md`、`frontend/README.md` |

### Module 02：v1 与 v2 怎么选？

- **`module-02/`**：长篇规格在 **`specs/workshop/module-02-glue-multisource/`**，贴近「企业规范 + Mock」叙事。  
- **`module-02-gule-coding-v2/`**：另一套 **UI/胶水** 练习包；**不**迁入 `specs/workshop/`；长篇规格仍看 **`specs/workshop/module-02-glue-multisource/`**（目录名 `gule` 为历史拼写）。  
- **课堂建议**：时间紧选 **v1 文档 + 一个可运行子目录**；要做风格对比或第二轮班再用 v2。

## 与仓库其他目录

| 目录 | 与练习区关系 |
|------|----------------|
| `../ira/` | **主故事线应用**；练习模块不替代主线，备课时先锚定 `ira` 再下钻模块。 |
| `../copaw/` | AI 助手底座；与 **M3** 强相关。 |
| `../demo/`、`../samples/` | 演示与集成样例，见 **[../AGENTS.md](../AGENTS.md)**。 |
| `../specs/` | **`specs/workshop/`** 为 Workshop 模块契约真源（M1～M5 规格目录已就绪）；`copaw-repowiki/` 等为 CoPaw 参考。 |
