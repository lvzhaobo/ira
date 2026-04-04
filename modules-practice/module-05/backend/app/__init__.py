"""Flask应用工厂"""
from flask import Flask
from typing import Optional

from app.config import config
from app.extensions import db, migrate, jwt, cors


def create_app(config_name: Optional[str] = None) -> Flask:
    """创建Flask应用实例
    
    Args:
        config_name: 配置环境名称 (development/testing/production)
        
    Returns:
        Flask应用实例
    """
    if config_name is None:
        config_name = 'default'
    
    # 创建Flask应用
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 初始化扩展
    init_extensions(app)
    
    # 注册蓝图
    register_blueprints(app)
    
    # 注册错误处理
    register_error_handlers(app)
    
    # 注册CLI命令
    register_commands(app)
    
    return app


def init_extensions(app: Flask) -> None:
    """初始化Flask扩展
    
    Args:
        app: Flask应用实例
    """
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS', '*')}}
    )


def register_blueprints(app: Flask) -> None:
    """注册蓝图
    
    Args:
        app: Flask应用实例
    """
    from app.routes.fund_routes import fund_bp
    from app.routes.analysis_routes import analysis_bp
    from app.routes.agent_routes import agent_bp
    
    api_prefix = app.config.get('API_PREFIX', '/api')
    
    app.register_blueprint(fund_bp, url_prefix=f'{api_prefix}/fund')
    app.register_blueprint(analysis_bp, url_prefix=f'{api_prefix}/analysis')
    app.register_blueprint(agent_bp, url_prefix=f'{api_prefix}/agent')


def register_error_handlers(app: Flask) -> None:
    """注册全局错误处理
    
    Args:
        app: Flask应用实例
    """
    from flask import jsonify
    from loguru import logger
    
    @app.errorhandler(400)
    def bad_request(error):
        """处理400错误"""
        return jsonify({
            'code': 400,
            'message': '请求参数错误',
            'data': None
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        """处理401错误"""
        return jsonify({
            'code': 401,
            'message': '未授权访问',
            'data': None
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        """处理403错误"""
        return jsonify({
            'code': 403,
            'message': '禁止访问',
            'data': None
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        """处理404错误"""
        return jsonify({
            'code': 404,
            'message': '资源不存在',
            'data': None
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """处理500错误"""
        logger.error(f"服务器内部错误: {error}")
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': '服务器内部错误',
            'data': None
        }), 500


def register_commands(app: Flask) -> None:
    """注册CLI命令
    
    Args:
        app: Flask应用实例
    """
    from app.commands import init_db
    
    app.cli.add_command(init_db)
