# IRA 环境变量总表

> 位置说明：本文件放在 `specs/workshop/deploy-templates-ecs/env/`，与部署/运维脚本模板同一套目录，便于运维与开发统一查阅。

## 1) 后端运行（ira/backend）

| 变量名 | 必填 | 默认值 | 作用 |
|---|---|---|---|
| `IRA_DATA_DIR` | 否 | `<repo>/ira/data` | 后端数据目录（JSON 存储、上传文件、快照等）。 |
| `IRA_LOGIN_PASSWORD` | 否 | 读取 `ira/config/auth_login.json` | 覆盖演示登录密码（仅运行时生效，不落盘）。 |
| `IRA_MOCK_API_BASE_URL` | 否 | `http://127.0.0.1:5001` | M2 数据采集模拟源地址。 |
| `IRA_INGEST_QUEUE_SEC` | 否 | `1.0` | ingest 任务 queued -> running 的模拟延迟（秒）。 |
| `IRA_INGEST_RUNNING_SEC` | 否 | `2.0` | ingest 任务 running -> success 的模拟延迟（秒）。 |

## 2) 百炼（DashScope）

| 变量名 | 必填 | 默认值 | 作用 |
|---|---|---|---|
| `DASHSCOPE_API_KEY` | 是（启用百炼时） | 空 | 百炼 API Key；为空时自动回退离线/占位回答。 |
| `IRA_BAILIAN_MODEL` | 否 | `qwen-plus` | 百炼模型名。 |
| `IRA_BAILIAN_BASE_URL` | 否 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 百炼 OpenAI 兼容接口基地址。 |
| `IRA_BAILIAN_TEMPERATURE` | 否 | `0.2` | 生成温度参数。 |

## 3) CoPaw 接入（可选）

| 变量名 | 必填 | 默认值 | 作用 |
|---|---|---|---|
| `IRA_COPAW_BASE_URL` | 否 | 空 | CoPaw 基地址；与下列 URL 二选一可启用。 |
| `IRA_COPAW_QA_ASK_URL` | 否 | 空 | QA Skill 完整地址，优先于 `IRA_COPAW_BASE_URL`。 |
| `IRA_COPAW_MA_RUN_URL` | 否 | 空 | 多 Agent Skill 完整地址，优先于 `IRA_COPAW_BASE_URL`。 |
| `IRA_COPAW_API_TOKEN` | 否 | 空 | CoPaw 访问令牌（若服务端需要鉴权）。 |
| `IRA_COPAW_TIMEOUT_SEC` | 否 | `20` | CoPaw HTTP 调用超时（秒）。 |

## 4) 前端运行（ira/frontend）

| 变量名 | 必填 | 默认值 | 作用 |
|---|---|---|---|
| `VITE_BACKEND_URL` | 否 | `http://127.0.0.1:5000` | 前端请求后端 API 的基地址。 |

## 5) ECS 模板变量（deploy-templates-ecs）

以下变量在 `specs/workshop/deploy-templates-ecs/env/.env.example`、`systemd/*`、`gunicorn/*` 中使用。

| 变量名 | 必填 | 默认值 | 作用 |
|---|---|---|---|
| `APP_ENV` | 否 | `production` | 应用运行环境标识。 |
| `LOG_LEVEL` | 否 | `INFO` | 日志级别（Gunicorn 也会读取）。 |
| `TZ` | 否 | `Asia/Shanghai` | 时区。 |
| `IRA_BACKEND_HOST` | 否 | `0.0.0.0` | 后端监听地址（模板变量）。 |
| `IRA_BACKEND_PORT` | 否 | 模板占位 `__BACKEND_PORT__` | 后端端口。 |
| `CORS_ALLOW_ORIGINS` | 否 | `https://__DOMAIN__` | 允许的跨域来源（模板变量）。 |
| `GUNICORN_WORKERS` | 否 | `max(2, cpu_count/2)` | Gunicorn worker 数。 |
| `GUNICORN_THREADS` | 否 | `2` | Gunicorn 每 worker 线程数。 |
| `GUNICORN_TIMEOUT` | 否 | `120` | Gunicorn 请求超时（秒）。 |

## 6) 部署脚本输入变量（shell 参数）

以下不是应用业务变量，而是脚本运行参数，常由 CI 或命令行注入：

| 变量名 | 默认值 | 用于脚本 | 作用 |
|---|---|---|---|
| `APP_ROOT` | `__APP_ROOT__` | `scripts/deploy.sh` | 代码根目录。 |
| `BRANCH` | `__BRANCH__` | `scripts/deploy.sh` | 部署分支。 |
| `TARGET` | `HEAD~1` | `scripts/rollback.sh` | 回滚目标 revision。 |

## 7) 推荐最小配置

### A. 本地开发（不接百炼）

```bash
IRA_DATA_DIR=<你的本地数据目录>
VITE_BACKEND_URL=http://127.0.0.1:5000
```

### B. 本地开发（接百炼）

```bash
IRA_DATA_DIR=<你的本地数据目录>
DASHSCOPE_API_KEY=<你的key>
IRA_BAILIAN_MODEL=qwen-plus
IRA_BAILIAN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
IRA_BAILIAN_TEMPERATURE=0.2
VITE_BACKEND_URL=http://127.0.0.1:5000
```

### C. ECS 部署（最小）

```bash
APP_ENV=production
LOG_LEVEL=INFO
TZ=Asia/Shanghai
IRA_DATA_DIR=__APP_ROOT__/data
IRA_BACKEND_HOST=0.0.0.0
IRA_BACKEND_PORT=5000
DASHSCOPE_API_KEY=<生产key>
IRA_BAILIAN_MODEL=qwen-plus
IRA_BAILIAN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
IRA_BAILIAN_TEMPERATURE=0.2
GUNICORN_WORKERS=3
GUNICORN_THREADS=2
GUNICORN_TIMEOUT=120
```

## 8) 安全建议

- 不要把真实 `DASHSCOPE_API_KEY`、`IRA_COPAW_API_TOKEN` 提交到 Git。
- 生产环境使用 `.env` + `systemd EnvironmentFile` 或 Secret Manager 管理密钥。
- 研发/测试/生产使用不同 key，并限制最小权限。
