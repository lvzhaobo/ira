# Task T-D：BFF — `POST /research/qa/ask` 与 `evidence_refs`

| 属性 | 值 |
|------|-----|
| **依赖** | T-C(需有元数据结构/列表) |
| **Spec** | `01-Spec` §3.4 |
| **TC** | AC-05、AC-06 |

---

## 相关文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `app/main.py` | 已存在(T-B创建) | 添加问答路由 |
| `app/models.py` | 已存在(T-B创建) | 添加 AskRequest, AskResponse 等模型 |
| `specs/workshop/module-03-knowledge-copaw/openapi/kb-qa-contract.yaml` | 只读 | 参考 API Schema 和示例（相对仓库根） |
| `tests/test_ask.py` | 新建 | 接口测试用例 |

---

## 遵循规范

- [API 设计规范](../standards/api-design.md) §3.4 业务拒答处理
- [后端开发规范](../standards/backend-coding.md) §3 FastAPI 最佳实践
- [后端开发规范](../standards/backend-coding.md) §5 错误处理

---

## 完成条件

### 接口契约
- [ ] 路径：`POST /api/v1/research/qa/ask`
- [ ] 请求体字段：`query`（必填）、`session_id`（可选）、`spec_version`（可选）
- [ ] 响应体字段：`answer`、`evidence_refs[]`、`trace_id`、`model`、`compliance`
- [ ] `evidence_refs` 元素结构：`doc_id`、`page`、`ref`、`retrieval_score`
- [ ] `compliance` 结构：`decline_reason`（有证据时为 null，无证据时为 "NO_EVIDENCE"）

### 业务逻辑
- [ ] **有证据场景**：
  - 从知识库中检索相关文档（Workshop 级可简化为返回前 N 个文档）
  - 组装 `evidence_refs` 数组，包含 doc_id、页码、引用位置、相关度评分
  - 生成回答文本（可基于文档标题/内容生成简单回答）
  - `compliance.decline_reason = null`
  
- [ ] **无证据场景**：
  - `evidence_refs = []`（空数组）
  - `answer` 使用拒答模板："抱歉，当前知识库中未找到与您问题相关的可靠证据，无法作答。"
  - `compliance.decline_reason = "NO_EVIDENCE"`
  - **重要**：返回 HTTP 200，不使用 4xx 错误码（遵循 §7）

### 技术规范
- [ ] 生成唯一的 `trace_id`（格式：`tr-{uuid}`）用于追踪
- [ ] `model` 字段从环境变量读取（默认：`qwen-max`）
- [ ] 在代码注释中明确说明 Workshop 级简化策略
- [ ] 生产环境替换点标注清晰（向量检索 → 语义排序 → 证据抽取 → LLM 生成）

---

## Quest 输入模板

```
【Task】T-D：实现研报问答接口与 evidence_refs 组装

【必须遵守】《03-任务地图与Qoder-Quest执行指南》§3;《01-Spec》§3.4、§7;`specs/workshop/module-03-knowledge-copaw/openapi/kb-qa-contract.yaml`。

【契约参考】
- 行为契约:`01-Spec` §3.4 - 定义接口语义和业务规则
- 技术契约:`specs/workshop/module-03-knowledge-copaw/openapi/kb-qa-contract.yaml` - 完整 OpenAPI Schema,含示例
- 错误处理:`01-Spec` §7 + OpenAPI ErrorResponse

【前置】T-C 已完成；可从 kb 元数据构造 evidence_refs（允许 Workshop 级简化策略，但须在代码注释中写明）。

【目标】POST /research/qa/ask 行为与 Spec 一致；无证据时 200+空证据。

【实现要点】
1. 证据检索（Workshop 级简化）：
   - 若知识库为空 → 返回空证据 + 拒答模板
   - 若有文档 → 返回前 3 个文档作为证据（固定 page=1, ref="全文", retrieval_score=0.85）
   - 生产环境应替换为：向量检索 → 语义排序 → 证据抽取

2. 回答生成（Workshop 级简化）：
   - 基于文档标题生成简单回答模板
   - 生产环境应调用 LLM 基于证据生成回答

3. 合规控制：
   - 有证据：compliance.decline_reason = null
   - 无证据：compliance.decline_reason = "NO_EVIDENCE"
   - 始终返回 HTTP 200，不使用 4xx

【非目标】生产级向量检索、真正的语义匹配、LLM 集成（可后续迭代）。

【验收】
- 功能验收：02-TC 的 AC-05、AC-06；TC-04、TC-05
- 手工测试：
  1. 知识库为空时提问 → 返回拒答模板 + 空证据 + decline_reason="NO_EVIDENCE"
  2. 上传文档后提问 → 返回证据列表 + 回答 + decline_reason=null
  3. 检查 trace_id 格式正确（tr-xxxxxxxxxxxx）
  4. 检查 model 字段值符合预期