"""
M2 Glue Coding Flask 应用工厂

【来源】参考 ira-vin-mocks/app.py 的 create_app 模式
【说明】创建 Flask 应用并注册 ingest Blueprint
"""

from __future__ import annotations

import sys
from pathlib import Path

# 确保当前目录在 Python 路径中（支持直接运行和包导入）
_current_dir = Path(__file__).parent
if str(_current_dir) not in sys.path:
    sys.path.insert(0, str(_current_dir))

from flask import Flask

try:
    # 作为包导入
    from api_routes import ingest_bp
except ImportError:
    # 直接运行
    from api_routes import ingest_bp


def create_app() -> Flask:
    """
    创建 Flask 应用
    
    【来源】参考 ira-vin-mocks/app.py::create_app
    """
    app = Flask(__name__)
    
    # 注册 Blueprint（前缀 /api/v1/ingest）
    app.register_blueprint(ingest_bp)
    
    return app


# 便于直接运行: python -m flask --app m2_glue_production.app:create_app run
app = create_app()
