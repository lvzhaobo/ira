# IRA Workshop 仓库

5 天投研助手（Investment Research Assistant）Workshop 用 **monorepo**：主应用、CoPaw 底座、分模块练习、Demo 与示例并存。

> 所有行情、报告、情感等均为**示例/模拟数据**，仅供技术演示与学习，**不构成投资建议**。

## 从这里开始

1. 阅读 **[AGENTS.md](./AGENTS.md)**：全景目录、端口、推荐学习路径。  
2. 运行主项目：**[main-project/README.md](./main-project/README.md)**（Flask + Vite）。  
3. 按天练习：**[modules-practice/](./modules-practice/)** 下各 `module-*`；**五天路线图与每日产出**见 **[modules-practice/WORKSHOP-五天一页纸.md](./modules-practice/WORKSHOP-五天一页纸.md)**。

## 顶层目录一览

| 目录 | 说明 |
|------|------|
| `main-project/` | 投研助手主应用（持续演进的原型） |
| `copaw/` | CoPaw 开源底座（AgentScope 生态） |
| `modules-practice/` | 分模块实验代码与文档 |
| `demo/` | 静态站 + Mock API + Nginx 配置，配合 CI 部署 |
| `samples/` | 与主课并列的独立示例 |
| `specs/` | Workshop 契约真源 **`specs/workshop/`** + CoPaw repowiki 等 |
| `data/` | 本地/共享数据目录（多数 JSON 未入库，见 `.gitignore`） |

内部研讨用的评估与梳理草案可放在 **`.tmp/`**（已忽略于 Git，不默认提交）。
