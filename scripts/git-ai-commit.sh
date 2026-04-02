#!/usr/bin/env bash
# 自动生成 commit message 并提交
# 用法: git ai-commit 或 git ai-commit "额外说明"

set -e

echo "🤖 正在分析代码变更..."

# 获取变更统计
STAT=$(git diff --cached --stat)
DIFF=$(git diff --cached)

if [ -z "$DIFF" ]; then
    echo "❌ 没有暂存的更改，请先执行 git add"
    exit 1
fi

echo "📊 变更统计:"
echo "$STAT"
echo ""

# 分析变更类型
TYPE="chore"
SCOPE=""
SUBJECT=""

# 检测变更类型
if echo "$DIFF" | grep -q "^+.*def \|^+.*class \|^+.*function "; then
    TYPE="feat"
elif echo "$DIFF" | grep -q "^-.*def \|^+.*def "; then
    TYPE="fix"
elif echo "$DIFF" | grep -q "\.md$\|\.txt$"; then
    TYPE="docs"
elif echo "$DIFF" | grep -q "\.yml$\|\.yaml$\|Dockerfile"; then
    TYPE="ci"
elif echo "$DIFF" | grep -q "test"; then
    TYPE="test"
fi

# 检测变更范围
if echo "$STAT" | grep -q "frontend/"; then
    SCOPE="frontend"
elif echo "$STAT" | grep -q "backend/"; then
    SCOPE="backend"
elif echo "$STAT" | grep -q "\.github/"; then
    SCOPE="ci"
fi

# 生成主题
if echo "$STAT" | grep -q "\.env"; then
    SUBJECT="添加环境变量配置"
elif echo "$STAT" | grep -q "vite.config"; then
    SUBJECT="优化 Vite 配置"
elif echo "$STAT" | grep -q "pre-commit"; then
    SUBJECT="优化 pre-commit 配置"
elif echo "$STAT" | grep -q "workflow"; then
    SUBJECT="添加 GitHub Actions 工作流"
else
    SUBJECT="更新项目配置"
fi

# 构建 commit message
if [ -n "$SCOPE" ]; then
    HEADER="${TYPE}(${SCOPE}): ${SUBJECT}"
else
    HEADER="${TYPE}: ${SUBJECT}"
fi

# 添加额外说明
if [ -n "$1" ]; then
    BODY="$1"
    FULL_MESSAGE="${HEADER}

${BODY}"
else
    # 自动生成详细描述
    BODY="- 修改文件: $(echo "$STAT" | grep -o '[^ ]*$' | tr '\n' ', ' | sed 's/,$//')"
    FULL_MESSAGE="${HEADER}

${BODY}"
fi

echo "✅ 生成的 commit message:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$FULL_MESSAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 确认提交
read -p "是否提交? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "$FULL_MESSAGE"
    echo "✅ 提交成功!"
else
    echo "❌ 已取消"
    exit 1
fi
