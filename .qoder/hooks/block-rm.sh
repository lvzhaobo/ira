#!/bin/bash
# 功能：拦截 rm 命令
# 用途：阻止删除文件操作

# 读取输入（JSON 格式）
input=$(cat)

# 提取要执行的命令
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# 检查是否包含 rm 命令
if echo "$command" | grep -qiE '(^rm | rm |^rm$)'; then
  echo "❌ 危险命令已被阻止: $command" >&2
  echo "💡 提示：'rm' 命令已被安全策略拦截" >&2
  exit 2  # 阻断执行
fi

# 安全检查通过，允许执行
exit 0