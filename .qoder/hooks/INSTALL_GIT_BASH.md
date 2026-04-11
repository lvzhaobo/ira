# 安装 Git Bash 指南

> **问题**：Windows 系统缺少 bash 环境，导致 .sh Hooks 脚本无法执行

---

## 🚀 快速安装

### 方法 1：使用 winget（推荐）

```powershell
# 打开 PowerShell，执行：
winget install --id Git.Git -e --source winget
```

### 方法 2：使用 Chocolatey

```powershell
# 如果已安装 choco
choco install git
```

### 方法 3：手动下载安装

1. 访问：https://git-scm.com/download/win
2. 下载 64-bit Git for Windows Setup
3. 运行安装程序
4. **重要**：安装时选择 "Git from the command line and also from 3rd-party software"

---

## ✅ 验证安装

安装完成后，重启终端并运行：

```powershell
# 检查 bash 是否可用
bash --version

# 检查 git 是否可用
git --version

# 检查 jq 是否可用（如果没有，需要单独安装）
jq --version
```

---

## 🔧 安装 jq（JSON 处理工具）

Hooks 脚本需要 `jq` 来解析 JSON：

### 方法 1：使用 winget

```powershell
winget install jqlang.jq
```

### 方法 2：使用 Chocolatey

```powershell
choco install jq
```

### 方法 3：手动安装

1. 访问：https://github.com/jqlang/jq/releases
2. 下载 `jq-win64.exe`
3. 重命名为 `jq.exe`
4. 移动到 `C:\Windows\System32\` 或添加到 PATH

---

## 🧪 测试 Hooks

安装完成后，重启 Qoder，然后测试：

```powershell
# 在项目根目录执行
cd d:\code\workshop-5days\ira\ira

# 测试 block-rm.sh
echo '{"tool_input": {"command": "rm -rf test"}}' | bash .qoder/hooks/block-rm.sh

# 应该输出：
# ❌ 危险命令已被阻止: rm -rf test
# 💡 提示：'rm' 命令已被安全策略拦截
```

---

## 📋 完整的安装清单

- [ ] Git Bash（包含 bash 环境）
- [ ] jq（JSON 解析工具）
- [ ] 重启 Qoder
- [ ] 测试 Hooks 是否生效

---

## ⚠️ 注意事项

1. **安装后必须重启 Qoder**，否则配置不会生效
2. **确保 bash 在 PATH 中**，Qoder 才能找到并执行 .sh 脚本
3. **Windows 上的路径问题**：使用正斜杠 `/` 或双反斜杠 `\\`

---

## 🔍 故障排查

### 问题：bash 命令找不到

**解决方案**：
```powershell
# 检查 Git Bash 安装位置
Get-Command bash -ErrorAction SilentlyContinue

# 如果未找到，添加到 PATH
$env:PATH += ";C:\Program Files\Git\bin"
```

### 问题：jq 命令找不到

**解决方案**：
```powershell
# 检查 jq 是否安装
Get-Command jq -ErrorAction SilentlyContinue

# 如果未找到，使用 winget 安装
winget install jqlang.jq
```

---

## 💡 替代方案

如果不想安装 Git Bash，可以考虑：

### 方案 2：使用 PowerShell 脚本

将 `.sh` 脚本改为 `.ps1`（需要修改 Qoder 配置）

### 方案 3：使用 WSL

安装 Windows Subsystem for Linux

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-09 | 初始版本 |
