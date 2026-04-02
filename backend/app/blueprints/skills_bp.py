import re
from pathlib import Path

from flask import Blueprint, jsonify

bp = Blueprint("skills", __name__)

NAME_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$")


def _project_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---\n"):
        return {}, text
    parts = text.split("\n---\n", 1)
    if len(parts) != 2:
        return {}, text
    header, body = parts
    lines = header.splitlines()[1:]
    fm: dict = {}
    current_key = None
    for raw in lines:
        line = raw.rstrip()
        if not line:
            continue
        if line.startswith("- ") and current_key:
            fm.setdefault(current_key, [])
            if isinstance(fm[current_key], list):
                fm[current_key].append(line[2:].strip())
            continue
        if ":" in line:
            k, v = line.split(":", 1)
            key = k.strip()
            val = v.strip()
            current_key = key
            if not val:
                fm[key] = []
            elif val.lower() in ("true", "false"):
                fm[key] = val.lower() == "true"
            else:
                fm[key] = val.strip("'\"")
    return fm, body


def _validate_frontmatter(frontmatter: dict) -> list[str]:
    errors: list[str] = []
    name = str(frontmatter.get("name") or "").strip()
    description = str(frontmatter.get("description") or "").strip()
    if not name:
        errors.append("name is required")
    elif not NAME_RE.match(name):
        errors.append("name must match ^[a-z0-9-]+$ and length <= 64")
    elif "anthropic" in name or "claude" in name:
        errors.append("name cannot contain reserved words anthropic/claude")
    if not description:
        errors.append("description is required")
    elif len(description) > 1024:
        errors.append("description length must be <= 1024")
    return errors


def _skill_items_from_dir(base_dir: Path, source: str) -> list[dict]:
    if not base_dir.exists():
        return []
    items: list[dict] = []
    for skill_dir in sorted([p for p in base_dir.iterdir() if p.is_dir()]):
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            continue
        try:
            raw = skill_md.read_text(encoding="utf-8")
        except Exception:
            continue
        fm, body = _parse_frontmatter(raw)
        name = str(fm.get("name") or skill_dir.name)
        item = {
            "id": f"{source}:{name}",
            "name": name,
            "description": str(fm.get("description") or ""),
            "source": source,
            "path": str(skill_md),
            "frontmatter": fm,
            "content": body.strip(),
            "validation_errors": _validate_frontmatter(fm),
        }
        items.append(item)
    return items


@bp.route("/skills/catalog", methods=["GET"])
def skills_catalog():
    project_skills_dir = _project_root() / ".claude" / "skills"
    personal_skills_dir = Path.home() / ".claude" / "skills"
    items = _skill_items_from_dir(project_skills_dir, "project") + _skill_items_from_dir(
        personal_skills_dir, "personal"
    )
    return jsonify(
        {
            "protocol": "anthropic-agent-skills",
            "items": items,
            "count": len(items),
            "scanned_dirs": [str(project_skills_dir), str(personal_skills_dir)],
        }
    )
