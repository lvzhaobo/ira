import os
from pathlib import Path


def get_data_dir() -> Path:
    root = os.environ.get("IRA_DATA_DIR")
    if root:
        return Path(root)
    return Path(__file__).resolve().parent.parent.parent / "data"
