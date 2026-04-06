# ira_research_ask

将用户问题发送至 BFF 研报问答接口，并格式化返回结果。

## 行为

1. 读取用户输入的问题（query）
2. 通过 HTTP POST 请求发送至 BFF 的 `/api/v1/research/qa/ask` 接口
3. 解析响应并格式化展示 `answer` 与 `evidence_refs`

## 配置

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `BFF_BASE_URL` | BFF 服务基地址 | `http://localhost:8000` 或 `https://api.example.com` |

**注意**：密钥与基 URL 来自环境配置，**不写入仓库**。

## API 契约

### 请求

- **方法**: POST
- **路径**: `{BFF_BASE_URL}/api/v1/research/qa/ask`
- **Content-Type**: `application/json`
- **请求体**:

```json
{
  "query": "string",
  "session_id": "string | null",
  "spec_version": "string | null"
}
```

### 响应（HTTP 200）

```json
{
  "answer": "string",
  "evidence_refs": [
    {
      "doc_id": "string",
      "page": 0,
      "ref": "string",
      "retrieval_score": 0.0
    }
  ],
  "trace_id": "string",
  "model": "string",
  "compliance": {
    "decline_reason": "string | null"
  }
}
```

### 错误响应（4xx/5xx）

```json
{
  "error": "string",
  "code": "string",
  "trace_id": "string | null"
}
```

## 输出格式

### 正常回答（有证据）

```
## 回答
{answer}

## 证据来源
| # | 文档 ID | 页码 | 引用位置 | 相关度 |
|---|---------|------|----------|--------|
| 1 | {doc_id} | {page} | {ref} | {retrieval_score} |

## 追溯信息
- Trace ID: {trace_id}
- 使用模型: {model}
```

### 业务拒答（无证据）

```
## 无法作答
{answer}

**原因**: {compliance.decline_reason}

## 追溯信息
- Trace ID: {trace_id}
- 使用模型: {model}
```

### 错误处理

```
## 请求失败
**错误**: {error}
**错误码**: {code}
**Trace ID**: {trace_id}
```

## 约束

- Skill **仅通过 HTTP** 调用 BFF 接口
- 密钥与基 URL 来自环境配置，**不入库**
- 不实现 CoPaw 内核修改
- 不将密钥写入 Skill 仓库
- 遵守统一约定：API 基路径 `/api/v1`，错误体格式与 Spec §7 一致

## 参考（相对仓库根）

- OpenAPI 契约: `specs/workshop/module-03-knowledge-copaw/openapi/kb-qa-contract.yaml`
- Spec: `specs/workshop/module-03-knowledge-copaw/docs/01-Spec-知识库与问答-CoPaw底座-v0.1.md` §3.4, §5.1
- 任务文档: `specs/workshop/module-03-knowledge-copaw/docs/tasks/T-F.md`
- 统一约定: `specs/workshop/module-03-knowledge-copaw/docs/03-任务地图与Qoder-Quest执行指南.md` §3
