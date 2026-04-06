import re
from datetime import datetime, timezone
from pathlib import Path

from app.errors import error_response
from app.json_store import read_json, write_json
from app.services.compliance_service import scan_text
from app.trace_util import new_trace_id
from flask import Blueprint, current_app, jsonify, request

bp = Blueprint("notify", __name__)


def _data(name: str):
    return Path(current_app.config["DATA_DIR"]) / name


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_rules():
    return read_json(_data("notify_rules.json"), {"items": []})


def _save_rules(payload):
    write_json(_data("notify_rules.json"), payload)


def _load_templates():
    return read_json(_data("notify_templates.json"), {"items": []})


def _save_templates(payload):
    write_json(_data("notify_templates.json"), payload)


def _load_channels():
    return read_json(_data("notify_channels.json"), {"items": []})


def _save_channels(payload):
    write_json(_data("notify_channels.json"), payload)


def _load_deliveries():
    return read_json(_data("notify_deliveries.json"), {"items": []})


def _save_deliveries(payload):
    write_json(_data("notify_deliveries.json"), payload)


def _load_history():
    return read_json(_data("notify_history.json"), {"items": []})


def _save_history(payload):
    write_json(_data("notify_history.json"), payload)


def _load_multi_agent_runs():
    return read_json(_data("multi_agent_runs.json"), {"runs": []})


def _multi_agent_review_status(trace_id: str) -> str | None:
    if not trace_id:
        return None
    runs = _load_multi_agent_runs().get("runs", [])
    row = next((r for r in runs if r.get("trace_id") == trace_id), None)
    if not row:
        return None
    return str(row.get("review_status") or "pending").lower()


def _find_rule(rule_id: str):
    rules = _load_rules().get("items", [])
    return next((r for r in rules if r.get("ruleId") == rule_id), None)


def _find_template(template_id: str):
    items = _load_templates().get("items", [])
    return next((t for t in items if t.get("templateId") == template_id), None)


def _channel_exists(channel_id: str) -> bool:
    items = _load_channels().get("items", [])
    return any(c.get("id") == channel_id for c in items)


def _validate_channel_ids(channel_ids: list[str]) -> tuple[bool, str | None]:
    for cid in channel_ids:
        if not _channel_exists(cid):
            return False, cid
    return True, None


def _render_markdown(template: str, variables: dict) -> str:
    pattern = re.compile(r"\{\{\s*(\w+)\s*\}\}")

    def _repl(match):
        key = match.group(1)
        if key not in variables:
            raise ValueError(f"missing template variable: {key}")
        return str(variables[key])

    return pattern.sub(_repl, template)


@bp.route("/notify/channels", methods=["GET"])
def notify_channels_get():
    data = _load_channels()
    return jsonify(data)


@bp.route("/notify/channels", methods=["PUT"])
def notify_channels_put():
    body = request.get_json(force=True, silent=True) or {}
    _save_channels(body if "items" in body else {"items": []})
    return jsonify({"ok": True})


@bp.route("/notify/channels/<channel_type>/test", methods=["POST"])
def notify_channel_test(channel_type: str):
    if channel_type not in ("dingtalk", "feishu", "email"):
        return error_response("M4_VALIDATION_ERROR", "unsupported channel type", 400)
    body = request.get_json(force=True, silent=True) or {}
    channel_id = body.get("channelId")
    if not channel_id:
        return error_response("M4_VALIDATION_ERROR", "channelId required", 400)
    channels = _load_channels().get("items", [])
    row = next((c for c in channels if c.get("id") == channel_id), None)
    if not row:
        return error_response("M4_CHANNEL_NOT_FOUND", "channel not found", 404)

    # Workshop / ira 当前阶段仍以 dry-run 为主，测试接口返回 mock 探测结果。
    now = _now_iso()
    row["last_test_status"] = "ok"
    row["last_test_at"] = now
    row["kind"] = row.get("kind") or channel_type
    _save_channels({"items": channels})
    return jsonify({"ok": True, "latencyMs": 120, "mode": "mock"})


@bp.route("/notify/templates", methods=["GET"])
def notify_templates_list():
    return jsonify({"items": _load_templates().get("items", []), "nextCursor": None, "hasMore": False})


@bp.route("/notify/templates", methods=["POST"])
def notify_templates_create():
    body = request.get_json(force=True, silent=True) or {}
    name = str(body.get("name", "")).strip()
    markdown = str(body.get("bodyMarkdown", "")).strip()
    channel_type = str(body.get("channelType", "dingtalk")).strip()
    if not name or not markdown:
        return error_response("M4_VALIDATION_ERROR", "name and bodyMarkdown required", 400)
    if channel_type not in ("dingtalk", "feishu", "email"):
        return error_response("M4_VALIDATION_ERROR", "invalid channelType", 400)
    tid = new_trace_id("tpl")
    item = {
        "templateId": tid,
        "name": name,
        "channelType": channel_type,
        "subject": body.get("subject"),
        "bodyMarkdown": markdown,
        "version": 1,
    }
    payload = _load_templates()
    payload["items"].insert(0, item)
    _save_templates(payload)
    return jsonify({"template": item}), 201


@bp.route("/notify/templates/<template_id>", methods=["GET"])
def notify_templates_get(template_id: str):
    tpl = _find_template(template_id)
    if not tpl:
        return error_response("M4_VALIDATION_ERROR", "template not found", 404)
    return jsonify(tpl)


@bp.route("/notify/templates/<template_id>", methods=["PATCH"])
def notify_templates_patch(template_id: str):
    body = request.get_json(force=True, silent=True) or {}
    payload = _load_templates()
    items = payload.get("items", [])
    idx = next((i for i, t in enumerate(items) if t.get("templateId") == template_id), None)
    if idx is None:
        return error_response("M4_VALIDATION_ERROR", "template not found", 404)
    old = items[idx]
    new_item = {
        **old,
        "name": body.get("name", old.get("name")),
        "subject": body.get("subject", old.get("subject")),
        "bodyMarkdown": body.get("bodyMarkdown", old.get("bodyMarkdown")),
        "version": int(old.get("version", 1)) + 1,
    }
    items[idx] = new_item
    payload["items"] = items
    _save_templates(payload)
    return jsonify(new_item)


@bp.route("/notify/templates/<template_id>", methods=["DELETE"])
def notify_templates_delete(template_id: str):
    rules = _load_rules().get("items", [])
    if any(r.get("templateId") == template_id for r in rules):
        return error_response("M4_VALIDATION_ERROR", "template is referenced by rule", 409)
    payload = _load_templates()
    before = len(payload.get("items", []))
    payload["items"] = [t for t in payload.get("items", []) if t.get("templateId") != template_id]
    if len(payload["items"]) == before:
        return error_response("M4_VALIDATION_ERROR", "template not found", 404)
    _save_templates(payload)
    return jsonify({"deleted": True})


@bp.route("/notify/rules", methods=["GET"])
def notify_rules_list():
    enabled_only = (request.args.get("enabledOnly") or "false").lower() == "true"
    items = _load_rules().get("items", [])
    if enabled_only:
        items = [it for it in items if bool(it.get("enabled"))]
    return jsonify({"items": items, "nextCursor": None, "hasMore": False})


@bp.route("/notify/rules", methods=["POST"])
def notify_rules_create():
    body = request.get_json(force=True, silent=True) or {}
    name = str(body.get("name", "")).strip()
    if not name:
        return error_response("M4_VALIDATION_ERROR", "name required", 400)
    channel_ids = body.get("channelIds") or []
    ok, bad = _validate_channel_ids(channel_ids)
    if not ok:
        return error_response("M4_VALIDATION_ERROR", f"invalid channelIds: {bad}", 400)
    rid = new_trace_id("rule")
    now = _now_iso()
    item = {
        "ruleId": rid,
        "name": name,
        "enabled": bool(body.get("enabled", True)),
        "triggerType": body.get("triggerType", "manual"),
        "scheduleCron": body.get("scheduleCron"),
        "condition": body.get("condition") or {},
        "templateId": body.get("templateId"),
        "channelIds": channel_ids,
        "createdAt": now,
        "updatedAt": now,
    }
    payload = _load_rules()
    payload["items"].insert(0, item)
    _save_rules(payload)
    return jsonify({"rule": item}), 201


@bp.route("/notify/rules/<rule_id>", methods=["GET"])
def notify_rules_get(rule_id: str):
    it = _find_rule(rule_id)
    if not it:
        return error_response("M4_RULE_NOT_FOUND", "rule not found", 404)
    return jsonify(it)


@bp.route("/notify/rules/<rule_id>", methods=["PATCH"])
def notify_rules_patch(rule_id: str):
    body = request.get_json(force=True, silent=True) or {}
    payload = _load_rules()
    items = payload.get("items", [])
    idx = next((i for i, r in enumerate(items) if r.get("ruleId") == rule_id), None)
    if idx is None:
        return error_response("M4_RULE_NOT_FOUND", "rule not found", 404)
    old = items[idx]
    channel_ids = body.get("channelIds", old.get("channelIds", []))
    ok, bad = _validate_channel_ids(channel_ids)
    if not ok:
        return error_response("M4_VALIDATION_ERROR", f"invalid channelIds: {bad}", 400)
    new_item = {
        **old,
        "name": body.get("name", old.get("name")),
        "enabled": body.get("enabled", old.get("enabled")),
        "triggerType": body.get("triggerType", old.get("triggerType")),
        "scheduleCron": body.get("scheduleCron", old.get("scheduleCron")),
        "condition": body.get("condition", old.get("condition")),
        "templateId": body.get("templateId", old.get("templateId")),
        "channelIds": channel_ids,
        "updatedAt": _now_iso(),
    }
    items[idx] = new_item
    payload["items"] = items
    _save_rules(payload)
    return jsonify(new_item)


@bp.route("/notify/rules/<rule_id>", methods=["DELETE"])
def notify_rules_delete(rule_id: str):
    payload = _load_rules()
    before = len(payload.get("items", []))
    payload["items"] = [r for r in payload.get("items", []) if r.get("ruleId") != rule_id]
    if len(payload["items"]) == before:
        return error_response("M4_RULE_NOT_FOUND", "rule not found", 404)
    _save_rules(payload)
    return jsonify({"deleted": True})


@bp.route("/notify/dispatch", methods=["POST"])
def notify_dispatch():
    body = request.get_json(force=True, silent=True) or {}
    if "payload" not in body:
        return error_response("M4_VALIDATION_ERROR", "payload required", 400)
    payload = body.get("payload") or {}
    title = str(payload.get("title", "")).strip() or "(untitled)"
    content = str(payload.get("body", "")).strip()
    variables = payload.get("variables") or {}
    dry_run = bool(body.get("dryRun", True))
    source_ref = body.get("sourceRef")
    rule_id = body.get("ruleId")
    channel_ids = list(body.get("channelIds") or [])

    template_body = None
    if rule_id:
        rule = _find_rule(rule_id)
        if not rule:
            return error_response("M4_RULE_NOT_FOUND", "rule not found", 404)
        if not bool(rule.get("enabled", True)):
            return error_response("M4_RULE_DISABLED", "rule is disabled", 409)
        channel_ids = list(rule.get("channelIds") or [])
        template_id = rule.get("templateId")
        if template_id:
            tpl = _find_template(template_id)
            if tpl:
                merge_vars = {**variables, "title": title, "body": content}
                try:
                    template_body = _render_markdown(str(tpl.get("bodyMarkdown") or ""), merge_vars)
                except ValueError as e:
                    return error_response("M4_VALIDATION_ERROR", str(e), 400)

    if not channel_ids:
        return error_response("M4_VALIDATION_ERROR", "ruleId or channelIds required", 400)
    ok, bad = _validate_channel_ids(channel_ids)
    if not ok:
        return error_response("M4_VALIDATION_ERROR", f"invalid channelIds: {bad}", 400)

    final_payload = template_body if template_body is not None else content
    if not dry_run and source_ref:
        st = _multi_agent_review_status(str(source_ref))
        if st in ("pending", "rejected"):
            return error_response("M4_REVIEW_REQUIRED", f"sourceRef review status is {st}", 409)

    rules_data = read_json(_data("rules.json"), {"rules": [], "ruleset_version": "rules-v1.0.0"})
    hits = scan_text(final_payload, rules_data.get("rules", []))
    if hits:
        return error_response("M4_COMPLIANCE_BLOCK", hits[0]["message"], 422)

    now = _now_iso()
    deliveries = _load_deliveries()
    history = _load_history()
    items = []
    first = None
    for channel_id in channel_ids:
        tid = new_trace_id("tr")
        did = new_trace_id("delivery")
        status = "sent" if dry_run else "pending"
        item = {
            "deliveryId": did,
            "ruleId": rule_id,
            "channelId": channel_id,
            "status": status,
            "dryRun": dry_run,
            "payloadPreview": final_payload[:500],
            "errorCode": None,
            "traceId": tid,
            "createdAt": now,
            "sourceRef": source_ref,
        }
        deliveries["items"].insert(0, item)
        history["items"].insert(
            0,
            {
                "trace_id": tid,
                "channel_id": channel_id,
                "payload": final_payload[:500],
                "source_trace_id": source_ref,
                "subject": title[:200] or None,
            },
        )
        items.append(item)
        if first is None:
            first = {"deliveryId": did, "status": status, "dryRun": dry_run, "traceId": tid}
    _save_deliveries(deliveries)
    _save_history(history)
    return jsonify({"delivery": first, "deliveries": items, "dryRun": dry_run})


@bp.route("/notify/deliveries", methods=["GET"])
def notify_deliveries_get():
    items = _load_deliveries().get("items", [])
    rule_id = request.args.get("ruleId")
    status = request.args.get("status")
    channel_id = request.args.get("channelId")
    if rule_id:
        items = [it for it in items if it.get("ruleId") == rule_id]
    if status:
        items = [it for it in items if it.get("status") == status]
    if channel_id:
        items = [it for it in items if it.get("channelId") == channel_id]
    return jsonify({"items": items, "nextCursor": None, "hasMore": False})


@bp.route("/notify/history", methods=["GET"])
def notify_history():
    return jsonify(_load_history())


@bp.route("/notify/push", methods=["POST"])
def notify_push():
    # 兼容旧接口：保持历史宽松语义（不校验 channel 是否存在），仅做合规检查并落库。
    body = request.get_json(force=True, silent=True) or {}
    payload = str(body.get("payload", ""))
    channel_id = body.get("channel_id", "default")
    source_trace = body.get("source_trace_id")
    subject = body.get("subject")

    rules_data = read_json(_data("rules.json"), {"rules": [], "ruleset_version": "rules-v1.0.0"})
    hits = scan_text(payload, rules_data.get("rules", []))
    if hits:
        return error_response("M4_COMPLIANCE_BLOCK", hits[0]["message"], 400)

    tid = new_trace_id("tr")
    now = _now_iso()
    history = _load_history()
    history["items"].insert(
        0,
        {
            "trace_id": tid,
            "channel_id": channel_id,
            "payload": payload[:500],
            "source_trace_id": source_trace,
            "subject": (subject or "")[:200] or None,
        },
    )
    _save_history(history)

    deliveries = _load_deliveries()
    deliveries["items"].insert(
        0,
        {
            "deliveryId": new_trace_id("delivery"),
            "ruleId": None,
            "channelId": channel_id,
            "status": "sent",
            "dryRun": True,
            "payloadPreview": payload[:500],
            "errorCode": None,
            "traceId": tid,
            "createdAt": now,
            "sourceRef": source_trace,
        },
    )
    _save_deliveries(deliveries)
    return jsonify({"trace_id": tid, "delivery_status": "dry_run_ok", "dry_run": True})
