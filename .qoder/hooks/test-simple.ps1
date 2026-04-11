# 简单的 block-rm.sh 测试
Write-Host "Testing block-rm.sh..."

# 测试 1
Write-Host "Test 1: rm -rf test"
$json = '{"tool_input": {"command": "rm -rf test"}}'
$json | bash .qoder/hooks/block-rm.sh 2>&1
Write-Host "Exit code: $LASTEXITCODE"
Write-Host ""

# 测试 2
Write-Host "Test 2: echo hello"
$json = '{"tool_input": {"command": "echo hello"}}'
$json | bash .qoder/hooks/block-rm.sh 2>&1
Write-Host "Exit code: $LASTEXITCODE"
