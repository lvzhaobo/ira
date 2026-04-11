# Qoder Hooks - 命令拦截脚本说明

> **功能**：通过 Hooks 机制拦截危险命令，保障代码安全  
> **位置**：`.qoder/hooks/`

---

## 📋 现有脚本清单

| 脚本名称 | 功能 | 拦截内容 |
|---------|------|---------|
| [block-dangerous-commands.sh](./block-dangerous-commands.sh) | 拦截危险系统命令 | `rm -rf`, `git push --force`, `DROP TABLE` 等 |
| [block-aaaa-command.sh](./block-aaaa-command.sh) | 拦截 aaaa 命令 | `aaaa` |
| [block-custom-commands.sh](./block-custom-commands.sh) | 自定义拦截规则 | `aaaa`, `bbbb`, `cccc` 等 |

---

## 🚀 快速使用

### 1. 拦截 "aaaa" 命令

**脚本位置**：[block-aaaa-command.sh](./block-aaaa-command.sh)

**工作原理**：
```bash
# 当 AI 尝试运行以下命令时会被拦截：
aaaa                          # ❌ 拦截
python aaaa.py                # ❌ 拦截（包含 aaaa）
echo "run aaaa command"       # ❌ 拦截（包含 aaaa）

# 以下命令不会被拦截：
echo "hello"                  # ✅ 通过
python main.py                # ✅ 通过
```

**测试结果**：
```bash
# 拦截效果
❌ 检测到被拦截的命令: aaaa
💡 提示：'aaaa' 命令已被安全策略拦截
```

---

### 2. 拦截多个自定义命令

**脚本位置**：[block-custom-commands.sh](./block-custom-commands.sh)

**配置方式**：
```bash
# 编辑脚本，修改 DANGEROUS_PATTERNS 变量
DANGEROUS_PATTERNS="aaaa|bbbb|cccc|your-command"

# 使用 | 分隔多个命令（正则表达式 OR 逻辑）
```

---

### 3. 拦截系统危险命令

**脚本位置**：[block-dangerous-commands.sh](./block-dangerous-commands.sh)

**默认拦截**：
- ❌ `rm -rf` - 递归删除
- ❌ `git push --force` - 强制推送
- ❌ `git push -f` - 强制推送（简写）
- ❌ `DROP TABLE` - 删除数据库表
- ❌ `DROP DATABASE` - 删除数据库
- ❌ `format ` - 格式化磁盘
- ❌ `mkfs` - 创建文件系统

---

## 🔧 如何自定义拦截规则

### 步骤 1：创建新脚本

```bash
# 在 .qoder/hooks/ 目录下创建脚本
touch .qoder/hooks/block-my-command.sh
```

### 步骤 2：编写拦截逻辑

```bash
#!/bin/bash
# 功能：拦截 my-dangerous-command

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')

# 添加你的拦截规则
DANGEROUS_PATTERNS="my-dangerous-command|another-bad-command"

if echo "$COMMAND" | grep -qiE "$DANGEROUS_PATTERNS"; then
  echo "❌ 检测到被拦截的命令: $COMMAND" >&2
  exit 2
fi

exit 0
```

### 步骤 3：赋予执行权限

```bash
chmod +x .qoder/hooks/block-my-command.sh
```

### 步骤 4：配置 Qoder 使用

在 `.qoder/settings.json` 中配置：
```json
{
  "hooks": {
    "before_run_command": [
      ".qoder/hooks/block-dangerous-commands.sh",
      ".qoder/hooks/block-aaaa-command.sh",
      ".qoder/hooks/block-my-command.sh"
    ]
  }
}
```

---

## 📊 Hooks 工作机制

```
AI 尝试执行命令
      ↓
触发 before_run_command Hook
      ↓
执行拦截脚本（按顺序）
      ↓
脚本检查命令是否匹配黑名单
      ↓
   匹配？
   ↙    ↘
 是      否
 ↓       ↓
exit 2  exit 0
 ↓       ↓
拦截 ❌  通过 ✅
```

---

## 🎯 实际应用场景

### 场景 1：防止误删文件

```bash
# 拦截 rm -rf 命令
DANGEROUS_PATTERNS="rm -rf|rm -r "
```

### 场景 2：防止强制推送

```bash
# 拦截 git push --force
DANGEROUS_PATTERNS="git push --force|git push -f"
```

### 场景 3：防止数据库操作

```bash
# 拦截 DROP 语句
DANGEROUS_PATTERNS="DROP TABLE|DROP DATABASE|DELETE FROM"
```

### 场景 4：团队自定义规则

```bash
# 根据团队规范添加
DANGEROUS_PATTERNS="npm publish|docker push|kubectl delete"
```

---

## 🔍 测试拦截效果

### 测试方法

```bash
# 1. 准备测试输入
echo '{"tool_input": {"command": "aaaa"}}' | .qoder/hooks/block-aaaa-command.sh

# 2. 查看输出
# 预期输出：
# ❌ 检测到被拦截的命令: aaaa
# 💡 提示：'aaaa' 命令已被安全策略拦截

# 3. 检查退出码
echo $?
# 预期输出：2（表示拦截）
```

### 测试通过案例

```bash
# 测试安全命令
echo '{"tool_input": {"command": "echo hello"}}' | .qoder/hooks/block-aaaa-command.sh
echo $?
# 预期输出：0（表示通过）
```

---

## ⚠️ 注意事项

1. **正则表达式匹配**
   - 使用 `grep -E` 支持正则表达式
   - `|` 表示 OR 逻辑
   - 注意空格和大小写

2. **误报处理**
   - 如果正常命令被误拦截，调整正则表达式
   - 使用更精确的匹配模式

3. **性能考虑**
   - Hooks 会在每次命令执行前运行
   - 保持脚本简洁，避免复杂逻辑

4. **日志记录**
   - 拦截信息输出到 stderr（`>&2`）
   - 可以根据需要添加日志文件

---

## 📝 最佳实践

### 1. 分层防护

```bash
# 第一层：系统危险命令
.qoder/hooks/block-dangerous-commands.sh

# 第二层：项目特定命令
.qoder/hooks/block-project-commands.sh

# 第三层：团队自定义
.qoder/hooks/block-team-commands.sh
```

### 2. 版本控制

```bash
# 将 Hooks 脚本纳入 Git 管理
git add .qoder/hooks/
git commit -m "feat: 添加命令拦截 Hooks"
```

### 3. 文档化

- 在 `.qoder/hooks/` 目录下创建 `README.md`
- 记录每个脚本的用途和配置方法
- 定期审查和更新黑名单

---

## 🔗 相关资源

- [Qoder Hooks 官方文档](https://docs.qoder.com/hooks)
- [Shell 脚本编程指南](https://www.shellscript.sh/)
- [正则表达式教程](https://regexr.com/)

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-09 | 初始版本，包含 aaaa 命令拦截示例 |
