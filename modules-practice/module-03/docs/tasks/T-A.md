# Task T-A：契约与 OpenAPI 片段（含统一错误体）

| 属性 | 值 |
|------|-----|
| **依赖** | 无（首 Task） |
| **Spec** | `01-Spec` §3、§7 |
| **TC** | 契约完整性检查 |
| **完成后** | 可并行开启 T-B、T-C（契约已固定） |

---

## 相关文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `openapi/kb-qa-contract.yaml` | 新建 | OpenAPI 3.0 契约文档 |
| `docs/01-Spec-知识库与问答-CoPaw底座-v0.1.md` | 已存在 | 参考 API 行为定义 |

---

## 遵循规范

- [API 设计规范](../standards/api-design.md) §6 文档规范

---

## 完成条件

- [ ] 存在 **OpenAPI 片段**（或等价契约文档），覆盖：`GET /kb/documents`、`GET /kb/index/status`、`POST /research/qa/upload`、`POST /research/qa/ask` 的 **路径、方法、主字段**。  
- [ ] **错误响应** 与 `01-Spec` §7 形状一致；**业务拒答** 仍为 200 + 空 `evidence_refs`（§3.4）。  
- [ ] 无未文档化的必填字段变更。

---

## Quest 输入模板（复制到 Qoder Quest）

```
【Task】T-A：冻结知识库与问答相关 API 契约

【必须遵守】先阅读同目录《03-任务地图与Qoder-Quest执行指南》§3「统一约定」；JSON 字段名与《01-Spec》§3、§7 完全一致。

【目标】产出 OpenAPI 3.x 片段（yaml）或等价文档，仅包含本节四条路径及成功/错误结构，不要实现业务代码。

【非目标】不写实现、不连接数据库、不写前端。

【验收】字段名与 Spec 一致；错误体含 error/code/trace_id；业务无证据走 200+空 evidence_refs。
```
