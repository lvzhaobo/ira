"""
CoPaw Embedded Adapter（源码嵌入原型）

目标：
- 不改现有 HTTP adapter 与路由逻辑；
- 先提供一个“可被接入”的服务层原型，直接调用 CoPaw 源码组件；
- 用于 Workshop 先验证“老项目内嵌新能力”的可行性。
"""

from __future__ import annotations

import importlib
import sys
from pathlib import Path
from typing import Any


def _repo_root() -> Path:
    # ira/backend/app/services -> ira(repo root)
    return Path(__file__).resolve().parents[4]


def _copaw_src_path() -> Path:
    return _repo_root() / "copaw" / "src"


def _ensure_copaw_import_path() -> bool:
    src = _copaw_src_path()
    if not src.exists():
        return False
    src_str = str(src)
    if src_str not in sys.path:
        sys.path.insert(0, src_str)
    return True


def copaw_embedded_ready() -> bool:
    if not _ensure_copaw_import_path():
        return False
    try:
        importlib.import_module("copaw.__version__")
        importlib.import_module("copaw.utils.system_info")
        return True
    except Exception:
        return False


def copaw_embedded_status() -> str:
    return "available" if copaw_embedded_ready() else "unavailable"


def copaw_embedded_probe_or_none() -> dict[str, Any] | None:
    if not _ensure_copaw_import_path():
        return None
    try:
        version_mod = importlib.import_module("copaw.__version__")
        sysinfo_mod = importlib.import_module("copaw.utils.system_info")
    except Exception:
        return None

    version = getattr(version_mod, "__version__", None)
    get_system_info = getattr(sysinfo_mod, "get_system_info", None)
    if not isinstance(version, str) or get_system_info is None:
        return None

    info = get_system_info()
    if not isinstance(info, dict):
        return None

    return {
        "copaw_version": version,
        "system_info": info,
        "source_mode": "embedded",
    }


def copaw_embedded_qa_ask_or_none(
    *,
    session_id: str,
    query: str,
    evidence_block: str,
    spec_ver: str,
    require_risk: bool,
    trace_id: str,
) -> dict[str, Any] | None:
    """
    原型函数：先验证“在 IRA 服务层可直接调用 CoPaw 源码组件”。
    当前阶段不执行 CoPaw 真实 Agent 编排，仅返回可消费结构，便于后续接线。
    """
    probe = copaw_embedded_probe_or_none()
    if probe is None:
        return None

    return {
        "answer": (
            "【CoPaw Embedded Prototype】已在 IRA 进程内加载 CoPaw 源码组件。"
            f" query={query[:120]}"
        ),
        "evidence_refs": [
            {
                "doc_id": "copaw_embedded_probe",
                "ref": "copaw.utils.system_info",
                "page": None,
                "retrieval_score": None,
            }
        ],
        "risk_level": "中" if require_risk else None,
        "model": {
            "model_id": "copaw-embedded-prototype",
            "prompt_version": "ira-embedded-v0",
            "copaw_version": probe["copaw_version"],
        },
        "compliance": {
            "ruleset_version": "rules-v1.0.0",
            "filtered": False,
            "decline_reason": None,
        },
        "meta": {
            "trace_id": trace_id,
            "session_id": session_id,
            "spec_version": spec_ver,
            "has_evidence_block": bool(evidence_block.strip()),
            "system_info": probe["system_info"],
        },
    }
