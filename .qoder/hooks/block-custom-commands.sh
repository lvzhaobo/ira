#!/bin/bash
# 功能：拦截多个危险/测试命令
# 用途：演示如何扩展命令拦截规则
# 位置：.qoder/hooks/block-custom-commands.sh

# 读取输入（JSON 格式）
INPUT=$(cat)

# 提取要执行的命令（从 tool_input.command 中读取）
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')

# === 📝 自定义命令黑名单 ===
# 可以根据团队需求添加更多命令
DANGEROUS_PATTERNS="aaaa|bbbb|cccc|test-command|echo pwned"

# 检查命令是否匹配黑名单
if echo "$COMMAND" | grep -qiE "$DANGEROUS_PATTERNS"; then
  echo "❌ 检测到被拦截的命令: $COMMAND" >&2
  echo "💡 提示：该命令已被安全策略拦截" >&2
  echo "🔒 如需执行，请联系管理员调整安全策略" >&2
  exit 2  # 阻断执行
fi

# ============================================
# 安全检查通过，允许执行
exit 0
