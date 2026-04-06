# Workshop 变更模板库

本目录用于固定需求变更模板，避免“每次变更都重写模板”导致口径漂移。

## 模板列表

- `change-request-template.md`：需求变更申请单（CR）
- `spec-update-checklist.md`：Spec 更新核对清单
- `impact-analysis-template.md`：影响分析模板（跨模块/跨接口）
- `rollback-template.md`：回退方案模板

## 使用规则

1. 模板文件保持稳定，不在业务变更 PR 中随意改动。  
2. 每次变更复制模板到模块目录或 PR 描述中填写。  
3. 流程遵循“先 Spec，后代码”。

