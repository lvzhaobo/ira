# Task T-B：BFF — `GET /kb/documents` 与 `GET /kb/index/status`

| 属性 | 值 |
|------|-----|
| **依赖** | T-A 完成(契约冻结) |
| **Spec** | `01-Spec` §3.1、§3.2 |
| **TC** | AC-01、AC-02 |

---

## 相关文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `app/main.py` | 新建 | BFF 应用入口,注册路由 |
| `app/__init__.py` | 新建 | Python 包标识 |
| `app/models.py` | 新建 | Pydantic 数据模型 |
| `openapi/kb-qa-contract.yaml` | 只读 | 参考 API Schema |

---

## 遵循规范

- [API 设计规范](../standards/api-design.md) §2.1 路径命名
- [后端开发规范](../standards/backend-coding.md) §3 FastAPI 最佳实践

---

## 完成条件

### 接口契约
- [ ] `GET /api/v1/kb/documents` 返回 200，`items` 为数组（可为空）
- [ ] 每个 item 含字段：`doc_id`, `title`, `source_filename`, `ingested_at`, `status`, `bytes`
- [ ] `GET /api/v1/kb/index/status` 返回 200，含 `index_ver`, `updated_at`, `status`
- [ ] `status` 枚举值：`idle`, `indexing`, `ready`, `error`

### 业务逻辑
- [ ] 数据源可为内存 dict（Workshop 简化）
- [ ] 无文档时返回 `items: []`
- [ ] 索引状态可返回固定示意值（如 `status: "ready"`）

### 技术规范
- [ ] 使用 Pydantic 模型定义响应结构
- [ ] 时间字段使用 ISO 8601 格式
- [ ] 错误时返回统一错误体（§7）

---

## Quest 输入模板

```
【Task】T-B：实现 BFF 两个 GET 接口（知识库列表与索引状态）

【必须遵守】《03-任务地图与Qoder-Quest执行指南》§3；《01-Spec》§3.1、§3.2、§7。

【前置】T-A 契约已冻结；实现路径与 openapi 一致。

【目标】在现有后端框架中注册路由，数据源可为内存/JSON 占位，行为与 Spec 一致。

【实现要点】
1. GET /kb/documents:
   - 从内存 dict _kb_documents 读取所有文档
   - 转换为 KbDocumentItem 列表
   - 返回 KbDocumentsResponse(items=...)

2. GET /kb/index/status:
   - Workshop 级别可返回固定值
   - index_ver: "v1.0"
   - status: "ready"
   - updated_at: 当前时间 ISO 8601

【非目标】不实现 upload/ask；不接入真实向量索引。

【验收】
- 功能验收：02-TC 的 AC-01、AC-02；TC-01
- 手工测试：
  1. 调用 GET /kb/documents → 返回 200, items 为数组
  2. 调用 GET /kb/index/status → 返回 200, 含必需字段
  3. 检查 JSON 字段名与 Spec 一致
```
