#!/bin/bash
# 测试 block-rm.sh 是否正常工作

echo "=== 测试 block-rm.sh 拦截功能 ==="
echo ""

# 测试 1：拦截 rm 命令
echo "测试 1：尝试执行 'rm -rf test'"
echo '{"tool_input": {"command": "rm -rf test"}}' | bash .qoder/hooks/block-rm.sh
if [ $? -eq 2 ]; then
  echo "✅ 测试通过：rm 命令被成功拦截"
else
  echo "❌ 测试失败：rm 命令未被拦截"
fi
echo ""

# 测试 2：拦截 rm 命令（变体）
echo "测试 2：尝试执行 'rm file.txt'"
echo '{"tool_input": {"command": "rm file.txt"}}' | bash .qoder/hooks/block-rm.sh
if [ $? -eq 2 ]; then
  echo "✅ 测试通过：rm 命令被成功拦截"
else
  echo "❌ 测试失败：rm 命令未被拦截"
fi
echo ""

# 测试 3：允许安全命令
echo "测试 3：尝试执行 'echo hello'"
echo '{"tool_input": {"command": "echo hello"}}' | bash .qoder/hooks/block-rm.sh
if [ $? -eq 0 ]; then
  echo "✅ 测试通过：安全命令正常执行"
else
  echo "❌ 测试失败：安全命令被误拦截"
fi
echo ""

# 测试 4：允许 ls 命令
echo "测试 4：尝试执行 'ls -la'"
echo '{"tool_input": {"command": "ls -la"}}' | bash .qoder/hooks/block-rm.sh
if [ $? -eq 0 ]; then
  echo "✅ 测试通过：ls 命令正常执行"
else
  echo "❌ 测试失败：ls 命令被误拦截"
fi
echo ""

echo "=== 测试完成 ==="
