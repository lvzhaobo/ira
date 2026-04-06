#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: rollback.sh <git_tag_or_commit>"
  exit 1
fi

TARGET="$1"
APP_ROOT="${APP_ROOT:-__APP_ROOT__}"
BACKEND_DIR="${APP_ROOT}/ira/backend"

echo "[rollback] target=${TARGET}"
cd "${APP_ROOT}"
git fetch --all --tags --prune
git checkout "${TARGET}"

echo "[rollback] reinstall deps (optional but safer)"
"${APP_ROOT}/.venv/bin/pip" install -r "${BACKEND_DIR}/requirements.txt"

echo "[rollback] restart service"
sudo systemctl restart ira-backend
sudo systemctl status ira-backend --no-pager -l

echo "[rollback] health check"
"${APP_ROOT}/specs/workshop/deploy-templates-ecs/scripts/health-check.sh"

echo "[rollback] done"
