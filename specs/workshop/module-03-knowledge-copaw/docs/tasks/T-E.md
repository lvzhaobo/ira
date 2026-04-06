# Task T-E：前端或最小 UI — 列表 + 提问

| 属性 | 值 |
|------|-----|
| **依赖** | T-B、T-D |
| **Spec** | 与 §3 联调;无新增契约则不改 openapi |
| **TC** | 联调 AC-01～05 |

---

## 相关文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/index.html` | 新建 | 前端页面(含文档列表和问答区) |
| `frontend/.env.example` | 已存在 | 环境变量示例 |
| `specs/workshop/module-03-knowledge-copaw/openapi/kb-qa-contract.yaml` | 只读 | 参考 API Schema（相对仓库根） |

---

## 遵循规范

- [前端开发规范](../standards/frontend-coding.md) §5 API 调用规范
- [前端开发规范](../standards/frontend-coding.md) §6 UI 组件规范

---

## 完成条件

- [ ] 能调用 `GET /kb/documents` 展示列表（含空态/错误态）。
- [ ] 能调用 `POST /research/qa/ask` 展示 `answer` 与 `evidence_refs`（最小可仅为 JSON 展示）。
- [ ] （可选）上传入口调 `POST /research/qa/upload`。

---

## UI 要求

遵循 [`docs/standards/frontend-coding.md`](../standards/frontend-coding.md):
- §5 API 调用规范
- §6 UI 组件规范
- §7 安全规范(XSS 防护)

**最低标准:**
- 使用 Bootstrap 5 CDN
- 卡片式布局
- Toast 通知(非 alert)
- 加载状态反馈
- 响应式布局

**参见:** [`04-Design`](../04-Design-技术设计方案.md) §4 ADR-004 前端技术选型

---

## Quest 输入模板

```
【Task】T-E：最小前端联调（知识列表 + 问答展示）

【必须遵守】《03-任务地图与Qoder-Quest执行指南》§3；不新增与《01-Spec》冲突的字段。

【前置】T-B、T-D 已在同一环境可访问。

【目标】页面或脚本：拉列表、发 ask、展示引用；基 URL 用环境变量。

【UI 规范】遵循 T-E.md「UI 规范（Workshop 级别）」：
- 使用 Bootstrap 5 或 Tailwind CSS（CDN 引入）
- 卡片式布局，配色使用主色 #0d6efd
- 按钮有交互反馈，表单有标签和提示
- 错误使用 Alert 而非 alert 弹窗
- 达到「简洁、可用、专业」级别

【非目标】不要求视觉还原设计稿；不要求响应式完美；不要求动画特效。

【验收】手工走通上传→列表→提问；对照 02-TC 相关 AC；UI 达到上述验收标准。
```
