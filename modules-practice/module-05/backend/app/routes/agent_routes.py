"""Agent相关路由"""
from flask import Blueprint, request, jsonify
from functools import wraps
from loguru import logger

from app.agents.coordinator import CoordinatorAgent

agent_bp = Blueprint('agent', __name__)


def handle_errors(f):
    """错误处理装饰器"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning(f"参数错误: {e}")
            return jsonify({'code': 400, 'message': str(e), 'data': None}), 400
        except Exception as e:
            logger.error(f"服务器错误: {e}")
            return jsonify({'code': 500, 'message': '服务器内部错误', 'data': None}), 500
    return wrapper


@agent_bp.route('/chat', methods=['POST'])
@handle_errors
def agent_chat():
    """Agent对话接口
    
    Request Body:
        message: 用户消息 (必填)
        fund_code: 基金代码 (可选)
        agent_type: 指定Agent类型 (可选)
        conversation_id: 对话ID (可选, 用于多轮对话)
    """
    data = request.get_json()
    
    if not data:
        raise ValueError('请求体不能为空')
    
    message = data.get('message', '').strip()
    if not message:
        raise ValueError('消息内容不能为空')
    
    fund_code = data.get('fund_code', '').strip()
    agent_type = data.get('agent_type', 'coordinator')
    conversation_id = data.get('conversation_id')
    
    # TODO: 实现Agent对话逻辑
    # 目前返回示例响应
    response = {
        'reply': f'收到您的消息: {message}',
        'agent_type': agent_type,
        'fund_code': fund_code if fund_code else None,
        'conversation_id': conversation_id or 'conv_001',
        'suggestions': [
            '查看基金基本信息',
            '分析基金业绩',
            '评估基金风险',
            '分析持仓结构'
        ]
    }
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': response
    })


@agent_bp.route('/types', methods=['GET'])
@handle_errors
def get_agent_types():
    """获取可用的Agent类型列表"""
    agent_types = [
        {
            'type': 'coordinator',
            'name': '协调Agent',
            'description': '负责任务分配和结果整合',
            'capabilities': ['任务调度', '结果整合', '报告生成']
        },
        {
            'type': 'performance',
            'name': '业绩分析Agent',
            'description': '分析基金业绩表现',
            'capabilities': ['收益率分析', '排名分析', '业绩归因']
        },
        {
            'type': 'risk',
            'name': '风险评估Agent',
            'description': '评估基金风险水平',
            'capabilities': ['波动率分析', '最大回撤', '风险指标']
        },
        {
            'type': 'portfolio',
            'name': '持仓分析Agent',
            'description': '分析基金持仓结构',
            'capabilities': ['行业分布', '个股分析', '持仓集中度']
        },
        {
            'type': 'manager',
            'name': '基金经理Agent',
            'description': '分析基金经理能力和风格',
            'capabilities': ['从业经历', '管理业绩', '投资风格']
        },
        {
            'type': 'market',
            'name': '市场环境Agent',
            'description': '分析市场环境和对基金的影响',
            'capabilities': ['宏观分析', '行业趋势', '市场情绪']
        }
    ]
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': agent_types
    })
