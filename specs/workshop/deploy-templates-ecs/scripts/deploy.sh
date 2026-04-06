#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-__APP_ROOT__}"
BRANCH="${BRANCH:-__BRANCH__}"
BACKEND_DIR="${APP_ROOT}/ira/backend"
VENV_DIR="${APP_ROOT}/.venv"

echo "[deploy] app_root=${APP_ROOT} branch=${BRANCH}"
cd "${APP_ROOT}"

echo "[deploy] fetch latest code"
git fetch --all --prune
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo "[deploy] install backend deps"
python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --upgrade pip
"${VENV_DIR}/bin/pip" install -r "${BACKEND_DIR}/requirements.txt"

echo "[deploy] ensure log dir"
sudo mkdir -p /var/log/ira
sudo chown -R __RUN_USER__:__RUN_USER__ /var/log/ira

echo "[deploy] restart service"
sudo systemctl daemon-reload
sudo systemctl restart ira-backend
sudo systemctl status ira-backend --no-pager -l

echo "[deploy] health check"
"${APP_ROOT}/specs/workshop/deploy-templates-ecs/scripts/health-check.sh"

echo "[deploy] done"
