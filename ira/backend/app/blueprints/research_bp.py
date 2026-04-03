import os
from datetime import datetime, timezone
from pathlib import Path

from app.blueprints.lineage_bp import append_trace_record
from app.errors import error_response
from app.json_store import read_json, write_json
from app.services.bailian_qa import bailian_config, chat_research_qa, is_bailian_enabled
from app.services.copaw_qa_adapter import copaw_qa_ask_or_none
from app.services.multi_agent_service import run_multi_agent
from app.trace_util import new_trace_id
from flask import Blueprint, current_app, g, jsonify, request

bp = Blueprint("research", __name__)


def _data(name: str):
    return Path(current_app.config["DATA_DIR"]) / name


def _now():
    return datetime.now(timezone.utc).isoformat()


def _kb_evidence_refs_and_block() -> tuple[list, str]:
    """基于知识库元数据构造 evidence_refs 与写入系统提示的摘要块（与机构侧「先入库再引用」一致）。"""
    meta = read_json(_data("kb_documents.json"), {"items": []})
    items = meta.get("items", [])[:8]
    refs: list = []
    lines: list[str] = []
    for i, it in enumerate(items):
        did = it.get("doc_id") or f"doc_{i}"
        fn = it.get("filename") or did
        refs.append(
            {
                "doc_id": did,
                "ref": fn,
                "page": None,
                "retrieval_score": round(0.85 - i * 0.03, 2),
            }
        )
        lines.append(f"- {fn}（{did}）")
    if not refs:
        refs.append(
            {
                "doc_id": "ira_kb_placeholder",
                "ref": "internal_framework",
                "page": None,
                "retrieval_score": None,
            }
        )
    block = "\n".join(lines) if lines else ""
    return refs, block


@bp.route("/research/qa/ask", methods=["POST"])
def research_qa_ask():
    body = request.get_json(force=True, silent=True) or {}
    spec_ver = request.headers.get("X-Spec-Version", "")
    if spec_ver and spec_ver not in ("ira-1.0.0", "ira-1.1.0"):
        return error_response("SPEC_VERSION_UNSUPPORTED", f"Unknown version {spec_ver}", 400)
    effective_spec_ver = spec_ver or "ira-1.0.0"

    session_id = body.get("session_id", "")
    query = body.get("query", "")
    require_risk = bool(body.get("require_risk_label"))

    if spec_ver == "ira-1.1.0" and require_risk is False:
        require_risk = True

    tid = g.trace_id
    evidence_refs, evidence_block = _kb_evidence_refs_and_block()

    answer = ""
    copaw_meta: dict | None = None
    model_meta = {"model_id": "demo-llm", "prompt_version": "ira-v1.3.0", "temperature": 0.2}
    use_live = is_bailian_enabled()

    if "不存在" in query or "材料没有" in query:
        evidence_refs = []
        answer = "材料未覆盖该问题，系统不予编造结论（演示拒答）。"
    else:
        # CoPaw-first（可选）：未配置 CoPaw 时返回 None，回退到现有 bailian/mock 逻辑。
        copaw_meta = copaw_qa_ask_or_none(
            session_id=session_id,
            query=query,
            evidence_block=evidence_block,
            spec_ver=effective_spec_ver,
            require_risk=require_risk,
            trace_id=tid,
        )
        if copaw_meta and copaw_meta.get("answer"):
            answer = str(copaw_meta.get("answer") or "")
            ev = copaw_meta.get("evidence_refs", evidence_refs)
            if isinstance(ev, list):
                evidence_refs = ev
            model_from_copaw = copaw_meta.get("model")
            if isinstance(model_from_copaw, dict) and model_from_copaw:
                model_meta = model_from_copaw
        elif use_live:
            ans, err, usage_wrap = chat_research_qa(query, evidence_block)
            if err:
                return error_response(
                    "UPSTREAM_LLM_ERROR",
                    f"百炼模型调用失败：{err}",
                    502,
                )
            answer = ans or ""
            cfg = bailian_config()
            model_meta = {
                "model_id": cfg["model"],
                "prompt_version": "ira-bailian-openai-compatible",
                "temperature": float(os.environ.get("IRA_BAILIAN_TEMPERATURE", "0.2")),
            }
            if usage_wrap.get("raw_usage"):
                model_meta["usage"] = usage_wrap["raw_usage"]

    if not answer:
        answer = (
            "【离线演示】未配置 DASHSCOPE_API_KEY。以下为占位回复，配置百炼后可调用真实模型。\n"
            f"问题摘要：{query[:200]}"
        )

    default_compliance = {
        "ruleset_version": "rules-v1.0.0",
        "filtered": False,
        "decline_reason": "NO_EVIDENCE" if not evidence_refs and "材料" in answer else None,
    }
    compliance = default_compliance
    if isinstance(copaw_meta, dict) and isinstance(copaw_meta.get("compliance"), dict):
        compliance = {**default_compliance, **copaw_meta["compliance"]}

    resp = {
        "trace_id": tid,
        "answer": answer,
        "evidence_refs": evidence_refs,
        "model": model_meta,
        "compliance": compliance,
        "spec_version": "ira-1.1.0" if spec_ver == "ira-1.1.0" else "ira-1.0.0",
    }
    if spec_ver == "ira-1.1.0" or require_risk:
        resp["risk_level"] = (copaw_meta.get("risk_level") if isinstance(copaw_meta, dict) else None) or "中"
        resp["involves_single_stock"] = "600519" in query or "茅台" in query

    append_trace_record(
        {
            "trace_id": tid,
            "artifact_type": "qa_answer",
            "session_id": session_id,
            "summary": query[:80],
            "evidence_refs": evidence_refs,
            "model": resp["model"],
            "compliance": resp["compliance"],
            "created_at": _now(),
        }
    )
    return jsonify(resp)


@bp.route("/research/qa/upload", methods=["POST"])
def research_qa_upload():
    f = request.files.get("file")
    if not f or not f.filename:
        return error_response("VALIDATION_ERROR", "file required", 422)
    dest_dir = Path(current_app.config["DATA_DIR"]) / "uploads"
    dest_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f.filename.replace("..", "_")
    path = dest_dir / safe_name
    f.save(path)
    doc_id = new_trace_id("doc")
    tid = new_trace_id("up")
    meta = read_json(_data("kb_documents.json"), {"items": []})
    meta["items"].insert(
        0,
        {
            "doc_id": doc_id,
            "filename": safe_name,
            "stored_path": str(path),
            "status": "stored",
        },
    )
    write_json(_data("kb_documents.json"), meta)
    return jsonify(
        {
            "doc_id": doc_id,
            "filename": safe_name,
            "session_id": request.form.get("session_id"),
            "stored_path": str(path),
            "trace_id": tid,
        }
    )


@bp.route("/research/stock/analysis", methods=["POST"])
def research_stock_analysis():
    body = request.get_json(force=True, silent=True) or {}
    symbol = body.get("symbol", "")
    mock = bool(body.get("mock", True))
    tid = g.trace_id
    content = (
        f"【模拟草稿】{symbol} · as_of {_now()}\n\n"
        "## 摘要\n示例段落；实际由行情与研报摘要拼接。\n\n"
        "## 结论（演示）\n"
        "内部流程：评级与目标价以研究所正式发布稿为准；本稿仅 Workshop 占位，用于 trace 与合规演练。\n\n"
        "**免责声明**：本输出为辅助草稿，不构成投资建议。"
    )
    resp = {
        "trace_id": tid,
        "artifact_type": "stock_draft",
        "content_format": "markdown",
        "content": content,
        "as_of": _now(),
        "sources": [
            {"source_id": "wind", "name": "Wind", "as_of": _now(), "mock": mock},
        ],
        "tool_trace": [{"tool": "wind.get_quote", "mock": mock, "as_of": _now()}],
        "disclaimer_applied": True,
    }
    append_trace_record(
        {
            "trace_id": tid,
            "artifact_type": "stock_draft",
            "session_id": None,
            "summary": f"{symbol} 分析草稿",
            "tool_trace": resp["tool_trace"],
            "model": {"model_id": "demo-llm", "prompt_version": "ira-stock-v1", "temperature": 0.1},
            "compliance": {"ruleset_version": "rules-v1.0.0", "filtered": False, "decline_reason": None},
            "created_at": _now(),
        }
    )
    return jsonify(resp)


@bp.route("/research/stock/quote", methods=["GET"])
def research_stock_quote():
    symbol = request.args.get("symbol", "")
    mock = request.args.get("mock", "false").lower() == "true"
    if mock:
        return jsonify({"symbol": symbol, "last": 1688.0, "pe_ttm": 28.1, "mock": True})
    return jsonify({"symbol": symbol, "last": None, "pe_ttm": None, "mock": False})


@bp.route("/research/stock/multi-agent/run", methods=["POST"])
def research_stock_multi_agent_run():
    body = request.get_json(force=True, silent=True) or {}
    symbol = body.get("symbol", "600519.SH")
    mock = bool(body.get("mock", True))
    out = run_multi_agent(symbol, mock=mock)
    tid = g.trace_id
    runs = read_json(_data("multi_agent_runs.json"), {"runs": []})
    runs["runs"].insert(0, {"trace_id": tid, "symbol": symbol, "result": out})
    write_json(_data("multi_agent_runs.json"), runs)
    append_trace_record(
        {
            "trace_id": tid,
            "artifact_type": "multi_agent",
            "parent_trace_id": out["orchestration_trace"],
            "summary": f"{symbol} multi-agent",
            "created_at": _now(),
        }
    )
    out["trace_id"] = tid
    return jsonify(out)
