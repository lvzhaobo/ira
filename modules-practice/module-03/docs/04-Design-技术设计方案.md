# 技术设计方案

> **版本**: v1.0  
> **日期**: 2026-04-04  
> **关联 Spec**: `01-Spec-知识库与问答-CoPaw底座-v0.1.md`  
> **目标读者**: 开发工程师、架构师

---

## 1. 架构概览

### 1.1 系统架构图

```
┌──────────────────────────────────────────┐
│           CoPaw (Agent 平台)              │
│  ┌─────────────┐    ┌─────────────────┐  │
│  │   Chat UI   │    │  Workflow(可选) │  │
│  └──────┬──────┘    └────────┬────────┘  │
│         │                    │            │
│         ▼                    ▼            │
│  ┌─────────────────────────────────────┐  │
│  │  Skill: ira_research_ask            │  │
│  │  - 调用 BFF API                     │  │
│  │  - 格式化展示结果                    │  │
│  └──────────────┬──────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │ HTTPS
                  ▼
┌──────────────────────────────────────────┐
│         BFF (FastAPI 后端服务)            │
│  ┌─────────────────────────────────────┐  │
│  │  API Routes                         │  │
│  │  - GET  /kb/documents               │  │
│  │  - GET  /kb/index/status            │  │
│  │  - POST /research/qa/upload         │  │
│  │  - POST /research/qa/ask            │  │
│  └──────────────┬──────────────────────┘  │
│                 │                          │
│  ┌──────────────▼──────────────────────┐  │
│  │  Business Logic                     │  │
│  │  - 文件上传验证                      │  │
│  │  - 元数据管理                        │  │
│  │  - 证据检索(简化)                    │  │
│  │  - 合规控制                          │  │
│  └──────────────┬──────────────────────┘  │
│                 │                          │
│  ┌──────────────▼──────────────────────┐  │
│  │  Data Storage                       │  │
│  │  - 内存存储(Workshop 简化)           │  │
│  │  - 文件系统(uploads/)                │  │
│  └─────────────────────────────────────┘  │
└──────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│      Frontend (HTML + Bootstrap 5)       │
│  - 文档列表展示                           │
│  - 文件上传表单                           │
│  - 问答交互界面                           │
│  - 证据引用展示                           │
└──────────────────────────────────────────┘
```

### 1.2 技术选型决策

| 组件 | 选择 | 理由 | 替代方案 |
|------|------|------|---------|
| **后端框架** | FastAPI | 异步支持、自动生成 OpenAPI、Pydantic 集成 | Flask, Django |
| **前端技术** | HTML + Bootstrap 5 | 零构建、快速原型、降低学习曲线 | React, Vue |
| **数据存储** | 内存 dict | Workshop 简化、无需配置 | SQLite, PostgreSQL |
| **文件存储** | 本地文件系统 | 简单直接 | S3, OSS |
| **API 契约** | OpenAPI 3.0 | 行业标准、工具生态丰富 | Swagger 2.0, GraphQL |

---

## 2. 模块设计

### 2.1 BFF 模块划分

```
app/
├── main.py              # 应用入口、路由注册
├── models.py            # Pydantic 数据模型
├── services/            # 业务逻辑层(可选,当前合并到 main.py)
├── repositories/        # 数据访问层(可选,当前合并到 main.py)
└── uploads/             # 上传文件存储目录
```

**设计说明:**
- 当前采用**简化架构**,所有逻辑在 `main.py`
- 生产环境应拆分为 `services/` 和 `repositories/`
- 见 ADR-001

### 2.2 数据流设计

#### 上传流程
```
用户选择文件
    ↓
前端 FormData 封装
    ↓
POST /research/qa/upload
    ↓
BFF 验证(大小、类型)
    ↓
保存到 app/uploads/{doc_id}.{ext}
    ↓
生成元数据(doc_id, title, status=ready)
    ↓
存入内存存储 _kb_documents
    ↓
返回 {doc_id, trace_id, message}
```

#### 问答流程
```
用户输入问题
    ↓
前端 JSON 封装
    ↓
POST /research/qa/ask
    ↓
BFF 检查知识库是否有文档
    ↓
[有文档] → 返回前3个作为证据 + 生成回答
[无文档] → 返回空证据 + 拒答模板
    ↓
返回 {answer, evidence_refs, trace_id, model, compliance}
```

---

## 3. 关键设计决策 (ADR)

### ADR-001: 简化架构 vs 分层架构

**状态**: Accepted  
**日期**: 2026-04-04

**背景:**
- Workshop 目标是演示 API 契约驱动开发
- 时间有限,需要快速实现
- 目标学员包含大量后端工程师

**决策:**
采用**扁平架构**,所有逻辑在 `main.py`,不拆分 services/repositories。

**理由:**
1. 减少文件数量,降低理解成本
2. 聚焦 API 契约,而非架构模式
3. Workshop 级别无需复杂分层

**后果:**
- ✅ 优点: 快速实现,代码集中
- ❌ 缺点: 不符合大型项目最佳实践
- 🔄 迁移路径: 生产环境应拆分为 services/repositories

**生产环境改进:**
```python
# 当前(简化)
@app.post("/research/qa/ask")
async def ask_question(req: AskRequest):
    # 所有逻辑在这里...
    pass

# 生产环境(分层)
@app.post("/research/qa/ask")
async def ask_question(req: AskRequest):
    return await qa_service.ask(req)

# services/qa_service.py
async def ask(req: AskRequest):
    docs = await kb_repo.list_documents()
    evidence = await retriever.search(req.query, docs)
    answer = await llm.generate(req.query, evidence)
    return AskResponse(...)
```

---

### ADR-002: 内存存储 vs 持久化存储

**状态**: Accepted  
**日期**: 2026-04-04

**背景:**
- 需要存储文档元数据
- Workshop 环境重启频繁

**决策:**
使用**内存 dict** 存储元数据,重启后数据丢失。

**理由:**
1. 零配置,无需数据库
2. 快速原型验证
3. 符合 Workshop 演示场景

**后果:**
- ✅ 优点: 简单、快速
- ❌ 缺点: 重启后数据丢失,无法持久化
- 🔄 迁移路径: 生产环境使用 SQLite/PostgreSQL

**生产环境改进:**
```python
# 当前(内存)
_kb_documents: dict[str, KbDocumentItem] = {}

# 生产环境(SQLite)
import sqlite3

class KBRepository:
    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self._init_db()
    
    def save_document(self, doc: KbDocumentItem):
        self.conn.execute(
            "INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?)",
            (doc.doc_id, doc.title, ...)
        )
        self.conn.commit()
```

---

### ADR-003: 证据检索简化策略

**状态**: Accepted  
**日期**: 2026-04-04

**背景:**
- 真正的向量检索需要嵌入模型、向量数据库
- Workshop 重点是 API 契约,不是检索算法

**决策:**
**有文档时返回前3个作为证据**,不做真正的语义匹配。

**理由:**
1. 演示 evidence_refs 结构
2. 避免引入复杂依赖
3. 聚焦 API 契约验证

**后果:**
- ✅ 优点: 简单、可预测
- ❌ 缺点: 无实际检索能力,相关度固定
- 🔄 迁移路径: 生产环境使用向量检索

**生产环境改进:**
```python
# 当前(简化)
evidence_refs = [
    EvidenceRef(doc_id=doc.doc_id, page=1, ref="全文", retrieval_score=0.85)
    for doc in all_docs[:3]
]

# 生产环境(向量检索)
from sentence_transformers import SentenceTransformer
import faiss

model = SentenceTransformer('all-MiniLM-L6-v2')
index = faiss.IndexFlatL2(384)

async def search_evidence(query: str, top_k: int = 3):
    query_embedding = model.encode([query])
    distances, indices = index.search(query_embedding, top_k)
    
    evidence_refs = []
    for idx, score in zip(indices[0], distances[0]):
        doc = all_docs[idx]
        evidence_refs.append(EvidenceRef(
            doc_id=doc.doc_id,
            page=extract_page(doc),
            ref=extract_ref(doc),
            retrieval_score=1.0 / (1.0 + score)
        ))
    return evidence_refs
```

---

### ADR-004: 前端技术选型

**状态**: Accepted  
**日期**: 2026-04-04

**背景:**
- 需要前端界面验证 API
- 目标学员包含后端工程师

**决策:**
使用**原生 HTML + Bootstrap 5 CDN**,不使用 React/Vue。

**理由:**
1. 零构建步骤,直接打开 HTML
2. 无需 Node.js/npm 环境
3. 聚焦后端 API,前端仅作为验证工具

**后果:**
- ✅ 优点: 简单、快速、易理解
- ❌ 缺点: 无法展示现代前端工程实践
- 🔄 迁移路径: 提供 React 版本作为进阶示例

**参见:** [`docs/standards/frontend-coding.md`](standards/frontend-coding.md)

---

## 4. 数据模型设计

### 4.1 核心实体

```python
# 知识文档
KbDocumentItem {
    doc_id: str          # 唯一标识,格式: doc-{8位hex}
    title: str           # 文档标题
    source_filename: str # 原始文件名
    ingested_at: str     # ISO8601 时间
    status: str          # ready | indexing | error
    bytes: int           # 文件大小
}

# 证据引用
EvidenceRef {
    doc_id: str          # 引用文档ID
    page: int            # 页码
    ref: str             # 引用位置描述
    retrieval_score: float # 相关度评分 0-1
}

# 合规信息
ComplianceInfo {
    decline_reason: str | null # 拒答原因,有证据时为null
}
```

### 4.2 存储结构

**内存存储:**
```python
_kb_documents: dict[str, KbDocumentItem] = {
    "doc-710f6867": KbDocumentItem(...),
    "doc-efae5c8e": KbDocumentItem(...),
}
```

**文件存储:**
```
app/uploads/
├── doc-710f6867.pdf
├── doc-efae5c8e.txt
└── ...
```

---

## 5. API 设计要点

### 5.1 统一错误处理

**非业务错误**(4xx/5xx):
```json
{
  "error": "人类可读的描述",
  "code": "MACHINE_READABLE_CODE",
  "trace_id": "tr-abc123"
}
```

**业务拒答**(仍为 200):
```json
{
  "answer": "抱歉,未找到相关证据...",
  "evidence_refs": [],
  "compliance": {
    "decline_reason": "NO_EVIDENCE"
  }
}
```

**设计理由:** 业务拒答是正常逻辑,不是错误。

### 5.2 Trace ID 追踪

**生成规则:** `tr-{12位hex}`

**用途:**
- 关联请求日志
- 调试问题
- 审计追踪

**示例:**
```
Upload:  tr-a1b2c3d4e5f6
Ask:     tr-ba87b7359810
```

---

## 6. 安全设计

### 6.1 输入验证

**文件上传:**
- 大小限制: 50MB
- 类型白名单: PDF, TXT, MD, DOC, DOCX
- 文件名清理: 防止路径遍历

**问答输入:**
- query 长度限制: 1-1000 字符
- XSS 防护: 前端转义输出

### 6.2 CORS 配置

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Workshop 允许所有
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**生产环境:** 应指定具体域名

### 6.3 敏感信息保护

- ❌ 不在响应中返回密钥
- ❌ 不在日志中记录完整 Token
- ✅ 使用环境变量管理配置

---

## 7. 扩展性设计

### 7.1 从 Workshop 到生产的演进路径

| 组件 | Workshop | 生产环境 |
|------|----------|---------|
| **存储** | 内存 dict | PostgreSQL + Redis |
| **检索** | 返回前3个文档 | 向量检索 + Rerank |
| **LLM** | 模板生成 | 真实 LLM 调用 |
| **认证** | 无 | OAuth2 + JWT |
| **限流** | 无 | Redis + Sliding Window |
| **监控** | 控制台日志 | Prometheus + Grafana |
| **部署** | 本地运行 | Docker + K8s |

### 7.2 接口兼容性保证

**破坏性变更:**
- 修改必填字段
- 删除字段
- 改变字段类型

**非破坏性变更:**
- 新增可选字段
- 新增枚举值
- 新增 API 路径

**策略:** 通过版本号(`/api/v1`, `/api/v2`)管理

---

## 8. 性能考虑

### 8.1 当前性能特征

| 操作 | 预期耗时 | 瓶颈 |
|------|---------|------|
| 上传文件(<10MB) | <1s | 磁盘 I/O |
| 获取文档列表 | <10ms | 内存读取 |
| 问答(有文档) | <50ms | 无 |
| 问答(无文档) | <10ms | 无 |

### 8.2 优化建议(生产环境)

1. **缓存**: Redis 缓存文档列表
2. **异步**: 大文件异步处理
3. **分页**: 文档列表支持分页
4. **索引**: 数据库添加索引

---

## 9. 测试策略

### 9.1 测试金字塔

```
       /\
      /  \  E2E Tests (Playwright)
     /----\
    /      \ Integration Tests (pytest)
   /--------\
  /          \ Unit Tests (pytest)
 /------------\
```

### 9.2 关键测试场景

**单元测试:**
- Pydantic 模型验证
- trace_id 生成
- 文件类型检查

**集成测试:**
- API 端点测试
- 上传→列表→问答完整流程
- 错误处理

**E2E 测试:**
- 前端页面交互
- 跨浏览器兼容

---

## 10. 部署架构

### 10.1 Workshop 部署

```
Developer Machine
├── Backend: python main.py (localhost:8000)
├── Frontend: python -m http.server (localhost:3000)
└── Browser: http://localhost:3000
```

### 10.2 生产部署(参考)

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (Reverse   │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐      ┌────────▼────────┐
     │  BFF Instance 1 │      │  BFF Instance 2 │
     │  (Docker)       │      │  (Docker)       │
     └────────┬────────┘      └────────┬────────┘
              │                         │
              └────────────┬────────────┘
                           │
                  ┌────────▼────────┐
                  │   PostgreSQL    │
                  │   (Primary)     │
                  └─────────────────┘
```

---

## 11. 监控与可观测性

### 11.1 日志规范

**结构化日志:**
```python
logger.info({
    "event": "document_uploaded",
    "doc_id": doc_id,
    "size": file_size,
    "trace_id": trace_id,
    "timestamp": datetime.utcnow().isoformat()
})
```

### 11.2 关键指标

- API 响应时间(P95, P99)
- 错误率(4xx, 5xx)
- 上传成功率
- 问答成功率

---

## 12. 附录

### 12.1 术语表

| 术语 | 定义 |
|------|------|
| BFF | Backend For Frontend,面向前端的后端服务 |
| CoPaw | Agent 编排平台 |
| evidence_refs | 证据引用列表,指向支撑回答的文档 |
| trace_id | 请求追踪标识,用于调试和审计 |
| compliance | 合规信息,包含拒答原因 |

### 12.2 参考文档

- [01-Spec](01-Spec-知识库与问答-CoPaw底座-v0.1.md) - API 行为契约
- [OpenAPI Contract](../openapi/kb-qa-contract.yaml) - 技术契约
- [API Design Standards](standards/api-design.md) - API 设计规范
- [Backend Coding Standards](standards/backend-coding.md) - 后端编码规范
- [Frontend Coding Standards](standards/frontend-coding.md) - 前端编码规范

### 12.3 变更历史

| 版本 | 日期 | 作者 | 说明 |
|------|------|------|------|
| v1.0 | 2026-04-04 | System | 初始版本,包含完整技术设计 |
