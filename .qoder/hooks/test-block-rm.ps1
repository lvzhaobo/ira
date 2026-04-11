# 测试 block-rm.sh 是否正常工作（PowerShell 版本）

Write-Host "=== 测试 block-rm.sh 拦截功能 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 jq 是否安装
try {
    $null = Get-Command jq -ErrorAction Stop
} catch {
    Write-Host "❌ 错误：未找到 jq 命令" -ForegroundColor Red
    Write-Host "💡 请先安装 jq: choco install jq 或 winget install jqlang.jq" -ForegroundColor Yellow
    exit 1
}

# 测试 1：拦截 rm -rf 命令
Write-Host "测试 1：尝试执行 'rm -rf test'" -ForegroundColor Yellow
$json = '{"tool_input": {"command": "rm -rf test"}}'
$output = $json | bash .qoder/hooks/block-rm.sh 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -eq 2) {
    Write-Host "✅ 测试通过：rm 命令被成功拦截" -ForegroundColor Green
    Write-Host "   输出: $output" -ForegroundColor Gray
} else {
    Write-Host "❌ 测试失败：rm 命令未被拦截 (退出码: $exitCode)" -ForegroundColor Red
}
Write-Host ""

# 测试 2：拦截 rm 命令（变体）
Write-Host "测试 2：尝试执行 'rm file.txt'" -ForegroundColor Yellow
$json = '{"tool_input": {"command": "rm file.txt"}}'
$output = $json | bash .qoder/hooks/block-rm.sh 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -eq 2) {
    Write-Host "✅ 测试通过：rm 命令被成功拦截" -ForegroundColor Green
    Write-Host "   输出: $output" -ForegroundColor Gray
} else {
    Write-Host "❌ 测试失败：rm 命令未被拦截 (退出码: $exitCode)" -ForegroundColor Red
}
Write-Host ""

# 测试 3：允许安全命令
Write-Host "测试 3：尝试执行 'echo hello'" -ForegroundColor Yellow
$json = '{"tool_input": {"command": "echo hello"}}'
$output = $json | bash .qoder/hooks/block-rm.sh 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "✅ 测试通过：安全命令正常执行" -ForegroundColor Green
} else {
    Write-Host "❌ 测试失败：安全命令被误拦截 (退出码: $exitCode)" -ForegroundColor Red
}
Write-Host ""

# 测试 4：允许 ls 命令
Write-Host "测试 4：尝试执行 'ls -la'" -ForegroundColor Yellow
$json = '{"tool_input": {"command": "ls -la"}}'
$output = $json | bash .qoder/hooks/block-rm.sh 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "✅ 测试通过：ls 命令正常执行" -ForegroundColor Green
} else {
    Write-Host "❌ 测试失败：ls 命令被误拦截 (退出码: $exitCode)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== 测试完成 ===" -ForegroundColor Cyan
