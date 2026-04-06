# C-NotifyPush

M4 模块 **Sample**：多渠道推送（Flask + React），与课程 Spec（`05` / `09` / `10`）对齐的可运行参考实现。

## 环境要求

- Python 3.10+（建议 3.11）
- Node.js 18+ 与 npm

## 启动方式一览

| 方式 | 适用场景 |
|------|----------|
| **Cursor / VS Code**：打开本文件夹为工作区，**Ctrl+Shift+B** | Windows / macOS / Linux，并行起后端 + 前端 |
| **`start.bat`** | Windows，双击或 CMD 中运行；会开两个控制台窗口 |
| **`start.ps1`** | Windows PowerShell：`.\start.ps1`（无需双击 bat） |
| **`start.sh`** | Linux / macOS；ECS 可用 `START_MODE=prod` 做构建 + Gunicorn |

首次使用前建议在终端手动各执行一次依赖安装（若脚本未跑过）：

```bash
cd backend && python -m pip install -r requirements.txt
cd ../frontend && npm install
```

## Windows（手动）

```text
# 终端 1
cd backend
python app.py

# 终端 2
cd frontend
npm start
```

无 `python` 时可改用 `py -3`。

## Linux / macOS：`start.sh`

```bash
chmod +x start.sh
./start.sh
```

- 开发：后端日志在 `logs/backend.log`，前端监听 `0.0.0.0:3000`。
- 生产预览：`START_MODE=prod ./start.sh`（`npm run build` + Gunicorn；静态文件需配合 Nginx，见脚本内注释）。

## 访问地址

- 后端：<http://127.0.0.1:5000/api/v1/notify/health>
- 前端：<http://localhost:3000>

## 目录结构（摘要）

| 路径 | 说明 |
|------|------|
| `backend/` | Flask、`notify` 蓝图 |
| `frontend/` | React 运维页 |
| `.vscode/tasks.json` | 编辑器一键启动任务 |

## 与课程文档

完整立项、用户故事、接口与数据模型见上级目录 **M4 模块** Spec 文档；本仓库为样例代码。

## 注意

勿将真实 Webhook、密钥提交到 Git；默认使用本地 SQLite（`backend/notify.db` 等，提交前请忽略）。
