"""
M4 通知模块 API — 对齐 09-API 规格（Sample：SQLite + 合规 stub + 内存频控）。
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from collections import deque

import requests
from flask import Blueprint, jsonify, request

from db import generate_uuid, get_db, now_iso

notify_bp = Blueprint("notify", __name__)

# 真发频控：每小时每用户（Sample 固定单用户）
_RATE_HITS: deque[float] = deque()
RATE_LIMIT_PER_HOUR = 30


def _error(code: str, message: str, http_status: int):
    return jsonify({"error": {"code": code, "message": message}}), http_status


def _parse_json_body():
    if not request.is_json:
        return None
    return request.get_json(silent=True)


def _validate_channel_ids(db, channel_ids: list[str]) -> tuple[bool, str | None]:
    for cid in channel_ids:
        row = db.execute(
            "SELECT id FROM notify_channel_configs WHERE id=?",
            (cid,),
        ).fetchone()
        if not row:
            return False, cid
    return True, None


def _render_markdown(body: str, variables: dict) -> str:
    pattern = re.compile(r"\{\{\s*(\w+)\s*\}\}")

    def repl(m):
        key = m.group(1)
        if key not in variables:
            raise ValueError(f"缺少模板变量: {key}")
        return str(variables[key])

    return pattern.sub(repl, body)


def _compliance_scan(payload_preview: str) -> tuple[str | None, str | None]:
    """合规 stub：默认通过；M4_COMPLIANCE_BLOCK=1 时拦截。"""
    if os.environ.get("M4_COMPLIANCE_BLOCK", "").strip() == "1":
        return None, "stub compliance blocked"
    return "stub-" + generate_uuid()[:12], None


def _rate_limit_check() -> bool:
    now = time.time()
    while _RATE_HITS and _RATE_HITS[0] < now - 3600:
        _RATE_HITS.popleft()
    if len(_RATE_HITS) >= RATE_LIMIT_PER_HOUR:
        return False
    _RATE_HITS.append(now)
    return True


def _send_channel_sandbox(db, channel_id: str, title: str, body: str, dry_run: bool):
    """dry_run 时不访问外网；否则仅当 secret_ref 为 http(s) 时尝试 POST（沙箱）。"""
    if dry_run:
        return "sent", None
    row = db.execute(
        "SELECT secret_ref, type FROM notify_channel_configs WHERE id=?",
        (channel_id,),
    ).fetchone()
    if not row:
        return "failed", "M4_CHANNEL_NOT_FOUND"
    secret = (row["secret_ref"] or "").strip()
    if secret.startswith("http://") or secret.startswith("https://"):
        try:
            payload = {"msgtype": "text", "text": {"content": f"{title}\n{body}"}}
            if row["type"] == "email":
                payload = {"subject": title, "body": body}
            r = requests.post(secret, json=payload, timeout=5)
            if r.status_code >= 400:
                return "failed", "M4_CHANNEL_UNAVAILABLE"
            return "sent", None
        except OSError:
            return "failed", "M4_CHANNEL_UNAVAILABLE"
    # 非 URL：视为沙箱成功回执
    return "sent", None


@notify_bp.route("/notify/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "module": "M4"}), 200


@notify_bp.route("/notify/channels", methods=["GET"])
def list_channels():
    db = get_db()
    rows = db.execute(
        """SELECT id, type, label, enabled, last_test_status
           FROM notify_channel_configs ORDER BY created_at DESC"""
    ).fetchall()
    items = [
        {
            "channelId": r["id"],
            "type": r["type"],
            "label": r["label"],
            "enabled": bool(r["enabled"]),
            "lastTestStatus": r["last_test_status"],
        }
        for r in rows
    ]
    return jsonify({"items": items}), 200


@notify_bp.route("/notify/channels", methods=["POST"])
def create_channel():
    data = _parse_json_body()
    if not data or not data.get("type") or not data.get("label"):
        return _error("M4_VALIDATION_ERROR", "type 与 label 为必填", 400)
    if data["type"] not in ("dingtalk", "feishu", "email"):
        return _error("M4_VALIDATION_ERROR", "type 必须是 dingtalk / feishu / email", 400)

    cid = generate_uuid()
    t = now_iso()
    cfg = data.get("config")
    if isinstance(cfg, str):
        try:
            cfg = json.loads(cfg) if cfg.strip() else {}
        except json.JSONDecodeError:
            return _error("M4_VALIDATION_ERROR", "config 不是合法 JSON", 400)
    elif cfg is None:
        cfg = {}

    db = get_db()
    db.execute(
        """INSERT INTO notify_channel_configs
        (id, type, label, enabled, secret_ref, config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            cid,
            data["type"],
            data["label"],
            1 if data.get("enabled", True) else 0,
            data.get("secretRef") or "",
            json.dumps(cfg),
            t,
            t,
        ),
    )
    db.commit()
    return (
        jsonify(
            {
                "channel": {
                    "channelId": cid,
                    "type": data["type"],
                    "label": data["label"],
                    "enabled": bool(data.get("enabled", True)),
                    "lastTestStatus": None,
                }
            }
        ),
        201,
    )


@notify_bp.route("/notify/channels/<channel_id>", methods=["DELETE"])
def delete_channel(channel_id):
    db = get_db()
    row = db.execute(
        "SELECT id FROM notify_channel_configs WHERE id=?",
        (channel_id,),
    ).fetchone()
    if not row:
        return _error("M4_CHANNEL_NOT_FOUND", "渠道不存在", 404)
    db.execute("DELETE FROM notify_rule_channels WHERE channel_id=?", (channel_id,))
    db.execute("DELETE FROM notify_channel_configs WHERE id=?", (channel_id,))
    db.commit()
    return jsonify({"deleted": True}), 200


def _dingtalk_probe(webhook_url: str) -> tuple[bool, int, str | None]:
    """向钉钉自定义机器人 Webhook POST 一条文本；成功 (True, latency_ms, None)，失败 (False, 0, err_msg)。"""
    t0 = time.time()
    payload = {
        "msgtype": "text",
        "text": {
            "content": (
                "【C-NotifyPush】渠道连通性测试（Sample）\n"
                "若群/单聊机器人收到本条，说明 Webhook 可用。"
            ),
        },
    }
    try:
        r = requests.post(webhook_url, json=payload, timeout=12)
    except OSError:
        return False, 0, "网络请求失败（超时或不可达）"
    latency_ms = int((time.time() - t0) * 1000)
    if r.status_code >= 400:
        return False, latency_ms, f"HTTP {r.status_code}"
    try:
        jr = r.json()
        errcode = jr.get("errcode")
        if errcode is not None and errcode != 0:
            return False, latency_ms, jr.get("errmsg") or f"钉钉 errcode={errcode}"
    except Exception:
        pass
    return True, latency_ms, None


def _feishu_probe(webhook_url: str) -> tuple[bool, int, str | None]:
    """飞书群机器人 Webhook（文本）。"""
    t0 = time.time()
    payload = {"msg_type": "text", "content": {"text": "【C-NotifyPush】连通性测试（Sample）"}}
    try:
        r = requests.post(webhook_url, json=payload, timeout=12)
    except OSError:
        return False, 0, "网络请求失败"
    latency_ms = int((time.time() - t0) * 1000)
    if r.status_code >= 400:
        return False, latency_ms, f"HTTP {r.status_code}"
    try:
        jr = r.json()
        code = jr.get("code")
        if code is not None and int(code) != 0:
            return False, latency_ms, jr.get("msg") or f"code={code}"
    except Exception:
        pass
    return True, latency_ms, None


@notify_bp.route("/notify/channels/<string:channel_type>/test", methods=["POST"])
def test_channel(channel_type):
    if channel_type not in ("dingtalk", "feishu", "email"):
        return _error("M4_VALIDATION_ERROR", f"不支持的渠道类型: {channel_type}", 400)
    data = _parse_json_body() or {}
    channel_id = data.get("channelId")
    real_probe = bool(data.get("realProbe"))

    if not channel_id:
        return _error("M4_VALIDATION_ERROR", "channelId 为必填", 400)

    db = get_db()
    row = db.execute(
        "SELECT id, secret_ref, type FROM notify_channel_configs WHERE id=? AND type=?",
        (channel_id, channel_type),
    ).fetchone()
    if not row:
        return _error("M4_CHANNEL_NOT_FOUND", "渠道不存在或类型不匹配", 404)

    secret = (row["secret_ref"] or "").strip()

    # 快速校验：不访问外网，仅更新「最近测试」为 ok（适合无网/占位 secret-ref）
    if not real_probe:
        time.sleep(0.05)
        latency_ms = 120
        db.execute(
            "UPDATE notify_channel_configs SET last_test_at=?, last_test_status=?, updated_at=? WHERE id=?",
            (now_iso(), "ok", now_iso(), channel_id),
        )
        db.commit()
        return jsonify({"ok": True, "latencyMs": latency_ms, "mode": "mock"}), 200

    # 真实探测：仅当配置了 http(s) Webhook
    if channel_type == "email":
        return (
            jsonify(
                {
                    "ok": True,
                    "latencyMs": 0,
                    "mode": "skipped",
                    "hint": "邮件渠道需在服务端配置 SMTP，本接口不发起真实投递。请用「消息试发」dryRun=false 验证。",
                }
            ),
            200,
        )

    if not (secret.startswith("http://") or secret.startswith("https://")):
        return (
            jsonify(
                {
                    "ok": True,
                    "latencyMs": 0,
                    "mode": "skipped",
                    "hint": (
                        "未检测到以 http(s) 开头的 Webhook 地址。"
                        "钉钉请在群内添加「自定义机器人」并复制 Webhook（通常以 "
                        "https://oapi.dingtalk.com/robot/send?access_token= 开头）。"
                        "若机器人启用了「加签」，本 Sample 未实现签名，需自行扩展或关闭加签后测试。"
                    ),
                }
            ),
            200,
        )

    if channel_type == "dingtalk":
        ok, latency_ms, err = _dingtalk_probe(secret)
    else:
        ok, latency_ms, err = _feishu_probe(secret)

    if not ok:
        db.execute(
            "UPDATE notify_channel_configs SET last_test_at=?, last_test_status=?, updated_at=? WHERE id=?",
            (now_iso(), "fail", now_iso(), channel_id),
        )
        db.commit()
        return _error("M4_CHANNEL_UNAVAILABLE", err or "渠道不可用", 503)

    db.execute(
        "UPDATE notify_channel_configs SET last_test_at=?, last_test_status=?, updated_at=? WHERE id=?",
        (now_iso(), "ok", now_iso(), channel_id),
    )
    db.commit()
    return jsonify({"ok": True, "latencyMs": latency_ms, "mode": "http"}), 200


@notify_bp.route("/notify/templates", methods=["GET"])
def list_templates():
    db = get_db()
    limit = min(int(request.args.get("limit") or 20), 100)
    rows = db.execute(
        "SELECT * FROM notify_message_templates ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    items = [
        {
            "templateId": r["id"],
            "name": r["name"],
            "channelType": r["channel_type"],
            "subject": r["subject"],
            "bodyMarkdown": r["body_markdown"],
            "version": r["version"],
        }
        for r in rows
    ]
    return jsonify({"items": items, "nextCursor": None, "hasMore": False}), 200


@notify_bp.route("/notify/templates", methods=["POST"])
def create_template():
    data = _parse_json_body()
    if not data or not data.get("name") or not data.get("bodyMarkdown"):
        return _error("M4_VALIDATION_ERROR", "name 与 bodyMarkdown 为必填", 400)
    ct = data.get("channelType", "dingtalk")
    if ct not in ("dingtalk", "feishu", "email"):
        return _error("M4_VALIDATION_ERROR", "channelType 无效", 400)
    tid = generate_uuid()
    t = now_iso()
    db = get_db()
    db.execute(
        """INSERT INTO notify_message_templates
        (id, name, channel_type, subject, body_markdown, version, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)""",
        (tid, data["name"], ct, data.get("subject"), data["bodyMarkdown"], t),
    )
    db.commit()
    return (
        jsonify(
            {
                "template": {
                    "templateId": tid,
                    "name": data["name"],
                    "channelType": ct,
                    "subject": data.get("subject"),
                    "bodyMarkdown": data["bodyMarkdown"],
                    "version": 1,
                }
            }
        ),
        201,
    )


@notify_bp.route("/notify/templates/<template_id>", methods=["GET"])
def get_template(template_id):
    db = get_db()
    tpl = db.execute(
        "SELECT * FROM notify_message_templates WHERE id=?",
        (template_id,),
    ).fetchone()
    if not tpl:
        return _error("M4_VALIDATION_ERROR", "模板不存在", 404)
    return (
        jsonify(
            {
                "templateId": tpl["id"],
                "name": tpl["name"],
                "channelType": tpl["channel_type"],
                "subject": tpl["subject"],
                "bodyMarkdown": tpl["body_markdown"],
                "version": tpl["version"],
            }
        ),
        200,
    )


@notify_bp.route("/notify/templates/<template_id>", methods=["PATCH"])
def patch_template(template_id):
    data = _parse_json_body() or {}
    db = get_db()
    tpl = db.execute(
        "SELECT * FROM notify_message_templates WHERE id=?",
        (template_id,),
    ).fetchone()
    if not tpl:
        return _error("M4_VALIDATION_ERROR", "模板不存在", 404)
    name = data.get("name", tpl["name"])
    subject = data.get("subject", tpl["subject"])
    body = data.get("bodyMarkdown", tpl["body_markdown"])
    ver = tpl["version"] + 1
    db.execute(
        "UPDATE notify_message_templates SET name=?, subject=?, body_markdown=?, version=? WHERE id=?",
        (name, subject, body, ver, template_id),
    )
    db.commit()
    return (
        jsonify(
            {
                "templateId": template_id,
                "name": name,
                "channelType": tpl["channel_type"],
                "subject": subject,
                "bodyMarkdown": body,
                "version": ver,
            }
        ),
        200,
    )


@notify_bp.route("/notify/templates/<template_id>", methods=["DELETE"])
def delete_template(template_id):
    db = get_db()
    tpl = db.execute(
        "SELECT id FROM notify_message_templates WHERE id=?",
        (template_id,),
    ).fetchone()
    if not tpl:
        return _error("M4_VALIDATION_ERROR", "模板不存在", 404)
    ref = db.execute(
        "SELECT id FROM notify_rules WHERE template_id=? LIMIT 1",
        (template_id,),
    ).fetchone()
    if ref:
        return _error("M4_VALIDATION_ERROR", "模板仍被规则引用，无法删除", 409)
    db.execute("DELETE FROM notify_message_templates WHERE id=?", (template_id,))
    db.commit()
    return jsonify({"deleted": True}), 200


@notify_bp.route("/notify/rules", methods=["GET"])
def list_rules():
    db = get_db()
    enabled_only = request.args.get("enabledOnly", "false").lower() == "true"
    limit = min(int(request.args.get("limit") or 20), 100)
    where = " WHERE enabled=1" if enabled_only else ""
    rows = db.execute(
        f"SELECT * FROM notify_rules {where} ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    items = []
    for rule in rows:
        chs = db.execute(
            "SELECT channel_id FROM notify_rule_channels WHERE rule_id=?",
            (rule["id"],),
        ).fetchall()
        channel_ids = [c["channel_id"] for c in chs]
        cond = json.loads(rule["condition"]) if rule["condition"] else {}
        items.append(
            {
                "ruleId": rule["id"],
                "name": rule["name"],
                "enabled": bool(rule["enabled"]),
                "triggerType": rule["trigger_type"],
                "scheduleCron": rule["schedule_cron"],
                "condition": cond,
                "templateId": rule["template_id"],
                "channelIds": channel_ids,
                "createdAt": rule["created_at"],
                "updatedAt": rule["updated_at"],
            }
        )
    return jsonify({"items": items, "nextCursor": None, "hasMore": False}), 200


@notify_bp.route("/notify/rules", methods=["POST"])
def create_rule():
    data = _parse_json_body()
    if not data or not data.get("name"):
        return _error("M4_VALIDATION_ERROR", "name 为必填", 400)
    channel_ids = data.get("channelIds") or []
    db = get_db()
    ok, bad = _validate_channel_ids(db, channel_ids)
    if not ok:
        return _error(
            "M4_VALIDATION_ERROR",
            f"非法 channelIds: {bad}",
            400,
        )

    rid = generate_uuid()
    t = now_iso()
    db.execute(
        """INSERT INTO notify_rules
        (id, name, enabled, trigger_type, schedule_cron, condition, template_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            rid,
            data["name"],
            1 if data.get("enabled", True) else 0,
            data.get("triggerType", "manual"),
            data.get("scheduleCron"),
            json.dumps(data.get("condition") or {}),
            data.get("templateId"),
            t,
            t,
        ),
    )
    for cid in channel_ids:
        db.execute(
            "INSERT INTO notify_rule_channels (rule_id, channel_id) VALUES (?, ?)",
            (rid, cid),
        )
    db.commit()
    return (
        jsonify(
            {
                "rule": {
                    "ruleId": rid,
                    "name": data["name"],
                    "enabled": bool(data.get("enabled", True)),
                    "triggerType": data.get("triggerType", "manual"),
                    "scheduleCron": data.get("scheduleCron"),
                    "condition": data.get("condition") or {},
                    "templateId": data.get("templateId"),
                    "channelIds": channel_ids,
                    "createdAt": t,
                    "updatedAt": t,
                }
            }
        ),
        201,
    )


@notify_bp.route("/notify/rules/<rule_id>", methods=["GET"])
def get_rule(rule_id):
    db = get_db()
    rule = db.execute(
        "SELECT * FROM notify_rules WHERE id=?",
        (rule_id,),
    ).fetchone()
    if not rule:
        return _error("M4_RULE_NOT_FOUND", "规则不存在", 404)
    chs = db.execute(
        "SELECT channel_id FROM notify_rule_channels WHERE rule_id=?",
        (rule_id,),
    ).fetchall()
    channel_ids = [c["channel_id"] for c in chs]
    return (
        jsonify(
            {
                "ruleId": rule["id"],
                "name": rule["name"],
                "enabled": bool(rule["enabled"]),
                "triggerType": rule["trigger_type"],
                "scheduleCron": rule["schedule_cron"],
                "condition": json.loads(rule["condition"]) if rule["condition"] else {},
                "templateId": rule["template_id"],
                "channelIds": channel_ids,
                "createdAt": rule["created_at"],
                "updatedAt": rule["updated_at"],
            }
        ),
        200,
    )


@notify_bp.route("/notify/rules/<rule_id>", methods=["PATCH"])
def patch_rule(rule_id):
    data = _parse_json_body() or {}
    db = get_db()
    rule = db.execute(
        "SELECT * FROM notify_rules WHERE id=?",
        (rule_id,),
    ).fetchone()
    if not rule:
        return _error("M4_RULE_NOT_FOUND", "规则不存在", 404)

    if "channelIds" in data:
        ok, bad = _validate_channel_ids(db, data["channelIds"])
        if not ok:
            return _error("M4_VALIDATION_ERROR", f"非法 channelIds: {bad}", 400)

    t = now_iso()
    name = data.get("name", rule["name"])
    enabled = data["enabled"] if "enabled" in data else bool(rule["enabled"])
    trigger_type = data.get("triggerType", rule["trigger_type"])
    schedule_cron = data.get("scheduleCron", rule["schedule_cron"])
    condition = (
        json.dumps(data["condition"])
        if "condition" in data
        else rule["condition"]
    )
    template_id = data.get("templateId", rule["template_id"])

    db.execute(
        """UPDATE notify_rules SET name=?, enabled=?, trigger_type=?, schedule_cron=?,
           condition=?, template_id=?, updated_at=? WHERE id=?""",
        (
            name,
            1 if enabled else 0,
            trigger_type,
            schedule_cron,
            condition,
            template_id,
            t,
            rule_id,
        ),
    )
    if "channelIds" in data:
        db.execute("DELETE FROM notify_rule_channels WHERE rule_id=?", (rule_id,))
        for cid in data["channelIds"]:
            db.execute(
                "INSERT INTO notify_rule_channels (rule_id, channel_id) VALUES (?, ?)",
                (rule_id, cid),
            )
    db.commit()
    return get_rule(rule_id)


@notify_bp.route("/notify/rules/<rule_id>", methods=["DELETE"])
def delete_rule(rule_id):
    db = get_db()
    db.execute("DELETE FROM notify_rule_channels WHERE rule_id=?", (rule_id,))
    db.execute("DELETE FROM notify_rules WHERE id=?", (rule_id,))
    db.commit()
    return jsonify({"deleted": True}), 200


@notify_bp.route("/notify/dispatch", methods=["POST"])
def dispatch():
    data = _parse_json_body()
    if not data or "payload" not in data:
        return _error("M4_VALIDATION_ERROR", "payload 为必填", 400)

    dry_run = data.get("dryRun", True)
    payload = data["payload"]
    rule_id = data.get("ruleId")
    channel_ids = list(data.get("channelIds") or [])
    source_ref = data.get("sourceRef")

    title = (payload.get("title") or "").strip() or "(无标题)"
    body = (payload.get("body") or "").strip() or "(无正文)"
    variables = payload.get("variables") or {}

    db = get_db()
    template_body = None
    if rule_id:
        rule = db.execute(
            "SELECT * FROM notify_rules WHERE id=?",
            (rule_id,),
        ).fetchone()
        if not rule:
            return _error("M4_RULE_NOT_FOUND", "规则不存在", 404)
        if not rule["enabled"]:
            return _error("M4_RULE_DISABLED", "规则已禁用", 409)
        ch_rows = db.execute(
            "SELECT channel_id FROM notify_rule_channels WHERE rule_id=?",
            (rule_id,),
        ).fetchall()
        channel_ids = [r["channel_id"] for r in ch_rows]
        if rule["template_id"]:
            tpl = db.execute(
                "SELECT * FROM notify_message_templates WHERE id=?",
                (rule["template_id"],),
            ).fetchone()
            if tpl:
                merge_vars = {**variables, "title": title, "body": body}
                try:
                    template_body = _render_markdown(tpl["body_markdown"], merge_vars)
                except ValueError as e:
                    return _error("M4_VALIDATION_ERROR", str(e), 400)

    if not channel_ids:
        return _error("M4_VALIDATION_ERROR", "需提供 ruleId 或有效 channelIds", 400)

    ok, bad = _validate_channel_ids(db, channel_ids)
    if not ok:
        return _error("M4_VALIDATION_ERROR", f"非法 channelIds: {bad}", 400)

    payload_for_hash = {
        "title": title,
        "body": body if template_body is None else template_body,
        "variables": variables,
    }
    payload_str = json.dumps(payload_for_hash, sort_keys=True, ensure_ascii=False)
    payload_hash = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
    payload_preview = payload_str[:500]

    compliance_scan_id = None
    if not dry_run:
        compliance_scan_id, block_reason = _compliance_scan(payload_preview)
        if block_reason:
            return _error("M4_COMPLIANCE_BLOCK", block_reason, 422)
        if not _rate_limit_check():
            return _error("M4_RATE_LIMIT", "真发次数超过每小时上限（Sample: 30）", 429)

    deliveries_out = []
    first_summary = None

    for ch_id in channel_ids:
        delivery_id = generate_uuid()
        trace_id = generate_uuid()
        t = now_iso()
        status = "sent"
        err = None

        if dry_run:
            status = "sent"
        else:
            final_title = title
            final_body = template_body if template_body is not None else body
            status, err = _send_channel_sandbox(db, ch_id, final_title, final_body, dry_run=False)

        db.execute(
            """INSERT INTO notify_deliveries
            (id, rule_id, channel_id, status, dry_run, payload_preview, payload_hash,
             error_code, trace_id, source_ref, compliance_scan_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                delivery_id,
                rule_id,
                ch_id,
                status,
                1 if dry_run else 0,
                payload_preview,
                payload_hash,
                err,
                trace_id,
                source_ref,
                compliance_scan_id if not dry_run else None,
                t,
            ),
        )
        db.commit()

        item = {
            "deliveryId": delivery_id,
            "ruleId": rule_id,
            "channelId": ch_id,
            "status": status,
            "dryRun": dry_run,
            "payloadPreview": payload_preview,
            "errorCode": err,
            "traceId": trace_id,
            "createdAt": t,
        }
        deliveries_out.append(item)
        if first_summary is None:
            first_summary = {
                "deliveryId": delivery_id,
                "status": status,
                "dryRun": dry_run,
                "traceId": trace_id,
            }

    return (
        jsonify(
            {
                "delivery": first_summary,
                "deliveries": deliveries_out,
                "dryRun": dry_run,
            }
        ),
        200,
    )


@notify_bp.route("/notify/deliveries", methods=["GET"])
def list_deliveries():
    db = get_db()
    conditions = []
    params = []
    if request.args.get("ruleId"):
        conditions.append("rule_id=?")
        params.append(request.args["ruleId"])
    if request.args.get("status"):
        conditions.append("status=?")
        params.append(request.args["status"])
    if request.args.get("channelId"):
        conditions.append("channel_id=?")
        params.append(request.args["channelId"])
    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    q = f"SELECT * FROM notify_deliveries {where} ORDER BY created_at DESC LIMIT 200"
    rows = db.execute(q, params).fetchall()
    items = [
        {
            "deliveryId": r["id"],
            "ruleId": r["rule_id"],
            "channelId": r["channel_id"],
            "status": r["status"],
            "dryRun": bool(r["dry_run"]),
            "payloadPreview": r["payload_preview"],
            "errorCode": r["error_code"],
            "traceId": r["trace_id"],
            "createdAt": r["created_at"],
        }
        for r in rows
    ]
    return jsonify({"items": items, "nextCursor": None, "hasMore": False}), 200
