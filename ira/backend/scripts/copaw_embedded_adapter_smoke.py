from __future__ import annotations

import json

from app.services.copaw_embedded_adapter import (
    copaw_embedded_qa_ask_or_none,
    copaw_embedded_status,
)


def main() -> None:
    status = copaw_embedded_status()
    out = copaw_embedded_qa_ask_or_none(
        session_id="smoke-session",
        query="请给出白酒行业观点（smoke）",
        evidence_block="",
        spec_ver="ira-1.1.0",
        require_risk=True,
        trace_id="tr_smoke_embedded",
    )
    print(
        json.dumps(
            {
                "embedded_status": status,
                "qa_result": out,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
