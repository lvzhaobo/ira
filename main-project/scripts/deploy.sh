#!/usr/bin/env bash
# ira-workshop — ECS / 生产机一键更新（git pull + 依赖 + 前端构建 + 可选重启服务）
# 用法见 docs/DEPLOY-GITHUB-ACTIONS.md
#
# 环境要求（脚本会自检）：
#   - Python >= 3.8（与 backend/requirements.txt 中 Flask 3.x 一致；阿里云 ECS 默认 3.6 不可用）
#   - 默认需要 Node.js >= 18 + npm（Vite 5）；若无 Node，可设置 SKIP_FRONTEND_BUILD=1 且保留有效 frontend/dist
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MIN_PY_MAJOR=3
MIN_PY_MINOR=8
MIN_NODE_MAJOR=18

BRANCH="${DEPLOY_BRANCH:-main}"
REMOTE="${DEPLOY_REMOTE:-origin}"

echo "[deploy] ROOT=$ROOT BRANCH=$BRANCH"

git fetch "$REMOTE"
git checkout "$BRANCH"
git pull "$REMOTE" "$BRANCH"

# —— Python 版本：在 pip install 前检查（Flask>=3 需要 3.8+） ——
python_for_check() {
  if [[ -x "$ROOT/.venv/bin/python" ]]; then
    echo "$ROOT/.venv/bin/python"
  else
    echo "${PYTHON_BIN:-python3}"
  fi
}

PY_BIN="$(python_for_check)"
if ! "$PY_BIN" -c "import sys" 2>/dev/null; then
  echo "[deploy] 错误: 无法执行 Python：$PY_BIN" >&2
  exit 1
fi

read -r vmaj vmin < <("$PY_BIN" -c "import sys; print(sys.version_info[0], sys.version_info[1])" 2>/dev/null || echo "0 0")
if [[ "$vmaj" -lt "$MIN_PY_MAJOR" ]] || [[ "$vmaj" -eq "$MIN_PY_MAJOR" && "$vmin" -lt "$MIN_PY_MINOR" ]]; then
  echo "[deploy] 错误: 需要 Python >= ${MIN_PY_MAJOR}.${MIN_PY_MINOR}，当前为 ${vmaj}.${vmin}（$("$PY_BIN" -V 2>&1)）" >&2
  echo "[deploy] 说明: 系统自带 Python 3.6 无法满足本仓库依赖。请安装 python3.9+ / 3.11+，并：" >&2
  echo "[deploy]        /usr/bin/python3.11 -m venv .venv && source .venv/bin/activate && pip install -U pip" >&2
  exit 1
fi

# Python / pip（优先项目内 .venv）
if [[ -d "$ROOT/.venv" && -f "$ROOT/.venv/bin/activate" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT/.venv/bin/activate"
  PIP_BIN="${ROOT}/.venv/bin/pip"
  PYTHON_RUN="${ROOT}/.venv/bin/python"
else
  PIP_BIN="${PIP_BIN:-pip3}"
  PYTHON_RUN="${PYTHON_BIN:-python3}"
fi

"$PIP_BIN" install -r "$ROOT/backend/requirements.txt"

# —— 前端构建：可跳过（ECS 无 Node 时由 CI 产出 dist 后同步） ——
if [[ "${SKIP_FRONTEND_BUILD:-0}" == "1" ]]; then
  if [[ ! -f "$ROOT/frontend/dist/index.html" ]]; then
    echo "[deploy] 错误: SKIP_FRONTEND_BUILD=1 但缺少 frontend/dist/index.html，无法跳过构建。" >&2
    echo "[deploy] 请在有 Node 的环境执行 npm run build，将 dist 同步到本机，或安装 Node 后去掉 SKIP_FRONTEND_BUILD。" >&2
    exit 1
  fi
  echo "[deploy] 已跳过前端构建（使用现有 frontend/dist）"
else
  if ! command -v npm >/dev/null 2>&1; then
    echo "[deploy] 错误: 未找到 npm。ECS 上未安装 Node 时，请任选其一：" >&2
    echo "[deploy]   1) 安装 Node.js LTS（建议 >=18）：如 nvm、发行版软件源或阿里云镜像" >&2
    echo "[deploy]   2) 设置 SKIP_FRONTEND_BUILD=1，并确保 frontend/dist 已由流水线/本机构建后同步到服务器" >&2
    exit 1
  fi
  node_major="$(node -p "parseInt(process.versions.node,10)" 2>/dev/null || echo 0)"
  if [[ "${node_major:-0}" -lt "$MIN_NODE_MAJOR" ]]; then
    echo "[deploy] 警告: Node 主版本为 ${node_major}，建议 >= ${MIN_NODE_MAJOR}（Vite 5）。继续尝试构建…" >&2
  fi
  cd "$ROOT/frontend"
  npm ci
  npm run build
  cd "$ROOT"
fi

export IRA_DATA_DIR="${IRA_DATA_DIR:-$ROOT/data}"
echo "[deploy] IRA_DATA_DIR=$IRA_DATA_DIR"

if [[ "${RUN_TESTS:-0}" == "1" ]]; then
  echo "[deploy] 运行后端测试..."
  (
    cd "$ROOT/backend"
    export PYTHONPATH="."
    "$PYTHON_RUN" -m pytest tests -q
  )
fi

if [[ -n "${DEPLOY_BACKEND_SERVICE:-}" ]]; then
  sudo systemctl restart "$DEPLOY_BACKEND_SERVICE"
  echo "[deploy] 已执行: systemctl restart $DEPLOY_BACKEND_SERVICE"
fi

if [[ "${DEPLOY_NGINX_RELOAD:-0}" == "1" ]]; then
  if command -v nginx >/dev/null 2>&1; then
    sudo nginx -t && sudo nginx -s reload && echo "[deploy] nginx 已 reload"
  else
    echo "[deploy] 跳过 nginx：未安装 nginx 命令"
  fi
fi

echo "[deploy] 完成"
