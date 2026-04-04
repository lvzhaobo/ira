"""分析相关路由"""
from flask import Blueprint, request, jsonify
from functools import wraps
from datetime import datetime
from loguru import logger

from app.extensions import db
from app.models.analysis import AnalysisTask, AnalysisResult, Report

analysis_bp = Blueprint('analysis', __name__)


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


@analysis_bp.route('/start', methods=['POST'])
@handle_errors
def start_analysis():
    """启动分析任务
    
    Request Body:
        fund_code: 基金代码 (必填)
        task_type: 任务类型 (comprehensive/performance/risk/portfolio/manager/market)
        task_name: 任务名称 (可选)
        params: 任务参数 (可选, JSON)
    """
    data = request.get_json()
    
    # 参数验证
    if not data:
        raise ValueError('请求体不能为空')
    
    fund_code = data.get('fund_code', '').strip()
    if not fund_code:
        raise ValueError('基金代码不能为空')
    
    task_type = data.get('task_type', 'comprehensive')
    valid_types = ['comprehensive', 'performance', 'risk', 'portfolio', 'manager', 'market']
    if task_type not in valid_types:
        raise ValueError(f'任务类型必须是以下之一: {", ".join(valid_types)}')
    
    task_name = data.get('task_name', f'{task_type}分析')
    params = data.get('params', {})
    
    # 创建分析任务
    task = AnalysisTask(
        fund_code=fund_code,
        task_name=task_name,
        task_type=task_type,
        status='pending',
        progress=0,
        params=str(params),
        created_at=datetime.now()
    )
    
    db.session.add(task)
    db.session.commit()
    
    logger.info(f"创建分析任务成功: task_id={task.id}, fund_code={fund_code}, type={task_type}")
    
    # TODO: 这里应该触发Agent分析流程
    # 目前仅创建任务，实际分析逻辑在services中实现
    
    return jsonify({
        'code': 0,
        'message': '分析任务已创建',
        'data': task.to_dict()
    }), 201


@analysis_bp.route('/<int:task_id>', methods=['GET'])
@handle_errors
def get_analysis_status(task_id: int):
    """查询分析任务状态和进度
    
    Args:
        task_id: 任务ID
    """
    task = AnalysisTask.query.get(task_id)
    
    if not task:
        return jsonify({'code': 404, 'message': '任务不存在', 'data': None}), 404
    
    task_data = task.to_dict()
    
    # 获取分析结果
    results = AnalysisResult.query.filter_by(task_id=task_id).all()
    task_data['results'] = [result.to_dict() for result in results]
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': task_data
    })


@analysis_bp.route('/tasks', methods=['GET'])
@handle_errors
def get_analysis_tasks():
    """获取分析任务列表
    
    Query Parameters:
        fund_code: 基金代码 (可选)
        status: 任务状态 (可选)
        page: 页码
        page_size: 每页数量
    """
    fund_code = request.args.get('fund_code', '').strip()
    status = request.args.get('status', '').strip()
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    
    # 构建查询
    query = AnalysisTask.query
    
    if fund_code:
        query = query.filter_by(fund_code=fund_code)
    if status:
        query = query.filter_by(status=status)
    
    # 分页查询
    pagination = query.order_by(AnalysisTask.created_at.desc()).paginate(
        page=page,
        per_page=page_size,
        error_out=False
    )
    
    tasks = [task.to_dict() for task in pagination.items]
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': {
            'list': tasks,
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@analysis_bp.route('/<int:task_id>/results', methods=['GET'])
@handle_errors
def get_analysis_results(task_id: int):
    """获取分析结果详情
    
    Args:
        task_id: 任务ID
    """
    task = AnalysisTask.query.get(task_id)
    if not task:
        return jsonify({'code': 404, 'message': '任务不存在', 'data': None}), 404
    
    agent_type = request.args.get('agent_type', '').strip()
    
    # 构建查询
    query = AnalysisResult.query.filter_by(task_id=task_id)
    
    if agent_type:
        query = query.filter_by(agent_type=agent_type)
    
    results = query.order_by(AnalysisResult.created_at).all()
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': [result.to_dict() for result in results]
    })


@analysis_bp.route('/<int:task_id>/cancel', methods=['POST'])
@handle_errors
def cancel_analysis(task_id: int):
    """取消分析任务
    
    Args:
        task_id: 任务ID
    """
    task = AnalysisTask.query.get(task_id)
    
    if not task:
        return jsonify({'code': 404, 'message': '任务不存在', 'data': None}), 404
    
    if task.status in ['completed', 'failed']:
        raise ValueError('该任务已完成或失败，无法取消')
    
    task.status = 'failed'
    task.error_message = '用户主动取消'
    task.updated_at = datetime.now()
    
    db.session.commit()
    
    logger.info(f"取消分析任务: task_id={task_id}")
    
    return jsonify({
        'code': 0,
        'message': '任务已取消',
        'data': task.to_dict()
    })
