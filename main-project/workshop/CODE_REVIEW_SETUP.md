# 代码自动审核配置指南

本目录包含完整的代码质量检查和自动化审核配置，适用于 GitHub Actions 和本地开发环境。

---

## 📁 文件说明

### GitHub Actions 工作流

| 文件 | 说明 | 触发条件 |
|------|------|---------|
| `code-review.yml` | 代码审查工作流 | PR 创建/更新、push 到 main |
| `ci-tests.yml` | CI 测试工作流 | PR 创建/更新、push 到 main |

### Pre-commit 配置（提交前检查）

| 文件 | 说明 | 用途 |
|------|------|------|
| `.pre-commit-config.yaml` | Pre-commit 钩子配置 | git commit 前自动运行检查 |

### Python 代码检查配置

| 文件 | 工具 | 用途 |
|------|------|------|
| `.flake8` | Flake8 | 代码风格检查 |
| `pyproject.toml` | Black | 代码格式化 |
| `isort-config.toml` | isort | Import 排序 |
| `mypy.ini` | mypy | 静态类型检查 |

### 前端代码检查配置

| 文件 | 工具 | 用途 |
|------|------|------|
| `.eslintrc.json` | ESLint | TypeScript/React 代码检查 |
| `.prettierrc.json` | Prettier | 代码格式化 |

---

## 🚀 使用方法

### 一、配置 GitHub Actions（推荐）

#### 1. 复制工作流文件到项目

```powershell
# 在项目根目录执行
mkdir -p .github/workflows
cp workshop/code-review.yml .github/workflows/
cp workshop/ci-tests.yml .github/workflows/
```

#### 2. 推送到 GitHub

```powershell
git add .github/workflows/
git commit -m "ci: add GitHub Actions workflows"
git push origin main
```

#### 3. 查看执行结果

- 打开 GitHub 仓库页面
- 点击 **Actions** 标签
- 查看工作流运行状态

---

### 二、配置本地 Pre-commit（提交前检查）

#### 1. 安装 pre-commit

```powershell
cd backend
pip install pre-commit
```

#### 2. 复制配置文件

```powershell
# 复制 pre-commit 配置到项目根目录
cp workshop/.pre-commit-config.yaml .
```

#### 3. 安装 git 钩子

```powershell
pre-commit install
```

#### 4. 首次运行（可选）

```powershell
# 对所有文件运行检查
pre-commit run --all-files
```

#### 5. 正常开发

配置完成后，每次 `git commit` 时会自动运行以下检查：
- ✅ 代码格式化（Black）
- ✅ Import 排序（isort）
- ✅ 代码风格检查（Flake8）
- ✅ 敏感信息检测（detect-secrets）
- ✅ 文件格式验证（YAML/JSON）

---

### 三、配置 Python 代码检查工具

#### 1. 安装开发依赖

```powershell
cd backend
pip install flake8 black isort mypy
```

#### 2. 复制配置文件

```powershell
cp workshop/.flake8 ../.flake8
cp workshop/pyproject.toml ../pyproject.toml
cp workshop/isort-config.toml ../isort-config.toml
cp workshop/mypy.ini ../mypy.ini
```

#### 3. 手动运行检查

```powershell
# 代码格式化
black app/ tests/

# Import 排序
isort app/ tests/

# 代码风格检查
flake8 app/ tests/

# 类型检查
mypy app/
```

---

### 四、配置前端代码检查工具

#### 1. 安装开发依赖

```powershell
cd frontend
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier eslint-plugin-prettier prettier
```

#### 2. 复制配置文件

```powershell
cp workshop/.eslintrc.json ../.eslintrc.json
cp workshop/.prettierrc.json ../.prettierrc.json
```

#### 3. 在 package.json 中添加脚本

```json
{
  "scripts": {
    "lint": "eslint src/**/*.{ts,tsx}",
    "lint:fix": "eslint src/**/*.{ts,tsx} --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  }
}
```

#### 4. 手动运行检查

```powershell
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# Prettier 格式化
npm run format

# Prettier 检查
npm run format:check
```

---

## 🔧 自定义配置

### 调整代码风格

#### Python（Black）
编辑 `pyproject.toml`：
```toml
[tool.black]
line-length = 120  # 修改行长度
target-version = ['py311', 'py312']  # 修改目标版本
```

#### TypeScript/React（ESLint）
编辑 `.eslintrc.json`：
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",  // 改为 "error" 更严格
    "no-console": "off"  // 完全允许 console
  }
}
```

### 跳过 Pre-commit 检查

```powershell
# 临时跳过（不推荐）
git commit --no-verify -m "your message"
```

### 禁用某些 GitHub Actions Job

编辑 `.github/workflows/*.yml`，在 job 中添加：
```yaml
jobs:
  python-lint:
    if: false  # 禁用此 job
    # ...
```

---

## 📊 查看检查结果

### GitHub Actions

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择具体的工作流运行
4. 查看每个 job 的详细日志

### 本地 Pre-commit

检查结果会直接显示在终端中，失败时会阻止 commit。

### 代码覆盖率

```powershell
cd backend
pytest tests/ --cov=app --cov-report=html
# 打开 htmlcov/index.html 查看详细报告
```

---

## ⚠️ 注意事项

1. **首次运行可能较慢**：需要下载工具和依赖
2. **配置冲突**：确保 Black 和 Flake8 的行长度配置一致
3. **TypeScript 类型错误**：mypy 和 tsc 可能会有误报，可添加 `# type: ignore` 注释
4. **敏感信息检测**：如果误报，可更新 `.secrets.baseline` 文件

---

## 🤖 使用 AI 辅助代码审查

本项目的 IDE 集成了 AI 代码审查功能，可以在提交前使用：

### 生成 Commit Message

```powershell
# 使用 git-assistant 技能
# 在 IDE 中调用 Skill: git-assistant_generate_commit_message
```

### 代码审查

```powershell
# 在 IDE 中调用 Skill: code_review
# 会自动检查当前变更的代码
```

### 生成 PR 描述

```powershell
# 在 IDE 中调用 Skill: generate_pr_description
```

---

## 📚 扩展阅读

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Pre-commit 文档](https://pre-commit.com/)
- [Black 文档](https://black.readthedocs.io/)
- [ESLint 文档](https://eslint.org/)
- [SonarCloud（免费代码质量平台）](https://sonarcloud.io/)

---

## 💡 建议的完整工作流

```
1. 本地开发
   ↓
2. Pre-commit 自动检查（git commit 时）
   ↓
3. 推送到 GitHub
   ↓
4. GitHub Actions 自动运行
   - 代码质量检查
   - 单元测试
   - 集成测试
   - 安全扫描
   ↓
5. 创建 Pull Request
   ↓
6. AI 辅助代码审查
   ↓
7. 人工 Code Review
   ↓
8. 合并到 main 分支
```

---

**祝你开发顺利！** 🎉
