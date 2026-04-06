# Module 02 · GlueCoding 多源数据（M2）

多源行情与资讯的采集、清洗、调度与可观测；强调数据管道与失败降级。

## 规格真源（统一在 `specs/`）

长篇规格、Agent 指南与 **`03`～`14` 文档包**已迁至：

| 内容 | 路径 |
|------|------|
| **M2 规格包** | **[`specs/workshop/module-02-glue-multisource/`](../../specs/workshop/module-02-glue-multisource/)** |
| **主文档与阅读顺序** | [`docs/02-模块-GlueCoding-多源数据/README.md`](../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/README.md) |
| **Agent 开发指南** | [`Agents.md`](../../specs/workshop/module-02-glue-multisource/Agents.md) |
| **全项目规范 Mock** | [`specs/workshop/00-全项目-企业研发规范-Mock.md`](../../specs/workshop/00-全项目-企业研发规范-Mock.md) |

## 本目录（练习代码与演示）

| 子目录 | 说明 |
|--------|------|
| `ira-vin-mocks/` | VIN Mock 服务 |
| `m2-glue-production/` | 生产侧参考实现 |
| `m2-glue-reference/` | 参考实现（含前端子工程） |
| `ui-master-demo/` | UI 演示 |

## CoPaw 与本模块

- **推荐**：**Cron** 或 **Skill** 触发同步任务 → HTTP 调本模块 BFF；**MCP** 封装外部数据源（合规 Provider），BFF 只认结构化结果。  
- 详见规格包内 **`02-模块-GlueCoding-多源数据/README.md`** §集成说明。

## 课程端口口径（建议）

- M2 子目录存在多个演示进程（Mock / BFF / 参考前端），课堂建议统一说明：
  - 后端服务优先 `5000`（若与其他模块并行，可临时改端口并标注）。
  - `ira-vin-mocks` 常用 `8099` 作为外部源模拟端口。
  - 前端按各子工程默认端口运行（例如 Vite 默认 5173/5174）。

## 改进版（另一套组织）

仓库内另有 **`module-02-gule-coding-v2/`**（Glue 静态页 / 样式练习，**不**迁入 `specs/workshop/`），可与本模块对照；**规格**仍以 **`specs/workshop/module-02-glue-multisource/`** 为准。见 [module-02-gule-coding-v2/README.md](../module-02-gule-coding-v2/README.md)。

## 班级入口

1. 打开 **[`specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/README.md`](../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/README.md)** 看模块目标与阅读顺序。  
2. 全五天叙事与产出物：**[../WORKSHOP-五天一页纸.md](../WORKSHOP-五天一页纸.md)**。
