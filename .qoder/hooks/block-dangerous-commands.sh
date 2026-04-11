#!/bin/sh# 功能：拦截危险 Shell 命令INPUT=$(cat)
# 提取要执行的命令（从 tool_input.command 中读取）COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
# === 📝 危险命令黑名单 — 请根据团队规范调整 ===DANGEROUS_PATTERNS="rm -rf|git push --force|git push -f|DROP TABLE|DROP DATABASE|format |mkfs"
if echo "$COMMAND" | grep -qiE "$DANGEROUS_PATTERNS"; then  echo "检测到危险命令: $COMMAND" >&2  exit 2  # 阻断执行fi
# ============================================
exit 0