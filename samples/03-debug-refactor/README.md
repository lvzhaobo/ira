# Debug & Refactor Challenge — 投研助手代码体检

> **模块 24**：Debug · 代码重构 · 企业经验沉淀 | Day 5 下午 14:00-15:00

## 🎯 目标

各小组编写 **Qoder SKILL**，让 AI 自动扫描 `buggy-app/` 代码库，发现尽可能多的问题，并将扫描能力沉淀为**可复用的企业资产**。

## ⏱ 流程（60 分钟）

| 阶段 | 时长 | 内容 |
|------|------|------|
| ① 分工 | 10min | 阅读代码，每人认领一个扫描类别 |
| ② 写 SKILL | 25min | 每人编写各自类别的扫描 SKILL |
| ③ 跑 SKILL | 5min | 集成员整合 → 一键扫描 → 生成报告 |
| ④ 评比 | 15min | 讲师出排行榜 → 各组展示最佳 SKILL |
| ⑤ 讨论 | 5min | "这些 SKILL 带回企业后怎么用？" |

## 👥 小组角色分配（8人/组）

| 角色 | 负责 SKILL | 扫描类别 |
|------|-----------|---------|
| S1 | `scan-compliance.md` | 金融合规 · 敏感词 |
| S2 | `scan-observability.md` | 可观测性 · 日志 · Trace |
| S3 | `scan-api-contract.md` | API 契约 · 状态码 · 格式 |
| S4 | `scan-data-precision.md` | 数据精度 · 金额计算 |
| S5 | `scan-concurrency.md` | 并发安全 · 竞态条件 |
| S6 | `scan-degradation.md` | 降级策略 · 容错设计 |
| S7 | `scan-all.md` | 集成全部 SKILL，一键扫描 |
| S8 | 报告整理 | 汇总 findings → 提交 JSON |

> 不足 8 人时，一人可兼两个类别。

## 🚀 快速开始

```powershell
# 1. 进入练习目录
cd samples/03-debug-refactor/buggy-app

# 2. 安装依赖
pip install -r requirements.txt

# 3. 生成示例数据
python seed_data.py

# 4. 启动应用（可选，用于手工探索）
python app.py
# 访问 http://localhost:5002/api/v1/health
```

## 📝 SKILL 编写规则

1. SKILL 文件放在 `.qoder/skills/` 目录下
2. 必须遵循 `skill-template.md` 格式
3. 扫描规则要**通用化**——不要写死行号，要描述模式
4. 输出必须是标准 JSON 格式的 findings

## 📤 提交格式

每组提交一个 `findings.json`，格式见 `report-template.json`。

## ⚠️ 注意

- 代码库中的问题**跨类别融合**：一个函数可能同时有合规、可观测性、API 契约三方面问题
- 不同 SKILL 可能从不同角度发现同一段代码的不同问题——这是**正确的**
- 评分以**讲师准备的标准问题**为基准，额外有效发现可加分

## 🏆 评分规则

| 维度 | 权重 | 说明 |
|------|------|------|
| 扫描效果 | 60% | 命中标准问题的数量和准确度 |
| SKILL 复用性 | 40% | 规则是否通用（换一个代码库还能用？） |

## 六大扫描类别说明

### 🔒 金融合规
- 合规词库覆盖度、扫描覆盖度、敏感信息泄露

### 👁 可观测性
- Trace ID 链路完整性、日志规范、异常处理可见性

### 📋 API 契约
- 错误响应格式一致性、HTTP 状态码规范、分页设计

### 🔢 数据精度
- 金额/净值计算精度、格式化正确性、排序逻辑

### 🔄 并发安全
- 锁粒度、共享状态保护、竞态窗口

### 🛡 降级策略
- 外部依赖超时、失败降级、异常可见性
