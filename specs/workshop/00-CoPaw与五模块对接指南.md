# CoPaw 与五模块对接指南（Workshop）

> 对应 [`00-全项目-企业研发规范-Mock.md`](./00-全项目-企业研发规范-Mock.md) **§7.5**。用于 Day 1 扫控制台与后续按模块对照能力。

## 1. Day 1 建议扫描（控制台）

- 渠道 / Channel 是否启用（与 **M4** 叙事相关）  
- Skills 列表与触发方式（与 **M2 定时同步、M3 检查、M5 编排** 相关）  
- 模型与 Provider 配置（**勿**在课堂展示真实 Key）

## 2. 模块 ↔ CoPaw 能力（速查）

| 模块 | 规格包路径 | 优先对照能力 |
|------|------------|--------------|
| M1 | `module-01-investment-assistant/docs/` | 可选 Skill；**主链路不经 CoPaw**（见各模块 `08`） |
| M2 | `module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/` | Cron、Skill 触发 BFF；MCP 封装数据源 |
| M3 | `module-03-knowledge-copaw/docs/` | Skill、Workflow、对话入口 vs BFF 契约 |
| M4 | `module-04-notify/docs/` | Channel 出站；BFF 审计真源 |
| M5 | `module-05-multi-agent/docs/` | 多 Agent / MCP；与 `11` 编排策略一致 |

## 3. 真源顺序

1. 各模块 **`09` API** 与 **`openapi/`**（若有）  
2. **`00` §7** 全项目 CoPaw 原则  
3. 再落 CoPaw 侧配置与 Demo

---

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-06 | 补齐 §7.5 外链，避免死链 |
