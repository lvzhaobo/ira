#!/usr/bin/env bash
# 部署Demo项目到ECS
# 用法：bash scripts/deploy-demo.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[deploy-demo] 开始部署Demo项目..."
echo "[deploy-demo] ROOT=$ROOT"

# 从环境变量或GitHub Secrets读取配置
ECS_HOST="${ECS_HOST:?请设置ECS_HOST环境变量}"
ECS_USER="${ECS_USER:-root}"
ECS_APP_PATH="${ECS_APP_PATH:-/opt/ira}"
SSH_PORT="${ECS_SSH_PORT:-22}"

# 部署Nginx配置
echo "[deploy-demo] 部署Nginx配置..."
scp -P "$SSH_PORT" nginx/ira-demo.conf "${ECS_USER}@${ECS_HOST}:/tmp/ira-demo.conf"

ssh -p "$SSH_PORT" "${ECS_USER}@${ECS_HOST}" << 'EOF'
    set -e
    echo "[remote] 备份现有Nginx配置..."
    if [[ -f /etc/nginx/sites-available/ira-demo.conf ]]; then
        cp /etc/nginx/sites-available/ira-demo.conf /etc/nginx/sites-available/ira-demo.conf.bak.$(date +%Y%m%d%H%M%S)
    fi
    
    echo "[remote] 安装新配置..."
    mv /tmp/ira-demo.conf /etc/nginx/sites-available/ira-demo.conf
    
    # 启用站点
    if [[ -L /etc/nginx/sites-enabled/ira-demo.conf ]]; then
        rm /etc/nginx/sites-enabled/ira-demo.conf
    fi
    ln -sf /etc/nginx/sites-available/ira-demo.conf /etc/nginx/sites-enabled/
    
    echo "[remote] 测试Nginx配置..."
    nginx -t
    
    echo "[remote] 重载Nginx..."
    systemctl reload nginx
    
    echo "[remote] Nginx配置部署成功！"
EOF

# 部署Mock API
echo "[deploy-demo] 部署Mock API..."
rsync -avz --delete -e "ssh -p $SSH_PORT" \
    mock-api/ \
    "${ECS_USER}@${ECS_HOST}:${ECS_APP_PATH}/demo/mock-api/"

# 部署静态文件
echo "[deploy-demo] 部署静态文件..."
rsync -avz --delete -e "ssh -p $SSH_PORT" \
    static/ \
    "${ECS_USER}@${ECS_HOST}:${ECS_APP_PATH}/demo/static/"

# 在ECS上安装依赖并启动Mock API
echo "[deploy-demo] 在ECS上配置Mock API..."
ssh -p "$SSH_PORT" "${ECS_USER}@${ECS_HOST}" << EOF
    set -e
    cd "${ECS_APP_PATH}/demo/mock-api"
    
    echo "[remote] 安装Python依赖..."
    pip3 install -r requirements.txt
    
    echo "[remote] 配置systemd服务..."
    cat > /etc/systemd/system/ira-mock-api.service << 'SERVICE_EOF'
[Unit]
Description=IRA Mock API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${ECS_APP_PATH}/demo/mock-api
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
SERVICE_EOF
    
    systemctl daemon-reload
    systemctl enable ira-mock-api
    systemctl restart ira-mock-api
    
    echo "[remote] Mock API服务已启动"
    systemctl status ira-mock-api --no-pager
EOF

echo "[deploy-demo] =========================================="
echo "[deploy-demo] ✅ Demo项目部署完成！"
echo "[deploy-demo] =========================================="
echo "[deploy-demo] 静态网页: http://${ECS_HOST}/demo/"
echo "[deploy-demo] Mock API:  http://${ECS_HOST}/mock-api/"
echo "[deploy-demo] =========================================="
