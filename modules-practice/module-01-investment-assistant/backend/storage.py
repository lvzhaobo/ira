"""
数据存储层 - JSON 文件存储
"""

import json
import os
from datetime import datetime


class Storage:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.sessions_file = os.path.join(data_dir, "sessions.json")
        self.records_file = os.path.join(data_dir, "qa_records.json")

        # 初始化文件
        self._init_file(self.sessions_file, {"sessions": []})
        self._init_file(self.records_file, {"records": []})

    def _init_file(self, filepath, default_data):
        if not os.path.exists(filepath):
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(default_data, f, ensure_ascii=False, indent=2)

    def _read_json(self, filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_json(self, filepath, data):
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # ========== 会话管理 ==========

    def get_sessions(self):
        data = self._read_json(self.sessions_file)
        return data["sessions"]

    def create_session(self, session_id, title="新会话"):
        data = self._read_json(self.sessions_file)
        now = datetime.utcnow().isoformat() + "Z"

        session = {"session_id": session_id, "title": title, "created_at": now, "updated_at": now, "query_count": 0}

        data["sessions"].append(session)
        self._write_json(self.sessions_file, data)
        return session

    def update_session(self, session_id, **kwargs):
        data = self._read_json(self.sessions_file)

        for session in data["sessions"]:
            if session["session_id"] == session_id:
                session.update(kwargs)
                session["updated_at"] = datetime.utcnow().isoformat() + "Z"
                break

        self._write_json(self.sessions_file, data)

    def delete_session(self, session_id):
        data = self._read_json(self.sessions_file)
        data["sessions"] = [s for s in data["sessions"] if s["session_id"] != session_id]
        self._write_json(self.sessions_file, data)

        # 同时删除该会话的问答记录
        self.delete_records_by_session(session_id)

    # ========== 问答记录管理 ==========

    def get_records_by_session(self, session_id):
        data = self._read_json(self.records_file)
        return [r for r in data["records"] if r["session_id"] == session_id]

    def add_record(self, session_id, query, answer, llm_used, model, response_time_ms, answer_source=None):
        data = self._read_json(self.records_file)

        record = {
            "id": f"rec_{datetime.utcnow().timestamp()}",
            "session_id": session_id,
            "query": query,
            "answer": answer,
            "llm_used": llm_used,
            "model": model,
            "response_time_ms": response_time_ms,
            "answer_source": answer_source,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        data["records"].append(record)
        self._write_json(self.records_file, data)

        # 更新会话的 query_count 和 title
        sessions_data = self._read_json(self.sessions_file)
        for session in sessions_data["sessions"]:
            if session["session_id"] == session_id:
                session["query_count"] += 1
                if session["query_count"] == 1:
                    # 首次提问，自动命名（前 20 字）
                    session["title"] = query[:20] + ("..." if len(query) > 20 else "")
                session["updated_at"] = datetime.utcnow().isoformat() + "Z"
                break

        self._write_json(self.sessions_file, sessions_data)

        return record

    def delete_records_by_session(self, session_id):
        data = self._read_json(self.records_file)
        data["records"] = [r for r in data["records"] if r["session_id"] != session_id]
        self._write_json(self.records_file, data)
