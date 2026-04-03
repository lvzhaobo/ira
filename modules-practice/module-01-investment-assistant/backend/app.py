import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

# 加载环境变量
load_dotenv()


def create_app():
    app = Flask(__name__)

    # 配置 CORS
    CORS(app)

    # 配置数据目录
    data_dir = os.getenv("DATA_DIR", "./data")
    os.makedirs(data_dir, exist_ok=True)
    app.config["DATA_DIR"] = data_dir

    # 注册 Blueprint
    from blueprints.agent_bp import agent_bp

    app.register_blueprint(agent_bp, url_prefix="/api/v1/agent")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
