# 后端开发规范

> **版本**: v1.0  
> **技术栈**: Python 3.10+, FastAPI, Pydantic  
> **适用范围**: 本项目所有后端代码

---

## 1. 项目结构

```
app/
├── __init__.py
├── main.py              # 应用入口,路由注册
├── models.py            # Pydantic 数据模型
├── services/            # 业务逻辑层
│   ├── __init__.py
│   └── kb_service.py
├── repositories/        # 数据访问层(可选)
│   └── kb_repo.py
├── utils/               # 工具函数
│   └── helpers.py
└── uploads/             # 上传文件存储(运行时生成)
```

---

## 2. 代码风格

### 2.1 命名规范
```python
# ✅ 正确
def upload_document():
    pass

class KbDocumentItem(BaseModel):
    doc_id: str

UPLOAD_DIR = "./uploads"

# ❌ 错误
def uploadDoc():
    pass

class KB_Document_Item(BaseModel):
    DocId: str
```

**规则:**
- 函数/变量: `snake_case`
- 类名: `PascalCase`
- 常量: `UPPER_CASE`
- 私有成员: `_leading_underscore`

### 2.2 导入顺序
```python
# 1. 标准库
import os
import uuid
from typing import Optional

# 2. 第三方库
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 3. 本地模块
from app.models import AskRequest
from app.services import kb_service
```

### 2.3 代码格式
- 使用 4 空格缩进
- 每行不超过 100 字符
- 函数之间空 2 行
- 类方法之间空 1 行

---

## 3. FastAPI 最佳实践

### 3.1 路由组织
```python
# ✅ 推荐: 使用 APIRouter 分组
router = APIRouter(prefix="/api/v1")

@router.get("/kb/documents")
async def list_documents():
    pass

@router.post("/research/qa/ask")
async def ask_question(req: AskRequest):
    pass

app.include_router(router)

# ❌ 避免: 所有路由写在 main.py
@app.get("/kb/documents")
@app.post("/research/qa/ask")
```

### 3.2 依赖注入
```python
# ✅ 使用依赖注入
async def get_db():
    db = Database()
    try:
        yield db
    finally:
        db.close()

@router.get("/documents")
async def list_docs(db = Depends(get_db)):
    return db.query_all()
```

### 3.3 异常处理
```python
# ✅ 使用 HTTPException
if not file:
    raise HTTPException(
        status_code=400,
        detail={
            "error": "文件不能为空",
            "code": "EMPTY_FILE",
            "trace_id": generate_trace_id()
        }
    )

# ✅ 全局异常处理器
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": str(exc), "code": "INVALID_INPUT"}
    )
```

### 3.4 响应模型
```python
# ✅ 明确定义响应模型
@router.post("/ask", response_model=AskResponse)
async def ask_question(req: AskRequest):
    return AskResponse(
        answer="...",
        evidence_refs=[],
        trace_id="tr-123",
        model="qwen-max",
        compliance=ComplianceInfo(decline_reason=None)
    )

# ❌ 避免返回 dict
@router.post("/ask")
async def ask_question(req: AskRequest):
    return {"answer": "..."}  # 缺少类型安全
```

---

## 4. 数据验证

### 4.1 Pydantic 模型
```python
from pydantic import BaseModel, Field, validator

class AskRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="用户问题")
    session_id: Optional[str] = Field(None, description="会话ID")
    
    @validator('query')
    def validate_query(cls, v):
        if not v.strip():
            raise ValueError('问题不能为空')
        return v.strip()
```

### 4.2 文件上传验证
```python
ALLOWED_TYPES = {"application/pdf", "text/plain"}
MAX_SIZE = 50 * 1024 * 1024  # 50MB

async def validate_upload(file: UploadFile):
    # 检查文件大小
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="文件过大")
    
    # 检查文件类型
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="不支持的文件类型")
    
    await file.seek(0)  # 重置指针
    return content
```

---

## 5. 错误处理

### 5.1 统一错误响应
```python
from typing import Optional

class ErrorResponse(BaseModel):
    error: str
    code: str
    trace_id: Optional[str] = None

def create_error_response(error: str, code: str, status_code: int, trace_id: str = None):
    raise HTTPException(
        status_code=status_code,
        detail=ErrorResponse(
            error=error,
            code=code,
            trace_id=trace_id or generate_trace_id()
        ).dict()
    )
```

### 5.2 Trace ID 生成
```python
import uuid

def generate_trace_id() -> str:
    """生成追溯标识,格式: tr-{12位hex}"""
    return f"tr-{uuid.uuid4().hex[:12]}"
```

---

## 6. 日志规范

### 6.1 日志级别
```python
import logging

logger = logging.getLogger(__name__)

# DEBUG: 详细调试信息
logger.debug(f"Processing document: {doc_id}")

# INFO: 关键业务流程
logger.info(f"Document uploaded: {doc_id}, size: {size}")

# WARNING: 潜在问题
logger.warning(f"File type not standard: {content_type}")

# ERROR: 错误但可恢复
logger.error(f"Failed to process document: {doc_id}", exc_info=True)

# CRITICAL: 严重错误,系统可能不可用
logger.critical("Database connection lost", exc_info=True)
```

### 6.2 日志内容
```python
# ✅ 包含关键上下文
logger.info(f"Upload success: doc_id={doc_id}, size={size}, trace_id={trace_id}")

# ❌ 避免记录敏感信息
logger.info(f"User token: {token}")  # 禁止!
```

---

## 7. 配置管理

### 7.1 环境变量
```python
import os
from dotenv import load_dotenv

load_dotenv()

# ✅ 从环境变量读取
PORT = int(os.getenv("PORT", "8000"))
MODEL_NAME = os.getenv("MODEL_NAME", "qwen-max")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# ❌ 硬编码
PORT = 8000
MODEL_NAME = "qwen-max"
```

### 7.2 配置文件
```python
# config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    port: int = 8000
    model_name: str = "qwen-max"
    upload_dir: str = "./uploads"
    max_file_size: int = 50 * 1024 * 1024
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 8. 测试规范

### 8.1 单元测试
```python
# tests/test_models.py
import pytest
from app.models import AskRequest

def test_ask_request_valid():
    req = AskRequest(query="测试问题")
    assert req.query == "测试问题"

def test_ask_request_empty_query():
    with pytest.raises(ValueError):
        AskRequest(query="")
```

### 8.2 集成测试
```python
# tests/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_documents():
    response = client.get("/api/v1/kb/documents")
    assert response.status_code == 200
    assert "items" in response.json()
```

---

## 9. 性能优化

### 9.1 异步处理
```python
# ✅ 使用 async/await
@router.post("/upload")
async def upload_file(file: UploadFile):
    content = await file.read()  # 异步读取
    # 处理文件...

# ❌ 阻塞操作
@router.post("/upload")
def upload_file(file: UploadFile):
    content = file.read()  # 同步,会阻塞
```

### 9.2 数据库查询优化
```python
# ✅ 只查询需要的字段
docs = db.query(Document.doc_id, Document.title).all()

# ❌ 查询所有字段
docs = db.query(Document).all()
```

---

## 10. 安全规范

### 10.1 CORS 配置
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 10.2 输入清理
```python
import html

def sanitize_input(text: str) -> str:
    """防止 XSS 攻击"""
    return html.escape(text)
```

---

## 11. 文档规范

### 11.1 函数文档
```python
async def upload_document(file: UploadFile, title: str = None) -> UploadResponse:
    """
    上传文档到知识库
    
    Args:
        file: 上传的文件对象
        title: 文档标题(可选,默认使用文件名)
    
    Returns:
        UploadResponse: 包含 doc_id 和 trace_id
    
    Raises:
        HTTPException: 文件过大或类型不支持
    """
    pass
```

### 11.2 代码注释
```python
# Workshop 级简化: 直接返回前3个文档作为证据
# 生产环境应使用向量检索 + 语义排序
evidence_refs = [
    EvidenceRef(doc_id=doc.doc_id, page=1, ref="全文", retrieval_score=0.85)
    for doc in all_docs[:3]
]
```

---

## 12. 检查清单

提交代码前自查:

- [ ] 遵循命名规范
- [ ] 所有公共函数有文档字符串
- [ ] 使用类型注解
- [ ] 异常处理完整
- [ ] 日志记录适当
- [ ] 无硬编码配置
- [ ] 敏感信息未泄露
- [ ] 输入已验证
- [ ] 通过单元测试
- [ ] OpenAPI 文档更新
