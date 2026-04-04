"""路由模块"""
from app.routes.fund_routes import fund_bp
from app.routes.analysis_routes import analysis_bp
from app.routes.agent_routes import agent_bp

__all__ = ['fund_bp', 'analysis_bp', 'agent_bp']
