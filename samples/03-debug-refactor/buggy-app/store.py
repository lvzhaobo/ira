"""JSON 文件存储层"""

import json
import threading
from pathlib import Path

_lock = threading.Lock()


def read_json(path: Path, default):
    """读取 JSON 文件，不存在时返回默认值。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        return default
    with _lock:
        with open(path, encoding="utf-8") as f:
            return json.load(f)


def write_json(path: Path, data):
    """写入 JSON 文件（原子写入）。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with _lock:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        tmp.replace(path)
