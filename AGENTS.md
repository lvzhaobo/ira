# IRA Workshop 项目导航地图

> **项目定位**：5天投研助手（Investment Research Assistant）Workshop 学习演示项目，包含主项目、CoPaw 底座、Demo 部署和多个模块练习。
>
> ⚠️ **声明**：所有股票数据、分析报告、情感分析结果等均为**示例/模拟数据**，仅供技术演示和学习使用，**不构成任何投资建议**。

---


## 📊 项目全景图

```
ira-workspace/
├── ira/                      # 🎯 主项目：投研助手原型（monorepo）
├── copaw/                    # 🤖 CoPaw：AI 助手底座（AgentScope 开源项目）
├── demo/                     # 🚀 Demo：演示部署项目（Nginx + Mock API）
├── modules-practice/         # 📚 模块练习：5个独立学习模块
├── samples/                  # 💡 示例项目
├── specs/                    # 📋 需求规格文档
├── data/                     # 💾 共享数据目录
└── .github/workflows/        # ⚙️ CI/CD 自动化部署
```

---

## 🎯 核心项目

### 1. ira/ - 投研助手主项目

**技术栈**：
- **后端**：Flask 3.x | Python ≥ 3.8 | `/api/v1` 对齐 OpenAPI
- **前端**：React + Vite + React Router + TypeScript
- **数据**：JSON 文件存储（`data/*.json`）

**目录结构**：
```
ira/
├── backend/app/
│   ├── blueprints/          # 14个API路由模块
│   ├── services/            # 7个业务服务
│   ├── config.py            # 配置管理
│   ├── openapi_spec.py      # OpenAPI 规范（31.6KB）
│   └── json_store.py        # JSON数据存储
├── frontend/src/
│   ├── pages/               # 16个页面组件
│   ├── components/          # 6个通用组件
│   ├── api/                 # API客户端
│   ├── data/                # 7个数据文件
│   └── config/              # 3个配置文件
├── scripts/                 # 部署脚本、数据种子
├── config/                  # 认证配置
└── docs/                    # 部署文档、架构图
```

**快速启动**：
```powershell
# 1. 数据种子（可选）
python scripts/seed_data.py

# 2. 后端（新终端）
cd backend
pip install -r requirements.txt
$env:IRA_DATA_DIR = "$(Resolve-Path ..\data)\"
python -m flask --app wsgi run --port 5000

# 3. 前端（新终端）
cd frontend
npm install
npm run dev
```

**测试**：
```powershell
cd backend
$env:PYTHONPATH = "."
python -m pytest tests -q
```

---

### 2. copaw/ - AI 助手底座

**项目简介**：CoPaw 是 AgentScope 团队的开源个人 AI 助手项目，提供多Agent协作、多渠道接入、技能扩展等能力。

**核心能力**：
- 🧠 **多Agent系统**：后台任务支持、优先级队列、Agent启停控制
- 🔌 **多渠道接入**：钉钉、飞书、微信、Discord、Telegram 等
- 🛠️ **技能扩展**：定时任务、PDF/Office处理、新闻摘要、自定义技能自动加载
- 🔒 **多层安全**：工具守卫、文件访问控制、技能安全扫描
- 🌐 **本地部署**：数据本地存储，支持 llama.cpp/Ollama/LM Studio 本地模型

**目录结构**：
```
copaw/
├── src/copaw/
│   ├── agents/              # 10个Agent实现 + 6个子目录
│   ├── app/                 # 9个核心文件 + 7个子目录
│   ├── cli/                 # 21个CLI命令
│   ├── providers/           # 13个模型提供商
│   ├── security/            # 安全模块
│   ├── tunnel/              # 隧道服务
│   └── token_usage/         # Token使用统计
├── console/                 # 控制台前端（React + Vite）
├── website/                 # 官方网站
├── tests/                   # 单元测试 + 集成测试
└── scripts/                 # 安装、打包、Docker构建
```

**快速启动**：
```bash
# 方式1：pip安装
pip install copaw
copaw init --defaults
copaw app

# 方式2：脚本安装
curl -fsSL https://copaw.agentscope.io/install.sh | bash

# 方式3：Docker
docker pull agentscope/copaw:latest
docker run -p 127.0.0.1:8088:8088 \
  -v copaw-data:/app/working \
  -v copaw-secrets:/app/working.secret \
  agentscope/copaw:latest
```

**访问控制台**：http://127.0.0.1:8088/

---

### 3. demo/ - 演示部署项目

**技术栈**：
- **Web服务器**：Nginx
- **Mock API**：Flask（Python）
- **静态页面**：HTML + CSS + JS

**目录结构**：
```
demo/
├── mock-api/
│   ├── app.py               # Mock API服务
│   └── requirements.txt     # Python依赖
├── nginx/
│   └── ira-demo.conf        # Nginx配置
├── scripts/
│   └── deploy-demo.sh       # 部署脚本
└── static/
    ├── index.html           # 演示首页
    ├── css/                 # 样式文件
    └── js/                  # JavaScript文件
```

**GitHub Actions 自动部署**：
- **触发条件**：`demo/**` 路径变更推送到 `main` 分支
- **部署流程**：
  1. 上传 Nginx 配置到 ECS
  2. 配置 systemd 服务
  3. 上传 Mock API 和静态文件
  4. 自动重启服务
- **访问地址**：
  - 静态网页：http://{ECS_HOST}/demo/
  - Mock API：http://{ECS_HOST}/mock-api/

---

## 📚 模块练习（modules-practice/）

### Module 01：投研助手基础版
- **路径**：`module-01-investment-assistant/`
- **内容**：完整的前后端实现（独立于主项目ira/）
- **用途**：基础功能学习和对比参考

### Module 02：GlueCoding 多源数据集成
- **路径**：`module-02/`
- **内容**：
  - `02-模块-GlueCoding-多源数据/` - 多源数据集成文档
  - `ira-vin-mocks/` - VIN Mock 服务
  - `m2-glue-production/` - 生产环境代码
  - `m2-glue-reference/` - 参考实现
  - `ui-master-demo/` - UI 演示
- **用途**：学习多源数据整合和 GlueCoding 工作流

### Module 02 v2：GlueCoding 改进版
- **路径**：`module-02-gule-coding-v2/`
- **内容**：
  - `reference/` - 参考实现（5个子目录）
  - `output/` - 输出示例
  - `my-style/` - 自定义风格
  - `AGENTS.md` - Agent 配置
- **用途**：改进版 GlueCoding 实践

### Module 03：知识库与问答（CoPaw底座）
- **路径**：`module-03/`
- **技术栈**：CoPaw 作为集成与编排底座
- **文档**：
  - `docs/00-Proposal-知识库-CoPaw底座.md` - 立项与范围
  - `docs/01-Spec-知识库与问答-CoPaw底座-v0.1.md` - API契约（冻结版）
  - `docs/02-验收清单与TC.md` - 验收标准
  - `docs/03-任务地图与Qoder-Quest执行指南.md` - 任务地图
  - `docs/tasks/T-A.md ~ T-F.md` - 具体任务
- **架构**：CoPaw 负责对话入口、Skill、Workflow；BFF 负责 REST、入库、组装
- **用途**：学习基于 CoPaw 构建知识库问答系统

### Module 04：（待开发）
- **路径**：`module-04/`
- **状态**：空目录，待填充

### Module 05：高级功能模块
- **路径**：`module-05/`
- **内容**：
  - `backend/` - 后端实现（14个配置文件）
  - `frontend/` - 前端实现（10个配置文件）
  - `.qoder/agents/` - 9个Agent配置
- **用途**：高级功能实践

---

## 💡 示例项目（samples/）

### 01-qoder-cli-with-dingtalk
- **路径**：`samples/01-qoder-cli-with-dingtalk/`
- **技术栈**：Node.js + Express
- **功能**：Qoder CLI 与钉钉集成示例
- **目录结构**：
  ```
  src/
  ├── logs/                  # 日志模块
  ├── modules/               # 功能模块（4个）
  └── utils/                 # 工具函数
  ```
- **配置文件**：
  - `ecosystem.config.js` - PM2配置
  - `dingtalk-qoder.service` - systemd服务
  - `nginx.conf.example` - Nginx配置示例

---

## ⚙️ CI/CD 工作流

### GitHub Actions 工作流列表

| 工作流 | 文件 | 触发条件 | 用途 |
|--------|------|----------|------|
| **部署Demo** | `.github/workflows/deploy-demo.yml` | `demo/**` 变更推送到 main | 自动部署Demo到ECS |
| **部署Dev** | `.github/workflows/deploy-dev.yml` | 待配置 | 开发环境部署 |
| **部署Prod** | `.github/workflows/deploy-prod.yml` | 待配置 | 生产环境部署 |
| **E2E测试** | `.github/workflows/e2e-tests.yml` | 待配置 | 端到端自动化测试 |
| **AI代码审查** | `.github/workflows/ai-code-review.yml` | 待配置 | AI辅助代码审查 |

### Demo部署工作流详解

**触发方式**：
- 手动触发（workflow_dispatch）：需要输入确认
- 自动触发：`demo/**` 路径变更推送到 `main` 分支

**部署步骤**：
1. 📥 检出代码
2. 📦 备份现有Nginx配置
3. 📤 上传新Nginx配置
4. 🔧 应用并重载Nginx
5. 📤 上传Demo文件（Mock API + 静态文件）
6. 🚀 配置systemd服务并启动Mock API
7. ✅ 部署成功通知

**需要的Secrets**：
- `ECS_HOST` - ECS服务器地址
- `ECS_USER` - SSH用户名
- `ECS_PASSWORD` - SSH密码

---

## 📋 规格文档（specs/）

### copaw-repowiki/
- **路径**：`specs/copaw-repowiki/`
- **内容**：CoPaw项目知识库文档
- **结构**：
  - `content/` - 文档内容（8个子目录）
  - `meta/` - 元数据

### module-01/
- **路径**：`specs/module-01/`
- **内容**：Module 01 需求规格（待补充）

---

## 🔧 开发工具配置

### Pre-commit 配置
- **根配置**：`.pre-commit-config.yaml`
- **IRA配置**：`ira/workshop/.pre-commit-config.yaml`
- **CoPaw配置**：`copaw/.pre-commit-config.yaml`

### 代码质量工具
- **Python**：
  - Black（代码格式化）
  - Flake8（代码检查）
  - isort（导入排序）
  - MyPy（类型检查）
- **前端**：
  - ESLint（代码检查）
  - Prettier（代码格式化）

### Qoder 配置
- **路径**：`.qoder/`
- **内容**：
  - `agents/` - Agent配置
  - `skills/` - 技能配置

---

## 🗂️ 数据管理

### 数据目录
- **共享数据**：`data/`（JSON文件，被 `.gitignore` 忽略）
- **初始化脚本**：`ira/scripts/seed_data.py`
- **上传目录**：`data/uploads/`（被忽略）

### 环境配置
- **示例配置**：`.env.example`、`ira/frontend/.env.example`
- **实际配置**：`.env`、`.env.*`（被 `.gitignore` 忽略）
- **密钥文件**：`config/auth_login.json`

---

## 🚀 快速参考

### 常用命令

```powershell
# ==================== IRA 主项目 ====================
# 启动后端
cd ira/backend
pip install -r requirements.txt
$env:IRA_DATA_DIR = "$(Resolve-Path ..\data)\"
python -m flask --app wsgi run --port 5000

# 启动前端
cd ira/frontend
npm install
npm run dev

# 运行测试
cd ira/backend
$env:PYTHONPATH = "."
python -m pytest tests -q

# ==================== CoPaw ====================
# 安装并启动
pip install copaw
copaw init --defaults
copaw app

# ==================== Demo部署 ====================
# 手动触发GitHub Actions
# 1. 推送到 main 分支的 demo/** 路径
# 2. 或在 GitHub Actions 页面手动触发

# ==================== 代码质量 ====================
# 运行pre-commit
pre-commit run --all-files

# 格式化Python代码
black ira/backend/
isort ira/backend/

# 格式化前端代码
cd ira/frontend
npx prettier --write "src/**/*.{ts,tsx}"
```

### 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| IRA Backend | 5000 | Flask API服务 |
| IRA Frontend | 5173 | Vite开发服务器 |
| CoPaw Console | 8088 | Web控制台 |
| Demo Nginx | 80/443 | 演示网站 |
| Mock API | 5001 | Demo Mock服务 |

### 关键路径

| 资源 | 路径 |
|------|------|
| IRA OpenAPI规范 | `ira/backend/app/openapi_spec.py` |
| IRA API蓝图 | `ira/backend/app/blueprints/`（14个模块） |
| IRA前端页面 | `ira/frontend/src/pages/`（16个页面） |
| CoPaw Agent实现 | `copaw/src/copaw/agents/` |
| CoPaw CLI命令 | `copaw/src/copaw/cli/`（21个命令） |
| Demo Nginx配置 | `demo/nginx/ira-demo.conf` |
| 部署工作流 | `.github/workflows/deploy-demo.yml` |

---

## 📖 学习路径建议

### 第1天：基础熟悉
1. 阅读 `ira/README.md` 了解主项目
2. 启动 IRA 前后端，熟悉界面和功能
3. 浏览 `copaw/README.md` 了解CoPaw能力

### 第2天：深入IRA
1. 研究 `ira/backend/app/blueprints/` 了解API设计
2. 查看 `ira/frontend/src/pages/` 了解前端架构
3. 运行测试，理解测试策略

### 第3天：CoPaw集成
1. 学习 `module-03/` 了解基于CoPaw的知识库实现
2. 阅读冻结版Spec文档
3. 尝试启动CoPaw并配置模型

### 第4天：模块练习
1. 完成 `module-02/` GlueCoding多源数据集成
2. 探索 `module-05/` 高级功能
3. 研究示例项目 `samples/`

### 第5天：部署与CI/CD
1. 学习 `.github/workflows/` 自动化部署
2. 理解Demo项目的ECS部署流程
3. 配置代码质量工具（pre-commit）

---

## 🔗 相关链接

- **CoPaw 官方文档**：https://copaw.agentscope.io/
- **CoPaw GitHub**：https://github.com/agentscope-ai/CoPaw
- **AgentScope**：https://github.com/agentscope-ai/agentscope
- **IRA 部署文档**：`ira/docs/DEPLOY-GITHUB-ACTIONS.md`

---

## 📝 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-04-06 | 初始版本，覆盖完整项目结构 |

---

> **提示**：本文档为项目导航地图，帮助快速定位和理解项目结构。具体实现细节请参考各子项目的README和文档。
