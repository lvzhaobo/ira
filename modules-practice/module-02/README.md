# Module 02 · GlueCoding 多源数据（M2）

多源行情与资讯的采集、清洗、调度与可观测；强调**数据管道**、失败降级与可审计批处理（而非用对话 Agent 替代调度核心）。

## 本目录一览

| 子目录 | 说明 |
|--------|------|
| `02-模块-GlueCoding-多源数据/` | **主文档包**（`01`～`14` Markdown；阅读顺序见该目录 `README.md`） |
| `ira-vin-mocks/` | VIN / 数据源 Mock 服务 |
| `m2-glue-production/` | 生产侧参考实现 |
| `m2-glue-reference/` | 参考实现（含前端子工程） |
| `ui-master-demo/` | UI 演示 |

## 与主项目 `ira/`、CoPaw

- 向「工作台类应用」提供统一写入接口或主题；可与知识库（M3）选用同一套清洗结果。  
- CoPaw 侧：**Cron / Skill** 触发同步、HTTP 调 BFF 等模式见 `02-模块-GlueCoding-多源数据/README.md` §集成说明。

## 改进版（另一套组织）

仓库内另有 **`module-02-gule-coding-v2/`**（历史目录名拼写），用于对比练习路径与产出样式；与 **本目录** 二选一或分班使用即可。

## 班级入口

1. 打开 **`02-模块-GlueCoding-多源数据/README.md`** 看模块目标与阅读顺序。  
2. 全五天叙事与产出物：**[../WORKSHOP-五天一页纸.md](../WORKSHOP-五天一页纸.md)**。
