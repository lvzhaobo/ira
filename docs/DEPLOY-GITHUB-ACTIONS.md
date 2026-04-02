# 部署脚本与 GitHub Actions（ECS）

> 若你在本机 `workshop-5days` 大仓库里同时看到 `ira/ira` 与 `sample/.../ira-workshop`，请先读：`docs/WORKSPACE-双路径说明.md`。

本文说明如何在阿里云 ECS（或任意 Linux 服务器）上使用本仓库根目录下的 `scripts/deploy.sh` 更新代码，以及如何在 GitHub Actions 中通过 SSH 触发远程部署。

---

## 1. 部署脚本做什么

`scripts/deploy.sh` 在**已 clone 的本仓库根目录**执行，依次完成：

| 步骤                                      | 说明                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `git fetch / checkout / pull`             | 默认分支 `main`，可通过环境变量覆盖                                      |
| `pip install -r backend/requirements.txt` | 若存在 `.venv` 则自动 `activate` 后用其中的 `pip`                        |
| `npm ci && npm run build`                 | 在 `frontend/` 下安装依赖并生产构建（可用 `SKIP_FRONTEND_BUILD=1` 跳过） |
| 环境变量 `IRA_DATA_DIR`                   | 默认指向仓库内 `data/`                                                   |
| 可选：后端测试                            | `RUN_TESTS=1` 时执行 `pytest`                                            |
| 可选：重启后端                            | 设置 `DEPLOY_BACKEND_SERVICE` 时执行 `sudo systemctl restart …`          |
| 可选：reload nginx                        | `DEPLOY_NGINX_RELOAD=1` 且本机有 `nginx` 时执行 `nginx -s reload`        |

**不会自动做的事**：首次安装系统级依赖（Python、Node、nginx、systemd 单元等）仍需在 ECS 上手动完成一次。

### 1.1 阿里云 ECS 常见环境（重要）

- **系统自带 Python 3.6.x**：**不能**运行本仓库后端（`Flask>=3` 需要 **Python ≥ 3.8**）。`deploy.sh` 会在 `pip install` 前检测并退出。
- **未安装 Node**：可安装 **Node ≥ 18**，或先在 CI/本机构建 `frontend/dist` 同步到服务器后执行：`SKIP_FRONTEND_BUILD=1 bash scripts/deploy.sh`。

| 变量                    | 作用                                            |
| ----------------------- | ----------------------------------------------- |
| `SKIP_FRONTEND_BUILD=1` | 跳过 `npm`，要求已有 `frontend/dist/index.html` |
| `PYTHON_BIN`            | 无 `.venv` 时指定如 `/usr/bin/python3.11`       |

---

## 2. ECS 首次准备（只做一次）

### 2.1 克隆仓库

以下示例将仓库克隆到 `/opt/ira`（目录名可自定，**Secret `ECS_APP_PATH` 必须与之完全一致**）。

```bash
cd /opt
sudo git clone https://github.com/<org>/<repo>.git ira
sudo chown -R $USER:$USER ira
cd ira
```

### 2.2 Python 虚拟环境（推荐）

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 2.3 Node.js（建议 LTS）

```bash
cd frontend && npm ci && npm run build && cd ..
```

### 2.4 数据目录

```bash
export IRA_DATA_DIR=/opt/ira/data   # 与克隆路径一致
python scripts/seed_data.py   # 可选，首次建议
```

生产环境可在 **systemd** 的 `Environment=` 或 `EnvironmentFile=` 中写入 `IRA_DATA_DIR`。

### 2.5 赋予 deploy 脚本执行权限

```bash
chmod +x scripts/deploy.sh
```

### 2.6 后端进程（示例：gunicorn + systemd）

`/etc/systemd/system/ira-backend.service`（路径按实际修改）：

```ini
[Unit]
Description=IRA Workshop Flask (gunicorn)
After=network.target

[Service]
User=deploy
Group=deploy
WorkingDirectory=/opt/ira/backend
Environment="IRA_DATA_DIR=/opt/ira/data"
Environment="PYTHONPATH=/opt/ira/backend"
ExecStart=/opt/ira/.venv/bin/gunicorn -w 2 -b 127.0.0.1:5000 wsgi:app
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ira-backend
```

### 2.7 前端静态资源与 nginx（推荐）

- `root` 指向 `/opt/ira/frontend/dist`（或你的 `ECS_APP_PATH/frontend/dist`）
- `location /api/` `proxy_pass` 到 `http://127.0.0.1:5000`

---

## 3. 手动在 ECS 上执行部署

```bash
cd /opt/ira   # 与 ECS_APP_PATH 相同
export DEPLOY_BRANCH=main
export DEPLOY_BACKEND_SERVICE=ira-backend
bash scripts/deploy.sh
```

---

## 4. GitHub Actions 配置

工作流文件：`.github/workflows/deploy-ecs.yml`。

### 4.1 Secrets

| Secret                | 必填 | 说明                                            |
| --------------------- | ---- | ----------------------------------------------- |
| `ECS_HOST`            | 是   | ECS 公网 IP 或域名                              |
| `ECS_USER`            | 是   | SSH 用户                                        |
| `ECS_SSH_PRIVATE_KEY` | 是   | 私钥全文                                        |
| `ECS_APP_PATH`        | 是   | 服务器上**本仓库根目录**，例如 `/opt/ira`       |
| `ECS_SYSTEMD_SERVICE` | 否   | 如 `ira-backend`                                |
| `ECS_SSH_PORT`        | 否   | 非 22 时配置，并在 workflow 中取消 `port:` 注释 |

### 4.2 验证

Actions 运行成功后，在 ECS 上执行 `git log -1`、`systemctl status ira-backend`（服务名按你实际为准）。

---

## 5. 常见问题

**Q：前端 API 404**
生产环境需 nginx 将 `/api` 反代到 Flask；Vite 的 dev proxy 仅在 `npm run dev` 时生效。

**Q：Permission denied (publickey)**
检查公钥是否在 `authorized_keys`、Secret 私钥是否完整。

---

## 6. 相关文件

- `scripts/deploy.sh`
- `.github/workflows/deploy-ecs.yml`
- `README.md`
