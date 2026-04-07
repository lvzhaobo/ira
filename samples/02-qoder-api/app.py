import json
import os
import shutil
import subprocess
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
JOBS_DIR = BASE_DIR / "jobs"
RESULTS_DIR = BASE_DIR / "results"
QODERCLI_PATH = os.environ.get("QODERCLI_PATH", "qodercli")
DEFAULT_TIMEOUT = int(os.environ.get("QODER_TIMEOUT_SECONDS", "300"))

JOBS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__, static_folder="static", static_url_path="/static")
CORS(app)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def job_file(job_id: str) -> Path:
    return JOBS_DIR / f"{job_id}.json"


def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: dict) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def normalize_executable_for_subprocess(executable: str) -> str:
    """
    Windows: npm 全局包常出现无扩展名 shim（如 .../npm/qodercli），
    CreateProcess 无法直接执行；优先改用同名的 .cmd / .exe。
    """
    path = Path(executable)
    if os.name != "nt":
        return executable
    suf = path.suffix.lower()
    if suf in (".exe", ".cmd", ".bat", ".com"):
        return str(path)
    for ext in (".cmd", ".exe", ".bat"):
        cand = path.with_suffix(ext)
        if cand.exists():
            return str(cand)
    return executable


def resolve_qoder_base_command() -> tuple[list[str], str]:
    configured = QODERCLI_PATH.strip()
    if os.path.isabs(configured) and Path(configured).exists():
        exe = normalize_executable_for_subprocess(configured)
        return [exe], f"使用环境变量指定路径: {exe}"

    found = shutil.which(configured)
    if found:
        exe = normalize_executable_for_subprocess(found)
        return [exe], f"通过 PATH 找到: {exe}"

    if os.name == "nt":
        for candidate in ["qodercli.cmd", "qodercli.exe", "qodercli"]:
            w = shutil.which(candidate)
            if w:
                exe = normalize_executable_for_subprocess(w)
                return [exe], f"Windows PATH 找到: {exe}"

    if shutil.which("npx"):
        return ["npx", "-y", "@qoder-ai/qodercli"], "未找到 qodercli，回退到 npx @qoder-ai/qodercli"

    return [configured], "未解析到可执行文件，建议配置 QODERCLI_PATH 或安装 qodercli"


def run_qoder(prompt: str, workspace: Optional[str], timeout: int) -> dict:
    base_cmd, resolve_note = resolve_qoder_base_command()
    cmd = [*base_cmd, "-p", prompt]
    if workspace:
        cmd.extend(["-w", workspace])

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
            shell=False,
        )
        return {
            "ok": proc.returncode == 0,
            "return_code": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "command": cmd,
            "resolve_note": resolve_note,
        }
    except subprocess.TimeoutExpired as exc:
        return {
            "ok": False,
            "return_code": -1,
            "stdout": exc.stdout or "",
            "stderr": f"Command timeout after {timeout}s",
            "command": cmd,
            "resolve_note": resolve_note,
        }
    except Exception as exc:  # pragma: no cover
        return {
            "ok": False,
            "return_code": -2,
            "stdout": "",
            "stderr": str(exc),
            "command": cmd,
            "resolve_note": resolve_note,
        }


def run_async_job(job_id: str) -> None:
    path = job_file(job_id)
    job = read_json(path)
    if not job:
        return

    job["status"] = "running"
    job["updated_at"] = now_iso()
    write_json(path, job)

    result = run_qoder(job["prompt"], job.get("workspace"), int(job.get("timeout", DEFAULT_TIMEOUT)))

    result_name = f"{job_id}.txt"
    result_path = RESULTS_DIR / result_name
    with result_path.open("w", encoding="utf-8") as f:
        f.write(result.get("stdout", ""))
        if result.get("stderr"):
            f.write("\n\n--- STDERR ---\n")
            f.write(result["stderr"])

    job["status"] = "done" if result.get("ok") else "failed"
    job["updated_at"] = now_iso()
    job["finished_at"] = now_iso()
    job["result_file"] = f"/api/files/{result_name}"
    job["return_code"] = result.get("return_code")
    job["stderr"] = result.get("stderr", "")
    job["command"] = result.get("command")
    job["resolve_note"] = result.get("resolve_note")
    write_json(path, job)


@app.get("/")
def index():
    return send_from_directory("static", "index.html")


@app.get("/vue")
def vue_index():
    return send_from_directory("static", "vue.html")


@app.get("/api/health")
def health():
    cmd, resolve_note = resolve_qoder_base_command()
    return jsonify(
        {
            "ok": True,
            "service": "qoder-flask-wrapper",
            "qodercli_path": QODERCLI_PATH,
            "resolved_command": cmd,
            "resolve_note": resolve_note,
            "time": now_iso(),
        }
    )


@app.route("/api/run", methods=["GET", "POST"])
def run_once():
    # 支持GET和POST两种方式获取参数
    if request.method == "GET":
        prompt = (request.args.get("prompt") or "").strip()
        workspace = request.args.get("workspace")
        timeout = int(request.args.get("timeout", DEFAULT_TIMEOUT))
        save_to_file = request.args.get("save_to_file", "false").lower() == "true"
    else:
        body = request.get_json(silent=True) or {}
        prompt = (body.get("prompt") or "").strip()
        workspace = body.get("workspace")
        timeout = int(body.get("timeout", DEFAULT_TIMEOUT))
        save_to_file = bool(body.get("save_to_file", False))
    
    if not prompt:
        return jsonify({"ok": False, "error": "prompt 不能为空"}), 400

    result = run_qoder(prompt, workspace, timeout)
    payload = {
        "ok": result["ok"],
        "return_code": result["return_code"],
        "stdout": result["stdout"],
        "stderr": result["stderr"],
        "command": result.get("command"),
        "resolve_note": result.get("resolve_note"),
    }

    if save_to_file:
        file_name = f"sync-{uuid.uuid4().hex[:10]}.txt"
        target = RESULTS_DIR / file_name
        with target.open("w", encoding="utf-8") as f:
            f.write(result.get("stdout", ""))
            if result.get("stderr"):
                f.write("\n\n--- STDERR ---\n")
                f.write(result["stderr"])
        payload["result_file"] = f"/api/files/{file_name}"

    return jsonify(payload)


@app.post("/api/jobs")
def create_job():
    body = request.get_json(silent=True) or {}
    prompt = (body.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"ok": False, "error": "prompt 不能为空"}), 400

    job_id = uuid.uuid4().hex
    job = {
        "id": job_id,
        "status": "queued",
        "prompt": prompt,
        "workspace": body.get("workspace"),
        "timeout": int(body.get("timeout", DEFAULT_TIMEOUT)),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    write_json(job_file(job_id), job)

    thread = threading.Thread(target=run_async_job, args=(job_id,), daemon=True)
    thread.start()

    return jsonify({"ok": True, "job_id": job_id, "status_url": f"/api/jobs/{job_id}"})


@app.get("/api/jobs/<job_id>")
def get_job(job_id: str):
    data = read_json(job_file(job_id))
    if not data:
        return jsonify({"ok": False, "error": "任务不存在"}), 404
    return jsonify({"ok": True, "job": data})


@app.get("/api/jobs")
def list_jobs():
    items = []
    for p in sorted(JOBS_DIR.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
        items.append(read_json(p))
    return jsonify({"ok": True, "jobs": items[:50]})


@app.get("/api/files/<path:file_name>")
def read_result_file(file_name: str):
    return send_from_directory(str(RESULTS_DIR), file_name)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5007"))
    app.run(host="0.0.0.0", port=port, debug=True)
