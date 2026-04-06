# ECS 部署模板包（Nginx 之外）

> 目标：为 `ira/` 在阿里云 ECS 的部署提供可复用模板。  
> 范围：**不含 Nginx**（可与现有 `ira/docs/DEPLOY-GITHUB-ACTIONS.md` 和你们现网 Nginx 配置配套使用）。

## 目录

- `env/.env.example`：环境变量模板（百炼、CoPaw、DATA_DIR、端口等）
- `systemd/ira-backend.service`：Flask/Gunicorn 服务模板
- `systemd/ira-worker.service`：可选后台任务服务模板
- `gunicorn/gunicorn.conf.py`：Gunicorn 配置模板
- `scripts/deploy.sh`：部署脚本模板（拉代码、装依赖、重启、健康检查）
- `scripts/health-check.sh`：健康检查脚本模板
- `scripts/rollback.sh`：回滚脚本模板
- `ops/logrotate-ira.conf`：日志轮转模板（Nginx + 应用）
- `ops/security-checklist.md`：ECS 安全组/系统加固检查清单
- `ci/deploy-ecs-github-actions.yml`：GitHub Actions 模板

## 推荐落地顺序

1. 复制 `.env.example` 为生产环境变量文件并填值。
2. 修改 `systemd/*.service` 里的路径与用户，`daemon-reload` 后启用服务。
3. 用 `scripts/health-check.sh` 先验证本机可用，再接入 CI 的部署流程。
4. 配置 `logrotate` 与安全组规则，避免日志暴涨与暴露后端端口。

## 变量替换约定

模板中使用以下占位符，部署前替换：

- `__APP_ROOT__`：应用根目录（例如 `/opt/ira/ira`）
- `__RUN_USER__`：运行用户（例如 `www-data` 或 `ecs-user`）
- `__BACKEND_PORT__`：后端端口（建议 `5000`）
- `__DOMAIN__`：业务域名（仅 CI/检查示例用）
- `__BRANCH__`：部署分支（例如 `main`）

## 说明

- 本模板偏向 Workshop 与中小团队项目，强调“可读、可改、可回滚”。
- 生产环境建议再补充：灰度发布、数据库迁移闸门、告警通知、机密管理（KMS/Secret Manager）。
