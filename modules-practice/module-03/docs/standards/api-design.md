# API 设计规范

> **版本**: v1.0  
> **适用范围**: 本项目所有 REST API 设计  
> **参考标准**: RESTful API Best Practices, Microsoft REST API Guidelines

---

## 1. 基本原则

### 1.1 资源导向
- URL 表示资源(名词),不表示动作(动词)
- 使用复数形式: `/documents` 而非 `/document`
- 层级关系清晰: `/kb/documents/{doc_id}`

### 1.2 HTTP 方法语义
| 方法 | 用途 | 幂等性 |
|------|------|--------|
| GET | 获取资源 | ✅ |
| POST | 创建资源 | ❌ |
| PUT | 全量更新 | ✅ |
| PATCH | 部分更新 | ❌ |
| DELETE | 删除资源 | ✅ |

### 1.3 版本控制
- 通过 URL 路径: `/api/v1/...`
- 禁止通过 Header 或 Query Parameter

---

## 2. 请求规范

### 2.1 路径命名
```
✅ 正确:
GET    /api/v1/kb/documents
POST   /api/v1/research/qa/upload
POST   /api/v1/research/qa/ask

❌ 错误:
GET    /api/v1/getDocuments
POST   /api/v1/uploadFile
POST   /api/v1/askQuestion
```

### 2.2 查询参数
- 过滤: `?status=ready`
- 分页: `?page=1&limit=20`
- 排序: `?sort=ingested_at&order=desc`
- 字段选择: `?fields=doc_id,title`

### 2.3 请求头
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>  # 如需要认证
```

### 2.4 请求体
- JSON 格式
- 使用 snake_case 命名字段
- 必填字段在 Schema 中标注

---

## 3. 响应规范

### 3.1 成功响应

**单个资源:**
```json
{
  "doc_id": "doc-001",
  "title": "示例文档",
  "status": "ready"
}
```

**资源列表:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**操作结果:**
```json
{
  "doc_id": "doc-002",
  "trace_id": "tr-abc123",
  "message": "上传成功"
}
```

### 3.2 错误响应

**统一错误体:**
```json
{
  "error": "人类可读的错误描述",
  "code": "MACHINE_READABLE_CODE",
  "trace_id": "tr-xyz789"
}
```

**HTTP 状态码映射:**
| 状态码 | 场景 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突(如重复上传) |
| 413 | 请求体过大 |
| 415 | 不支持的媒体类型 |
| 422 | 语义错误(参数合法但业务不允许) |
| 500 | 服务器内部错误 |
| 502 | 上游服务错误 |
| 503 | 服务不可用 |

### 3.3 特殊场景: 业务拒答

**重要**: 业务层面的"拒答"(如无证据)仍返回 HTTP 200,不使用错误体:

```json
{
  "answer": "抱歉,当前知识库中未找到与您问题相关的可靠证据,无法作答。",
  "evidence_refs": [],
  "trace_id": "tr-ask-001",
  "model": "qwen-max",
  "compliance": {
    "decline_reason": "NO_EVIDENCE"
  }
}
```

**理由**: 这是正常的业务逻辑,不是错误。

---

## 4. 数据格式规范

### 4.1 命名约定
- 字段名: `snake_case` (如 `doc_id`, `ingested_at`)
- 枚举值: `UPPER_CASE` (如 `READY`, `INDEXING`)
- 布尔值: 使用 `true/false`,不用 `1/0`

### 4.2 时间格式
- 统一使用 ISO 8601: `2026-04-04T10:30:00Z`
- 包含时区信息

### 4.3 空值处理
- 可选字段缺失时: 不包含该字段
- 可选字段为 null 时: `"field": null`
- 数组为空时: `"items": []`

### 4.4 分页规范
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

## 5. 安全规范

### 5.1 敏感信息
- ❌ 不在响应中返回密钥、Token
- ❌ 不在日志中记录完整请求体(含敏感数据)
- ✅ 使用 trace_id 追踪请求

### 5.2 输入验证
- 所有外部输入必须验证
- 文件大小限制
- 文件类型白名单
- SQL 注入防护
- XSS 防护

### 5.3 速率限制
- 建议实现: 100 requests/minute/IP
- 超限返回 429 Too Many Requests

---

## 6. 文档规范

### 6.1 OpenAPI 要求
- 每个接口必须有 summary 和 description
- 提供至少一个 example
- 标注所有必填字段
- 定义所有可能的响应码

### 6.2 变更管理
- 破坏性变更: 升级主版本或新增 `/v2`
- 新增可选字段: 不视为破坏性变更
- 记录所有变更到 Changelog

---

## 7. 性能规范

### 7.1 响应时间目标
- P95 < 500ms (简单查询)
- P95 < 2s (复杂查询/上传)

### 7.2 缓存策略
- GET 请求可缓存
- 使用 ETag/Last-Modified
- 明确 Cache-Control header

### 7.3 压缩
- 启用 Gzip 压缩
- 响应体 > 1KB 时压缩

---

## 8. 检查清单

开发完成后自查:

- [ ] URL 符合资源导向原则
- [ ] HTTP 方法使用正确
- [ ] 所有响应都有正确的状态码
- [ ] 错误响应使用统一错误体
- [ ] 字段命名使用 snake_case
- [ ] 时间格式为 ISO 8601
- [ ] OpenAPI 文档完整
- [ ] 提供了示例数据
- [ ] 敏感信息未泄露
- [ ] 输入已验证
