#!/bin/bash
# 功能：拦截运行 "aaaa" 命令
# 用途：演示 Qoder Hooks 如何拦截特定命令
# 位置：.qoder/hooks/block-aaaa-command.sh

# 读取输入（JSON 格式）
INPUT=$(cat)

# 提取要执行的命令（从 tool_input.command 中读取）
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')

# === 📝 危险命令黑名单 ===
# 拦截包含 "aaaa" 的命令
DANGEROUS_PATTERNS="aaaa"

# 检查命令是否匹配黑名单
if echo "$COMMAND" | grep -qiE "$DANGEROUS_PATTERNS"; then
  echo "❌ 检测到被拦截的命令: $COMMAND" >&2
  echo "💡 提示：'aaaa' 命令已被安全策略拦截" >&2
  exit 2  # 阻断执行
fi

# ============================================
# 安全检查通过，允许执行
exit 0
