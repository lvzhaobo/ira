# 功能：拦截 rm 命令（PowerShell 版本）
# 用途：阻止删除文件操作
# 位置：.qoder/hooks/block-rm.ps1

# 读取输入（JSON 格式）
$input = [Console]::In.ReadToEnd()

# 提取要执行的命令
$command = ($input | ConvertFrom-Json).tool_input.command

# 检查是否包含 rm 命令
if ($command -match '(^rm\s|\srm\s|^rm$)') {
    Write-Host "❌ 危险命令已被阻止: $command" -ForegroundColor Red
    Write-Host "💡 提示：'rm' 命令已被安全策略拦截" -ForegroundColor Yellow
    exit 2  # 阻断执行
}

# 安全检查通过，允许执行
exit 0
