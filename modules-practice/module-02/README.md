# Module 02 · GlueCoding 多源数据（M2）

多源行情与资讯的采集、清洗、调度与可观测；强调数据管道与失败降级。

## 规格真源（统一在 `specs/`）

长篇规格、Agent 指南与 **`03`～`14` 文档包**已迁至：

| 内容 | 路径 |
|------|------|
| **M2 规格包** | **[`specs/workshop/module-02-glue-multisource/`](../../specs/workshop/module-02-glue-multisource/)** |
| **主文档与阅读顺序** | [`docs/02-模块-GlueCoding-多源数据/README.md`](../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/README.md) |
| **Agent 开发指南** | [`Agents.md`](../../specs/workshop/module-02-glue-multisource/Agents.md) |
| **全项目规范 Mock** | [`specs/workshop/00-全项目-企业研发规范-Mock.md`](../../specs/workshop/00-全项目-企业研发规范-Mock.md)（占位，可补全） |

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

## 改进版（另一套组织）

仓库内另有 **`module-02-gule-coding-v2/`**，可与本模块对照使用。

## 班级入口

1. 打开 **[`specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/README.md`](../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/README.md)** 看模块目标与阅读顺序。  
2. 全五天叙事与产出物：**[../WORKSHOP-五天一页纸.md](../WORKSHOP-五天一页纸.md)**。
