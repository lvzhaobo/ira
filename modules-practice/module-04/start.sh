#!/usr/bin/env bash
# C-NotifyPush 多渠道推送（M4 Sample）— Linux / ECS 启动脚本
#
# 使用：
#   chmod +x start.sh
#   ./start.sh                    # 开发模式：后端后台 + 前端 webpack-dev-server（监听 0.0.0.0）
#   START_MODE=prod ./start.sh    # 生产模式：npm build + 前台 Gunicorn（需本机已装 Nginx 等托管 frontend/build）
#
# ECS 上生产环境建议：用 systemd 分别托管 Gunicorn 与 Nginx（静态目录指向 frontend/build），勿长期用 npm start。

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

START_MODE="${START_MODE:-dev}"
mkdir -p "$ROOT/logs"

PYTHON="${PYTHON:-python3}"
if ! command -v "$PYTHON" >/dev/null 2>&1; then
  PYTHON="python"
fi

cleanup_dev() {
  if [[ -f "$ROOT/logs/backend.pid" ]]; then
    if kill -0 "$(cat "$ROOT/logs/backend.pid")" 2>/dev/null; then
      kill "$(cat "$ROOT/logs/backend.pid")" 2>/dev/null || true
    fi
    rm -f "$ROOT/logs/backend.pid"
  fi
}

if [[ "$START_MODE" == "prod" ]]; then
  echo "========================================"
  echo "C-NotifyPush（生产模式 / ECS）"
  echo "========================================"
  echo ""

  echo "[1/3] 安装后端依赖 + Gunicorn..."
  (cd "$ROOT/backend" && "$PYTHON" -m pip install -r requirements.txt && "$PYTHON" -m pip install gunicorn)
  echo ""

  echo "[2/3] 安装前端依赖并构建..."
  (cd "$ROOT/frontend" && npm install && npm run build)
  echo ""

  echo "[3/3] 启动 Gunicorn（前台，0.0.0.0:5000）..."
  echo "请将 Nginx 的 root 指到: $ROOT/frontend/build"
  echo "API 建议反代前缀 /api/ → http://127.0.0.1:5000"
  echo ""
  cd "$ROOT/backend"
  exec "$PYTHON" -m gunicorn -w 2 -b 0.0.0.0:5000 "app:app"
fi

# ---------- 开发模式（对齐 start.bat 行为）----------
trap cleanup_dev EXIT INT TERM

echo "========================================"
echo "C-NotifyPush 多渠道推送（M4 Sample）"
echo "========================================"
echo ""

echo "[1/3] 安装后端依赖..."
(cd "$ROOT/backend" && "$PYTHON" -m pip install -r requirements.txt)
echo ""

echo "[2/3] 安装前端依赖..."
(cd "$ROOT/frontend" && npm install)
echo ""

echo "[3/3] 启动服务..."
echo "后端: http://0.0.0.0:5000/api/v1/notify/health"
echo "前端: http://0.0.0.0:3000 （需在安全组放行 3000/5000）"
echo ""

(cd "$ROOT/backend" && nohup "$PYTHON" app.py >>"$ROOT/logs/backend.log" 2>&1 & echo $! >"$ROOT/logs/backend.pid")
sleep 2

cd "$ROOT/frontend"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
exec npm start
