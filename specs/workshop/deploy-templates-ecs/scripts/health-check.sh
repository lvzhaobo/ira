#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:__BACKEND_PORT__}"

echo "[health] checking ${BASE_URL}/api/v1/system/health"
curl --fail --silent --show-error "${BASE_URL}/api/v1/system/health" >/dev/null
echo "[health] ok"
