# Task T-C：BFF — `POST /research/qa/upload`

| 属性 | 值 |
|------|-----|
| **依赖** | T-A;与 T-B 可并行(契约已对齐) |
| **Spec** | `01-Spec` §3.3 |
| **TC** | AC-03、AC-04 |

---

## 相关文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `app/main.py` | 已存在(T-B创建) | 添加上传路由 |
| `app/models.py` | 已存在(T-B创建) | 添加 UploadResponse 模型 |
| `app/uploads/` | 新建目录 | 存储上传的文件 |
| `specs/workshop/module-03-knowledge-copaw/openapi/kb-qa-contract.yaml` | 只读 | 参考 API Schema（相对仓库根） |

---

## 遵循规范

- [API 设计规范](../standards/api-design.md) §2.3 请求头、§3.2 错误响应
- [后端开发规范](../standards/backend-coding.md) §4 数据验证

---

## 完成条件

### 接口契约
- [ ] `POST /api/v1/research/qa/upload` 接受 `multipart/form-data`
- [ ] 必填字段：`file`（单文件）；可选字段：`title`
- [ ] 成功返回 200，含 `doc_id`, `trace_id`, `message`
- [ ] 失败返回 4xx + 统一错误体

### 业务逻辑
- [ ] 验证文件大小（限制 50MB）
- [ ] 验证文件类型（PDF, TXT, MD, DOC, DOCX）
- [ ] 保存文件到 `app/uploads/{doc_id}.{ext}`
- [ ] 生成元数据并存入内存 dict `_kb_documents`
- [ ] 生成的 `doc_id` 能在 `GET /kb/documents` 中看到

### 技术规范
- [ ] 使用 FastAPI 的 `UploadFile` 和 `File`
- [ ] 生成唯一 `doc_id`（格式：`doc-{8位hex}`）
- [ ] 生成唯一 `trace_id`（格式：`tr-{12位hex}`）
- [ ] 时间使用 ISO 8601 格式
- [ ] 状态默认为 `"ready"`

---

## Quest 输入模板

```
【Task】T-C：实现研报/材料上传入库

【必须遵守】《03-任务地图与Qoder-Quest执行指南》§3；《01-Spec》§3.3、§7。

【前置】T-A 冻结；若 T-B 已合并，上传后应能在 GET /kb/documents 中看到新条目。

【目标】落盘文件 + 更新 kb 元数据列表；返回 doc_id/trace_id。

【实现要点】
1. 文件验证:
   - 检查文件大小 < 50MB → 否则返回 413
   - 检查 content_type 在白名单 → 否则返回 415
   - 白名单: application/pdf, text/plain, application/msword, ...

2. 文件保存:
   - 生成 doc_id = f"doc-{uuid.hex[:8]}"
   - 生成 trace_id = f"tr-{uuid.hex[:12]}"
   - 保存到 app/uploads/{doc_id}.{ext}

3. 元数据存储:
   - 创建 KbDocumentItem(doc_id=..., title=..., status="ready", ...)
   - 存入 _kb_documents[doc_id] = item

4. 错误处理:
   - 文件过大: 413 FILE_TOO_LARGE
   - 类型不支持: 415 UNSUPPORTED_FILE_TYPE
   - 保存失败: 500 FILE_SAVE_ERROR

【非目标】不做 PDF 解析与向量索引（属后续 Task）。

【验收】
- 功能验收：02-TC 的 AC-03、AC-04；TC-02、TC-03、TC-06
- 手工测试：
  1. 上传小 PDF → 返回 200, doc_id 非空
  2. 调用 GET /kb/documents → items 中含新 doc_id
  3. 上传超大文件 → 返回 413
  4. 上传 .exe 文件 → 返回 415