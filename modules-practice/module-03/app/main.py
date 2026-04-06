"""
知识库与研报问答 BFF 服务

对应 01-Spec v0.1 §3 API 契约
- GET /kb/documents
- GET /kb/index/status
- POST /research/qa/upload
- POST /research/qa/ask
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================
# 应用初始化
# ============================================================

app = FastAPI(
    title="知识库与研报问答 BFF",
    description="Workshop 知识库与研报问答系统后端服务",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 路由组（01-Spec §3: API 基路径 /api/v1）
router = APIRouter(prefix="/api/v1")

# ============================================================
# 文件存储配置
# ============================================================

# 上传文件存储目录（相对于 app/ 目录）
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ============================================================
# 数据模型 — 对齐 OpenAPI 契约 (kb-qa-contract.yaml)
# ============================================================

# ---------- 请求模型 ----------

class AskRequest(BaseModel):
    """研报问答请求（01-Spec §3.4）"""
    query: str = Field(..., description="用户提问内容")
    session_id: Optional[str] = Field(None, description="会话标识（可选）")
    spec_version: Optional[str] = Field(None, description="Spec 版本标识（可选）")


# ---------- 响应模型 ----------

class KbDocumentItem(BaseModel):
    """单条知识文档（01-Spec §3.1）"""
    doc_id: str
    title: str
    source_filename: str
    ingested_at: str  # ISO8601
    status: str  # ready | indexing | error
    bytes: int


class KbDocumentsResponse(BaseModel):
    items: list[KbDocumentItem]


class KbIndexStatusResponse(BaseModel):
    index_ver: str
    updated_at: str  # ISO8601
    status: str  # idle | indexing | ready | error


class UploadResponse(BaseModel):
    doc_id: str
    trace_id: str
    message: str


class EvidenceRef(BaseModel):
    """单条证据引用（01-Spec §3.4）"""
    doc_id: str
    page: int
    ref: str
    retrieval_score: float


class ComplianceInfo(BaseModel):
    decline_reason: Optional[str] = Field(
        None,
        description="拒答原因。有证据时为 null；无证据时如 'NO_EVIDENCE'。"
    )


class AskResponse(BaseModel):
    """研报问答响应（01-Spec §3.4）"""
    answer: str
    evidence_refs: list[EvidenceRef]
    trace_id: str
    model: str
    compliance: ComplianceInfo


class ErrorResponse(BaseModel):
    """统一错误响应体（01-Spec §7）"""
    error: str
    code: str
    trace_id: Optional[str] = None


# ============================================================
# 简易元数据存储（Workshop 级，内存存储）
#
# 注意：这是 Workshop 演示级别的简化实现。
# 生产环境应使用持久化存储（如 SQLite/PostgreSQL）。
# ============================================================

# 存储上传的文档元数据
_kb_documents: dict[str, KbDocumentItem] = {}

# 拒答模板常量
DECLINE_ANSWER_TEMPLATE = "抱歉，当前知识库中未找到与您问题相关的可靠证据，无法作答。"

# 使用的模型标识（从环境变量读取，默认为 qwen-max）
MODEL_NAME = os.getenv("MODEL_NAME", "qwen-max")


# ============================================================
# 辅助函数
# ============================================================

def generate_trace_id() -> str:
    """生成追溯标识"""
    return f"tr-{uuid.uuid4().hex[:12]}"


def generate_doc_id() -> str:
    """生成文档唯一标识"""
    return f"doc-{uuid.uuid4().hex[:8]}"


# ============================================================
# API 路由
# ============================================================

# ---------- §3.1 获取知识文档列表 ----------

@app.get("/api/v1/kb/documents", response_model=KbDocumentsResponse)
async def list_kb_documents():
    """获取知识文档列表

    返回已入库的知识文档列表。items 可为空数组。
    对应 01-Spec §3.1。
    """
    return KbDocumentsResponse(items=list(_kb_documents.values()))


# ---------- §3.2 索引/管线状态（演示） ----------

@app.get("/api/v1/kb/index/status", response_model=KbIndexStatusResponse)
async def get_kb_index_status():
    """获取索引/管线状态

    Workshop 演示级别：返回固定示意值。
    对应 01-Spec §3.2。
    """
    return KbIndexStatusResponse(
        index_ver="v1.0",
        updated_at=datetime.now(timezone.utc).isoformat(),
        status="ready",
    )


# ---------- §3.3 上传材料（入库） ----------

@app.post("/api/v1/research/qa/upload", response_model=UploadResponse)
async def upload_research_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
):
    """上传材料（入库）

    上传单个文件至知识库。对应 01-Spec §3.3。
    文件将落盘到 app/uploads/ 目录，元数据保存在内存中。
    """
    # 读取文件内容
    content = await file.read()
    file_size = len(content)

    # 文件大小限制检查（Workshop 级别：限制 50MB）
    max_size = 50 * 1024 * 1024  # 50MB
    if file_size > max_size:
        raise HTTPException(
            status_code=413,
            detail={
                "error": "文件大小超过限制",
                "code": "FILE_TOO_LARGE",
                "trace_id": generate_trace_id(),
            },
        )

    # 文件类型检查
    allowed_types = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail={
                "error": "不支持的文件类型",
                "code": "UNSUPPORTED_FILE_TYPE",
                "trace_id": generate_trace_id(),
            },
        )

    # 生成元数据
    doc_id = generate_doc_id()
    trace_id = generate_trace_id()

    # 落盘文件：保存到 app/uploads/ 目录
    try:
        file_ext = os.path.splitext(file.filename or "")[1] or ".bin"
        file_path = os.path.join(UPLOAD_DIR, f"{doc_id}{file_ext}")
        with open(file_path, "wb") as f:
            f.write(content)
    except IOError as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": f"文件保存失败: {str(e)}",
                "code": "FILE_SAVE_ERROR",
                "trace_id": trace_id,
            },
        )

    doc_item = KbDocumentItem(
        doc_id=doc_id,
        title=title or file.filename or "未命名文档",
        source_filename=file.filename or "unknown",
        ingested_at=datetime.now(timezone.utc).isoformat(),
        status="ready",
        bytes=file_size,
    )

    # 存储元数据
    _kb_documents[doc_id] = doc_item

    return UploadResponse(
        doc_id=doc_id,
        trace_id=trace_id,
        message="上传成功，文档已入库",
    )


# ---------- §3.4 研报问答 ----------

@app.post("/api/v1/research/qa/ask", response_model=AskResponse)
async def ask_research_question(req: AskRequest):
    """研报问答

    提交问题并获取基于知识库的回答。对应 01-Spec §3.4。

    Workshop 级简化策略（须在代码注释中写明）：
    - 本实现不进行真正的向量检索或语义匹配。
    - evidence_refs 组装逻辑：
      * 若知识库中有文档，则返回前 N 个文档作为「证据」（演示目的）。
      * 若知识库为空，则返回空证据列表 + 拒答模板。
    - 生产环境应替换为：向量检索 → 语义排序 → 证据抽取 → LLM 生成回答。
    """
    trace_id = generate_trace_id()

    # ----- 证据检索（Workshop 级简化） -----
    # 简化策略：直接将库中文档作为证据返回（不做真正的检索）
    # 生产环境应使用向量数据库进行相似度检索
    all_docs = list(_kb_documents.values())

    if not all_docs:
        # 无证据：业务拒答，返回 200 + 空证据
        # 注意：不使用 HTTP 4xx，遵循 01-Spec §7
        return AskResponse(
            answer=DECLINE_ANSWER_TEMPLATE,
            evidence_refs=[],
            trace_id=trace_id,
            model=MODEL_NAME,
            compliance=ComplianceInfo(decline_reason="NO_EVIDENCE"),
        )

    # 有文档：Workshop 级简化 - 返回前 3 个文档作为证据
    # 注意：这是演示目的，生产环境应基于检索相关度评分排序
    max_evidence = 3
    evidence_refs = [
        EvidenceRef(
            doc_id=doc.doc_id,
            page=1,  # Workshop 简化：固定页码
            ref="全文",  # Workshop 简化：固定引用位置
            retrieval_score=0.85,  # Workshop 简化：固定评分
        )
        for doc in all_docs[:max_evidence]
    ]

    # 生成回答（Workshop 级简化：基于文档标题生成简单回答）
    doc_titles = [doc.title for doc in all_docs[:max_evidence]]
    answer = f"根据知识库中的 {len(doc_titles)} 份文档（{', '.join(doc_titles)}），" \
             f"我将为您分析相关问题。（Workshop 演示：此为简化回答）"

    return AskResponse(
        answer=answer,
        evidence_refs=evidence_refs,
        trace_id=trace_id,
        model=MODEL_NAME,
        compliance=ComplianceInfo(decline_reason=None),
    )


# ============================================================
# 启动入口
# ============================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
