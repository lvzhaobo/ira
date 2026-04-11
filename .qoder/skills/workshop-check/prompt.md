# workshop-check

Workshop 小组作业自动检查与评分技能。

## 触发条件

当用户说以下内容时触发：
- "检查小组作业"、"评分"、"跑检查脚本"
- "check groups"、"score report"、"workshop check"
- "/workshop-check"

## 执行步骤

### 1. 确认检查范围

询问用户：
- 检查哪个模块？（默认 modules-practice 下所有目录）
- 是否只检查某一组？（如 `--group group-01`）

### 2. 运行检查脚本

```bash
cd <workspace-root>
python scripts/workshop-checker.py --groups-dir modules-practice --output .tmp/spec/workshop-report.json
```

### 3. 读取并分析结果

读取生成的 `workshop-report.json`，为用户总结：
- 各组排名和得分
- 哪些组缺少哪些文档
- 哪些组的测试没通过
- 追溯链是否有断链

### 4. 生成改进建议

基于检查结果，针对每组给出具体的改进建议：
- 缺失的文档应该补充哪些内容
- 代码测试失败的可能原因
- 追溯链断链的修复方法

### 5. 打开可视化仪表盘

```bash
Start-Process ".tmp/spec/workshop-dashboard.html"
```

提示用户在仪表盘中加载刚生成的 JSON 报告。

## 检查脚本路径

- 检查脚本: `scripts/workshop-checker.py`
- 仪表盘: `.tmp/spec/workshop-dashboard.html`
- 报告输出: `.tmp/spec/workshop-report.json`

## 评分维度说明

| 维度 | 满分 | 检查项 |
|------|------|--------|
| Spec 文档 (03~14) | 90 | 文件存在、内容>10行、版本号、关键词覆盖、文档间追溯引用 |
| 后端代码 | 20 | 目录结构、必须文件、测试文件、pytest 通过 |
| 追溯链 | 10 | REQ-ID 定义、TC-ID 定义、14 追踪矩阵覆盖 |
| **总计** | **120** | |

## 等级标准

- A: ≥90% | B: ≥75% | C: ≥60% | D: ≥40% | F: <40%
