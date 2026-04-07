# Qoder CLI Flask 封装（jQuery + Vue 示例）

这个示例将 `qodercli` 封装成 HTTP API，并提供两个可直接访问的页面（jQuery / Vue）。

支持两种调用模式：

- 同步：前端调用 `/api/run`，后端直接返回生成内容。
- 异步：前端调用 `/api/jobs` 创建任务，后端写入本地 `jobs/*.json` 和 `results/*.txt`，前端轮询 `/api/jobs/{id}` 查看状态并读取结果文件。

## 1. 安装与登录 Qoder CLI

参考官方文档（Windows 也支持通过 npm 安装）：
- [Qoder CLI 快速上手](https://docs.qoder.com/zh/cli/quick-start)

常见命令：

```bash
npm install -g @qoder-ai/qodercli
qodercli --version
qodercli
```

在交互界面执行 `/login` 完成登录，或者设置 `QODER_PERSONAL_ACCESS_TOKEN`。

## 2. 安装依赖并启动

```bash
cd sample/qoder-api
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

默认端口 `5007`，打开：

- http://127.0.0.1:5007
- http://127.0.0.1:5007/vue

## 3. 环境变量

- `QODERCLI_PATH`：qodercli 可执行文件名或路径（默认 `qodercli`）
- `QODER_TIMEOUT_SECONDS`：默认超时秒数（默认 `300`）
- `PORT`：Flask 端口（默认 `5007`）

### Windows 常见报错：`[WinError 2] 系统找不到指定的文件`

说明 Flask 进程没有找到 `qodercli` 命令。可按以下顺序排查：

1. 在同一个终端执行 `qodercli --version`（确认已安装）
2. 如果安装方式是 npm，全局命令常为 `qodercli.cmd`
3. 启动前设置环境变量：

```powershell
$env:QODERCLI_PATH="qodercli.cmd"
python app.py
```

你也可以直接指定绝对路径，例如：

```powershell
$env:QODERCLI_PATH="C:\Users\<用户名>\AppData\Roaming\npm\qodercli.cmd"
python app.py
```

当前后端也会自动尝试：
- `qodercli`
- `qodercli.cmd`（Windows）
- `npx -y @qoder-ai/qodercli`（兜底）

可通过 `GET /api/health` 查看 `resolved_command` 和 `resolve_note`。

## 4. API 简表

- `GET /api/health`：服务健康状态
- `POST /api/run`：同步执行
- `POST /api/jobs`：创建异步任务
- `GET /api/jobs`：列出最近任务
- `GET /api/jobs/{job_id}`：查询任务状态
- `GET /api/files/{name}`：读取结果文件

## 5. 示例请求（同步）

```bash
curl -X POST http://127.0.0.1:5007/api/run \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"生成一个Flask健康检查接口\",\"workspace\":\"D:/code/workshop-5days\",\"save_to_file\":true}"
```
