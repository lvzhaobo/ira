"""SQLite 连接与表初始化（Sample 用；生产可换 PostgreSQL）。"""
import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone

from flask import current_app, g


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def generate_uuid():
    return str(uuid.uuid4())


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
    return g.db


def init_db(app):
    db = sqlite3.connect(app.config["DATABASE"])
    db.row_factory = sqlite3.Row
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS notify_channel_configs (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            label TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            secret_ref TEXT,
            config TEXT,
            last_test_at TEXT,
            last_test_status TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notify_message_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            channel_type TEXT NOT NULL,
            subject TEXT,
            body_markdown TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notify_rules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            trigger_type TEXT NOT NULL DEFAULT 'manual',
            schedule_cron TEXT,
            condition TEXT,
            template_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (template_id) REFERENCES notify_message_templates(id)
        );

        CREATE TABLE IF NOT EXISTS notify_rule_channels (
            rule_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            PRIMARY KEY (rule_id, channel_id),
            FOREIGN KEY (rule_id) REFERENCES notify_rules(id),
            FOREIGN KEY (channel_id) REFERENCES notify_channel_configs(id)
        );

        CREATE TABLE IF NOT EXISTS notify_deliveries (
            id TEXT PRIMARY KEY,
            rule_id TEXT,
            channel_id TEXT NOT NULL,
            status TEXT NOT NULL,
            dry_run INTEGER NOT NULL,
            payload_preview TEXT,
            payload_hash TEXT,
            error_code TEXT,
            trace_id TEXT NOT NULL,
            source_ref TEXT,
            compliance_scan_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (rule_id) REFERENCES notify_rules(id),
            FOREIGN KEY (channel_id) REFERENCES notify_channel_configs(id)
        );

        CREATE INDEX IF NOT EXISTS idx_deliveries_channel ON notify_deliveries(channel_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_deliveries_rule ON notify_deliveries(rule_id, created_at DESC);
        """
    )
    db.commit()

    # 种子数据（仅空库时插入）
    n = db.execute("SELECT COUNT(*) AS c FROM notify_channel_configs").fetchone()["c"]
    if n == 0:
        t = now_iso()
        cid1 = generate_uuid()
        cid2 = generate_uuid()
        db.execute(
            """INSERT INTO notify_channel_configs
            (id, type, label, enabled, secret_ref, config, created_at, updated_at)
            VALUES (?, ?, ?, 1, ?, ?, ?, ?)""",
            (
                cid1,
                "dingtalk",
                "投研钉钉-沙箱",
                "secret-ref://sandbox/dingtalk-webhook",
                json.dumps({"remark": "Sample 渠道，真发可走沙箱 webhook"}),
                t,
                t,
            ),
        )
        db.execute(
            """INSERT INTO notify_channel_configs
            (id, type, label, enabled, secret_ref, config, created_at, updated_at)
            VALUES (?, ?, ?, 1, ?, ?, ?, ?)""",
            (
                cid2,
                "email",
                "邮件-测试",
                "secret-ref://sandbox/smtp",
                json.dumps({"from": "notify@example.com"}),
                t,
                t,
            ),
        )
        tid = generate_uuid()
        db.execute(
            """INSERT INTO notify_message_templates
            (id, name, channel_type, subject, body_markdown, version, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?)""",
            (
                tid,
                "默认投研摘要",
                "dingtalk",
                None,
                "## {{title}}\n\n{{body}}\n\n> 变量示例: {{stock}}",
                t,
            ),
        )
        rid = generate_uuid()
        db.execute(
            """INSERT INTO notify_rules
            (id, name, enabled, trigger_type, schedule_cron, condition, template_id, created_at, updated_at)
            VALUES (?, ?, 1, 'manual', NULL, ?, ?, ?, ?)""",
            (
                rid,
                "Sample-手动试发规则",
                json.dumps({"keywords": [], "minSeverity": "high"}),
                tid,
                t,
                t,
            ),
        )
        db.execute(
            "INSERT INTO notify_rule_channels (rule_id, channel_id) VALUES (?, ?)",
            (rid, cid1),
        )
        db.commit()

    db.close()
