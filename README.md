# 投研助手 Workshop · 可运行原型（monorepo）

> ⚠️ **声明**：本项目为 Workshop 学习演示原型，所有股票数据、分析报告、情感分析结果等均为**示例/模拟数据**，仅供技术演示和学习使用，**不构成任何投资建议或真实数据展示**。

- **后端**：Flask 3.x，**Python ≥ 3.8**（阿里云 ECS 默认 3.6 不可用，请单独安装 3.9+ 并建 `.venv`），`/api/v1` 对齐 OpenAPI
- **前端**：React + Vite + React Router，开发代理到 `localhost:5000`
- **数据**：`data/*.json`（可 `python scripts/seed_data.py` 初始化）

## 快速开始

```powershell
# 在仓库根目录（本目录）执行
# 1) 数据种子（可选，首次建议执行）
python scripts/seed_data.py

# 2) 后端（新终端）
cd backend
pip install -r requirements.txt
$env:IRA_DATA_DIR = "$(Resolve-Path ..\data)\"
python -m flask --app wsgi run --port 5000

# 3) 前端（新终端）
cd frontend
npm install
npm run dev
```

生产构建：`npm install` 后执行 `npx vite build`（输出 `dist/`）。若 `npm run build` 报找不到 `vite`，请先完整安装依赖。

浏览器打开 Vite 提示的地址（默认 `http://localhost:5173`）。工作台会请求 `/api/v1/system/health`（经 proxy）。

## 测试

```powershell
cd backend
$env:PYTHONPATH = "."
python -m pytest tests -q
```

## 文档

- 方案与任务清单：`../投研助手-5天Workshop-产品原型实现方案-Vue-Flask-JSON.md`、`../投研助手-Workshop-任务清单.md`
- 构建与问题记录：`docs/WORKSHOP-BUILD-LOG.md`（若存在）
- **ECS 部署与 GitHub Actions**：`docs/DEPLOY-GITHUB-ACTIONS.md`
- **本机双路径说明**（`ira/ira` vs `sample/.../ira-workshop`）：`docs/WORKSPACE-双路径说明.md`
