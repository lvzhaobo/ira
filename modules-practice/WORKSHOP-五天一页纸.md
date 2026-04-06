# 五天 Workshop：路线图 · 每日产出 · 与主项目关系（一页纸）

> **对象**：产品经理 + 研发（同业投研/平台方向均可）  
> **主项目（故事线）**：仓库内 **`ira/`** — 投研助手可运行原型（Flask API + Vite 前端，OpenAPI 对齐）  
> **`modules-practice/`**：按主题拆开的**练习与参考包**，技术栈与端口可能与 `ira/` 不完全相同，以各目录 README 为准。  
> **数据声明**：行情、研报摘要、情感等均为**示例/模拟**，仅供学习，**不构成投资建议**。

---

## 1. 与主项目 `ira/` 的关系（读这一表即可）

| 关系 | 说明 |
|------|------|
| **主线** | 全班统一先理解 **`ira/`**：产品形态、页面流程、API 边界；后续模块都可视作「主线某一能力的纵深或对照实验」。 |
| **对照** | **`module-01-investment-assistant/`** 为早期/简化版全栈，可与 `ira/` 对比「同一命题不同实现粒度」。 |
| **增强** | **`module-02`** 侧重多源数据与管道；**`module-03`** 侧重知识库 + CoPaw 集成与规格化交付；**`module-04`** 为推送样例；**`module-05`** 为多 Agent 投研平台练习。 |
| **底座** | **`copaw/`** 为开源 AI 助手底座；**`module-03`** 文档中明确 CoPaw 与 BFF 分工，适合讲「企业内如何落位」。 |
| **演示** | **`demo/`** + **`samples/`** 偏演示与集成样例，**不等于** `ira/` 的生产形态。 |

---

## 2. 五天路线图与每日产出

| 天 | 主题（课堂叙事） | 产品经理产出物（建议） | 研发产出物（建议） | 主要材料（路径） |
|----|------------------|------------------------|--------------------|------------------|
| **D1** | 认识投研助手原型与数据边界 | ① 能口述「演示数据 vs 生产」红线；② 画出 3～5 个核心用户任务（工作台级） | ① 本地跑通 `ira` 前后端；② 能说明前端如何代理到 API | `ira/README.md`、`../AGENTS.md`、`copaw/README.md`（浏览） |
| **D2** | 从界面回到契约：API 与模块边界 | ① 任选 1 条用户路径，写出「验收口径」草案（Given/When/Then 级） | ① 浏览 `ira/backend/app/blueprints/` 与 OpenAPI；② 跑通 `pytest` | `ira/backend/`、`ira/frontend/src/pages/` |
| **D3** | 知识库与 AI 底座分工 | ① 参与 Proposal/Spec 式评审 1 次（记录「范围外」清单）；② 明确 CoPaw vs BFF 职责 | ① 通读冻结 Spec 思路；②（可选）起 CoPaw 控制台 | **`specs/workshop/module-03-knowledge-copaw/docs/`**（`00`→`01`→`02`）、[`module-03/README.md`](./module-03/README.md) |
| **D4** | 数据集成与扩展能力 | ① 列出多源数据「来源—用途—留存—合规」四列简表；② 标出 1 个降级场景 | ① 跟练或走读 Glue 管道代码；② 了解 `module-05` 多 Agent 后端结构 | `module-02/`、`module-02-gule-coding-v2/`（二选一或对比）、`module-05/backend/README.md`、`samples/` |
| **D5** | 从代码到环境：部署与质量 | ① 画一张「Demo 环境 vs 真实生产」差异表（数据、模型、账号） | ① 读通 `demo/` 与一条 GitHub Actions 流程；②（可选）配置 pre-commit | `demo/`、`.github/workflows/`、`ira/docs/DEPLOY-GITHUB-ACTIONS.md` |

**打印提示**：若需严格一页 A4，可只打印 **§1 + §2**；§3 为模块速查，可另页或电子版保留。

---

## 3. 模块与主线对照（备课用一句话）

| 模块目录 | 和 `ira/` 的一句话关系 |
|----------|-------------------------|
| `module-01-investment-assistant` | 独立小全栈，理解「最小投研对话」时可对照 `ira`。 |
| `module-02` / `module-02-gule-coding-v2` | 主线外的 **数据胶水层** 纵深；`ira` 侧重产品全链路时可略读或专题讲。 |
| `module-03` | **规格化 + CoPaw 集成** 范本；教「怎么写冻结 Spec、怎么拆 Task」。 |
| `module-04` | **推送/渠道** 样例；与 `ira` 工作台可叙事为「通知侧能力」。 |
| `module-05` | **多 Agent + 基金域 API** 练习；与 `ira` 可叙事为「分析编排加深」。 |

---

## 4. 相关索引

- 全仓库导航：**[../AGENTS.md](../AGENTS.md)**  
- 模块目录与入口文档：**[README.md](./README.md)**（本目录）  
- **统一规格（Workshop）**：[../specs/workshop/README.md](../specs/workshop/README.md)
