from pathlib import Path

from flask import Flask, g, request

from app.config import get_data_dir
from app.trace_util import new_trace_id


def _load_env_file():
    """加载 .env：先仓库根目录，再 backend（后者可覆盖）。未安装 python-dotenv 时跳过。"""
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    backend = Path(__file__).resolve().parent.parent
    root = backend.parent
    load_dotenv(root / ".env")
    load_dotenv(backend / ".env")


def create_app(test_config=None):
    _load_env_file()
    app = Flask(__name__)
    app.config["DATA_DIR"] = str(get_data_dir())
    if test_config:
        app.config.update(test_config)

    @app.before_request
    def _trace():
        g.trace_id = request.headers.get("X-Trace-Id") or new_trace_id("tr")

    @app.after_request
    def _add_header(resp):
        if getattr(g, "trace_id", None):
            resp.headers["X-Trace-Id"] = g.trace_id
        return resp

    from app.blueprints.system_bp import bp as system_bp
    from app.blueprints.dashboard_bp import bp as dashboard_bp
    from app.blueprints.compliance_bp import bp as compliance_bp
    from app.blueprints.lineage_bp import bp as lineage_bp
    from app.blueprints.research_bp import bp as research_bp
    from app.blueprints.sentiment_bp import bp as sentiment_bp
    from app.blueprints.notify_bp import bp as notify_bp
    from app.blueprints.kb_bp import bp as kb_bp
    from app.blueprints.reports_bp import bp as reports_bp
    from app.blueprints.docs_bp import bp as docs_bp
    from app.blueprints.skills_bp import bp as skills_bp

    app.register_blueprint(docs_bp, url_prefix="/api")
    app.register_blueprint(system_bp, url_prefix="/api/v1")
    app.register_blueprint(dashboard_bp, url_prefix="/api/v1")
    app.register_blueprint(compliance_bp, url_prefix="/api/v1")
    app.register_blueprint(lineage_bp, url_prefix="/api/v1")
    app.register_blueprint(research_bp, url_prefix="/api/v1")
    app.register_blueprint(sentiment_bp, url_prefix="/api/v1")
    app.register_blueprint(notify_bp, url_prefix="/api/v1")
    app.register_blueprint(kb_bp, url_prefix="/api/v1")
    app.register_blueprint(reports_bp, url_prefix="/api/v1")
    app.register_blueprint(skills_bp, url_prefix="/api/v1")

    return app
