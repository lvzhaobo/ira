# 为什么 block-rm.sh 没有生效？

> **问题**：创建了 `block-rm.sh` 脚本，但 rm 命令仍然可以执行  
> **原因**：Windows 系统缺少 bash 运行环境

---

## 🔍 问题诊断

### 根本原因

```
Qoder Hooks 机制
    ↓
需要执行 .sh 脚本
    ↓
需要 bash 环境
    ↓
❌ Windows 系统默认没有 bash
    ↓
脚本无法执行 → 拦截失效
```

### 错误信息

```
<3>WSL (10 - Relay) ERROR: CreateProcessCommon:800: execvpe(/bin/bash) failed: No such file or directory
```

这个错误说明系统找不到 `bash` 可执行文件。

---

## ✅ 解决方案（3 选 1）

### 方案 1：安装 Git Bash（推荐 ⭐⭐⭐⭐⭐）

**优点**：
- ✅ 最简单、最稳定
- ✅ 与 Qoder 官方文档一致
- ✅ 支持所有 .sh Hooks 脚本

**安装步骤**：

```powershell
# 1. 使用 winget 安装（推荐）
winget install --id Git.Git -e --source winget

# 2. 安装 jq（JSON 处理工具）
winget install jqlang.jq

# 3. 重启 Qoder
```

**验证安装**：

```powershell
# 检查 bash 是否可用
bash --version

# 检查 jq 是否可用
jq --version

# 测试 Hooks
echo '{"tool_input": {"command": "rm -rf test"}}' | bash .qoder/hooks/block-rm.sh
# 应该输出：❌ 危险命令已被阻止: rm -rf test
```

---

### 方案 2：使用 PowerShell 脚本（替代方案）

**优点**：
- ✅ 不需要安装额外软件
- ✅ Windows 原生支持

**缺点**：
- ⚠️ 需要修改 Qoder 配置使用 .ps1 而不是 .sh
- ⚠️ 可能不被 Qoder 官方支持

**已创建的文件**：
- [block-rm.ps1](./block-rm.ps1) - PowerShell 版本的拦截脚本

**测试方法**：

```powershell
# 手动测试
$json = '{"tool_input": {"command": "rm -rf test"}}'
$json | powershell -ExecutionPolicy Bypass -File .qoder\hooks\block-rm.ps1
```

---

### 方案 3：启用 WSL（Windows Subsystem for Linux）

**优点**：
- ✅ 完整的 Linux 环境
- ✅ 支持所有 Linux 工具

**缺点**：
- ⚠️ 安装较复杂
- ⚠️ 占用更多系统资源

**安装步骤**：

```powershell
# 1. 启用 WSL
wsl --install

# 2. 重启电脑

# 3. 安装 Ubuntu（或其他发行版）

# 4. 测试
wsl bash --version
```

---

## 📊 方案对比

| 方案 | 难度 | 稳定性 | 兼容性 | 推荐度 |
|------|------|--------|--------|--------|
| 安装 Git Bash | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| PowerShell 脚本 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| 启用 WSL | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🚀 推荐操作（5 分钟搞定）

### 第 1 步：安装 Git Bash 和 jq

```powershell
# 打开 PowerShell，执行：
winget install --id Git.Git -e --source winget
winget install jqlang.jq
```

### 第 2 步：重启 Qoder

**重要**：必须重启 Qoder，否则配置不会生效！

### 第 3 步：测试拦截

在 Qoder 中尝试执行：
```bash
rm -rf test
```

应该看到：
```
❌ 危险命令已被阻止: rm -rf test
💡 提示：'rm' 命令已被安全策略拦截
```

---

## 🔧 当前已修复的问题

### 问题 1：脚本语法错误 ✅ 已修复

**修复前**：
```bash
exit 0
EOF                              # ❌ 多余
chmod +x ~/.qoder/hooks/block-rm.sh  # ❌ 不应该在脚本里
```

**修复后**：
```bash
# 安全检查通过，允许执行
exit 0
```

### 问题 2：正则表达式优化 ✅ 已修复

**修复前**：
```bash
# 过于宽泛，会误拦截包含 "rm" 的命令
grep -q 'rm'
```

**修复后**：
```bash
# 精确匹配 rm 命令
grep -qiE '(^rm | rm |^rm$)'
```

### 问题 3：错误提示改进 ✅ 已修复

**修复前**：
```
危险命令已被阻止: xxx
```

**修复后**：
```
❌ 危险命令已被阻止: xxx
💡 提示：'rm' 命令已被安全策略拦截
```

---

## 📝 配置检查清单

安装完成后，检查以下配置：

- [ ] Git Bash 已安装（`bash --version` 有输出）
- [ ] jq 已安装（`jq --version` 有输出）
- [ ] 已重启 Qoder
- [ ] `settings.json` 中已配置 Hooks
- [ ] 测试 `rm` 命令被拦截
- [ ] 测试 `echo` 命令正常执行

---

## 🎯 快速验证

```powershell
# 1. 检查环境
bash --version
jq --version

# 2. 测试拦截
echo '{"tool_input": {"command": "rm -rf test"}}' | bash .qoder/hooks/block-rm.sh

# 3. 测试通过
echo '{"tool_input": {"command": "echo hello"}}' | bash .qoder/hooks/block-rm.sh
```

---

## 💡 为什么之前我创建的脚本没生效？

### 原因总结

1. **脚本有语法错误**
   - 包含了 `EOF` 和 `chmod` 命令（应该是创建脚本的命令，不是脚本内容）

2. **系统缺少 bash 环境**
   - Windows 默认没有 bash
   - 需要安装 Git Bash 或 WSL

3. **可能没有执行权限**
   - Linux/Mac 需要 `chmod +x`
   - Windows 上通过 Git Bash 执行不需要

---

## 🔗 相关文档

- [安装 Git Bash 指南](./INSTALL_GIT_BASH.md)
- [Hooks 使用说明](./README.md)
- [配置快速指南](./CONFIG_GUIDE.md)
- [配置完成总结](./SETUP_SUMMARY.md)

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-09 | 初始版本，诊断 block-rm.sh 未生效问题 |
