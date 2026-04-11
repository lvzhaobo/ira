# Qoder 配置快速指南

> **目标**：完成 Hooks 和安全配置的快速设置  
> **预计时间**：5 分钟

---

## ✅ 已完成的配置

### 1. Settings.json 配置

**文件位置**：[.qoder/settings.json](../settings.json)

**已配置内容**：
- ✅ Hooks 命令拦截（3 层防护）
- ✅ TDD 工作流设置
- ✅ Spec 驱动开发配置
- ✅ 代码质量要求
- ✅ 安全审计日志

### 2. Hooks 脚本

**脚本位置**：[.qoder/hooks/](./)

| 脚本 | 功能 | 状态 |
|------|------|------|
| [block-dangerous-commands.sh](./block-dangerous-commands.sh) | 拦截系统危险命令 | ✅ 已创建 |
| [block-aaaa-command.sh](./block-aaaa-command.sh) | 拦截 aaaa 命令 | ✅ 已创建 |
| [block-custom-commands.sh](./block-custom-commands.sh) | 自定义拦截规则 | ✅ 已创建 |

### 3. 审计日志

**文件位置**：[.qoder/hooks/audit.log](./audit.log)

**功能**：记录所有被拦截的命令，便于安全审计

---

## 🚀 快速测试

### 测试 1：验证配置加载

重启 Qoder 后，配置文件会自动加载。你可以通过以下方式验证：

1. 打开 Qoder
2. 尝试执行命令 `aaaa`
3. 应该看到拦截提示：
   ```
   ❌ 检测到被拦截的命令: aaaa
   💡 提示：'aaaa' 命令已被安全策略拦截
   ```

### 测试 2：查看拦截日志

```bash
# 查看审计日志
cat .qoder/hooks/audit.log
```

---

## 🔧 自定义配置

### 1. 添加更多拦截命令

编辑 [block-custom-commands.sh](./block-custom-commands.sh)：

```bash
# 找到这一行（第 15 行）
DANGEROUS_PATTERNS="aaaa|bbbb|cccc|test-command|echo pwned"

# 添加你的命令（用 | 分隔）
DANGEROUS_PATTERNS="aaaa|your-command|another-bad-command"
```

### 2. 调整 TDD 设置

编辑 [settings.json](../settings.json)：

```json
{
  "ai": {
    "tdd": {
      "enabled": true,              // 启用 TDD
      "test_first": true,           // 测试先行
      "red_green_refactor_cycle": true,  // 红-绿-重构循环
      "wait_for_approval": true     // 每步等待确认
    }
  }
}
```

### 3. 配置 Spec 文档路径

如果你的 Spec 文档在其他位置，修改：

```json
{
  "ai": {
    "spec_driven": {
      "spec_paths": [
        "specs/",
        ".tmp/tdd-20260409/part-3/",
        "your-spec-path/"  // 添加你的路径
      ]
    }
  }
}
```

---

## 📊 配置层级说明

### 三层防护机制

```
第一层：系统危险命令拦截
  ↓ (block-dangerous-commands.sh)
  拦截：rm -rf, git push --force, DROP TABLE 等

第二层：项目特定命令拦截
  ↓ (block-aaaa-command.sh)
  拦截：aaaa（示例）

第三层：团队自定义拦截
  ↓ (block-custom-commands.sh)
  拦截：aaaa, bbbb, cccc 等
```

**执行顺序**：按 settings.json 中定义的顺序依次执行，任何一个脚本拦截都会阻止命令执行。

---

## 🔍 常见问题

### Q1: 如何临时禁用某个 Hooks 脚本？

**方法 1**：注释掉 settings.json 中的配置

```json
{
  "hooks": {
    "before_run_command": [
      ".qoder/hooks/block-dangerous-commands.sh",
      // ".qoder/hooks/block-aaaa-command.sh",  // 临时禁用
      ".qoder/hooks/block-custom-commands.sh"
    ]
  }
}
```

**方法 2**：重命名脚本文件

```bash
# 添加 .disabled 后缀
mv .qoder/hooks/block-aaaa-command.sh .qoder/hooks/block-aaaa-command.sh.disabled
```

### Q2: 如何查看哪些命令被拦截了？

```bash
# 查看审计日志
cat .qoder/hooks/audit.log

# 实时监控（Linux/Mac）
tail -f .qoder/hooks/audit.log
```

### Q3: 正常命令被误拦截怎么办？

**方法 1**：调整正则表达式

编辑对应的脚本，使用更精确的匹配：

```bash
# 修改前（过于宽泛）
DANGEROUS_PATTERNS="aaaa"

# 修改后（精确匹配）
DANGEROUS_PATTERNS="^aaaa$|^aaaa "
```

**方法 2**：添加白名单逻辑

```bash
# 在拦截前检查白名单
WHITELIST_PATTERNS="aaaa-test|aaaa-demo"

if echo "$COMMAND" | grep -qiE "$WHITELIST_PATTERNS"; then
  exit 0  # 白名单命令放行
fi
```

### Q4: 如何让配置生效？

**方法 1**：重启 Qoder（推荐）

**方法 2**：重新加载配置
- 在 Qoder 中按 `Ctrl+Shift+P`
- 输入 "Reload Settings"
- 选择 "Reload Qoder Settings"

---

## 📝 最佳实践

### 1. 版本控制

将 Hooks 配置纳入 Git 管理：

```bash
git add .qoder/settings.json
git add .qoder/hooks/
git commit -m "feat: 添加 Qoder Hooks 安全配置"
```

### 2. 团队共享

将配置同步给团队成员：

```bash
# 推送配置
git push

# 团队成员拉取
git pull
```

### 3. 定期审查

每周审查一次审计日志：

```bash
# 查看本周拦截记录
cat .qoder/hooks/audit.log

# 调整拦截规则（如有误报）
# 编辑 block-custom-commands.sh
```

### 4. 备份配置

```bash
# 备份 settings.json
cp .qoder/settings.json .qoder/settings.json.backup

# 备份 hooks 目录
cp -r .qoder/hooks/ .qoder/hooks.backup/
```

---

## 🎯 下一步

### 推荐操作

1. ✅ **测试拦截功能**
   - 尝试执行 `aaaa` 命令
   - 验证是否被正确拦截

2. ✅ **查看审计日志**
   - 检查 `.qoder/hooks/audit.log`
   - 确认日志记录正常

3. ✅ **调整拦截规则**
   - 根据实际需求修改 `DANGEROUS_PATTERNS`
   - 添加团队特定的拦截命令

4. ✅ **同步给团队**
   - 提交配置到 Git
   - 通知团队成员拉取

### 进阶配置

- 添加更多 Hooks 脚本（如代码规范检查）
- 配置自动化测试触发器
- 设置代码质量门禁
- 集成 CI/CD 流程

---

## 🔗 相关文档

- [Hooks 使用说明](./README.md)
- [Qoder 官方文档](https://docs.qoder.com/)
- [TDD 学习方案](../../.tmp/tests/TDD学习方案.md)
- [Spec 文档](../../.tmp/tdd-20260409/part-3/)

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-09 | 初始版本，完成 Hooks 和 TDD 配置 |
