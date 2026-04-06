from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path
from typing import Any


def _repo_root() -> Path:
    # ira/backend/scripts -> ira(repo root)
    return Path(__file__).resolve().parents[3]


def _ensure_copaw_src_on_path() -> Path:
    src = _repo_root() / "copaw" / "src"
    if not src.exists():
        raise RuntimeError(f"copaw source path not found: {src}")
    src_str = str(src)
    if src_str not in sys.path:
        sys.path.insert(0, src_str)
    return src


def run_smoke() -> dict[str, Any]:
    src = _ensure_copaw_src_on_path()

    version_mod = importlib.import_module("copaw.__version__")
    system_info_mod = importlib.import_module("copaw.utils.system_info")

    version = getattr(version_mod, "__version__", None)
    if not isinstance(version, str) or not version.strip():
        raise RuntimeError("copaw.__version__.__version__ is empty")

    get_system_info = getattr(system_info_mod, "get_system_info", None)
    if get_system_info is None:
        raise RuntimeError("copaw.utils.system_info.get_system_info not found")

    system_info = get_system_info()
    if not isinstance(system_info, dict):
        raise RuntimeError("get_system_info() did not return dict")

    return {
        "ok": True,
        "copaw_src": str(src),
        "copaw_version": version,
        "system_info": system_info,
        "called_components": [
            "copaw.__version__.__version__",
            "copaw.utils.system_info.get_system_info",
        ],
    }


if __name__ == "__main__":
    try:
        result = run_smoke()
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as exc:  # pragma: no cover - cli smoke output
        print(
            json.dumps(
                {"ok": False, "error_type": type(exc).__name__, "error": str(exc)},
                ensure_ascii=False,
                indent=2,
            )
        )
        raise
