"""基金相关路由"""
from flask import Blueprint, request, jsonify
from functools import wraps
from typing import Any
from loguru import logger

from app.extensions import db
from app.models.fund import Fund, FundNAV, FundHolding, FundManager

fund_bp = Blueprint('fund', __name__)


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


@fund_bp.route('/list', methods=['GET'])
@handle_errors
def get_fund_list():
    """获取基金列表（分页）
    
    Query Parameters:
        page: 页码（默认1）
        page_size: 每页数量（默认20）
        fund_type: 基金类型筛选
    """
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    fund_type = request.args.get('fund_type', '').strip()
    
    # 参数验证
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20
    
    # 构建查询
    query = Fund.query.filter_by(status='active')
    
    if fund_type:
        query = query.filter_by(fund_type=fund_type)
    
    # 分页查询
    pagination = query.order_by(Fund.code).paginate(
        page=page,
        per_page=page_size,
        error_out=False
    )
    
    funds = [fund.to_dict() for fund in pagination.items]
    
    logger.info(f"获取基金列表: page={page}, page_size={page_size}, total={pagination.total}")
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': {
            'list': funds,
            'total': pagination.total,
            'page': page,
            'page_size': page_size,
            'pages': pagination.pages
        }
    })


@fund_bp.route('/search', methods=['GET'])
@handle_errors
def search_funds():
    """搜索基金
    
    Query Parameters:
        keyword: 搜索关键词（基金代码或名称）
        fund_type: 基金类型
        page: 页码（默认1）
        page_size: 每页数量（默认10）
    """
    keyword = request.args.get('keyword', '').strip()
    fund_type = request.args.get('fund_type', '').strip()
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    
    # 参数验证
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 10
    
    # 构建查询
    query = Fund.query.filter_by(status='active')
    
    if keyword:
        query = query.filter(
            db.or_(
                Fund.code.contains(keyword),
                Fund.name.contains(keyword)
            )
        )
    
    if fund_type:
        query = query.filter_by(fund_type=fund_type)
    
    # 分页查询
    pagination = query.order_by(Fund.code).paginate(
        page=page,
        per_page=page_size,
        error_out=False
    )
    
    funds = [fund.to_dict() for fund in pagination.items]
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': {
            'list': funds,
            'total': pagination.total,
            'page': page,
            'page_size': page_size,
            'pages': pagination.pages
        }
    })


@fund_bp.route('/<string:fund_code>', methods=['GET'])
@handle_errors
def get_fund_detail(fund_code: str):
    """获取基金详情
    
    Args:
        fund_code: 基金代码
    """
    fund = Fund.query.filter_by(code=fund_code).first()
    
    if not fund:
        return jsonify({'code': 404, 'message': '基金不存在', 'data': None}), 404
    
    fund_data = fund.to_dict()
    
    # 获取最新净值
    latest_nav = FundNAV.query.filter_by(fund_code=fund_code).order_by(
        FundNAV.date.desc()
    ).first()
    
    if latest_nav:
        fund_data['latest_nav'] = latest_nav.to_dict()
    
    # 获取基金经理信息
    if fund.manager:
        fund_data['manager'] = fund.manager.to_dict()
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': fund_data
    })


@fund_bp.route('/<string:fund_code>/nav', methods=['GET'])
@handle_errors
def get_fund_nav(fund_code: str):
    """获取基金净值历史
    
    Args:
        fund_code: 基金代码
    
    Query Parameters:
        start_date: 开始日期
        end_date: 结束日期
        page: 页码
        page_size: 每页数量
    """
    # 验证基金是否存在
    fund = Fund.query.filter_by(code=fund_code).first()
    if not fund:
        return jsonify({'code': 404, 'message': '基金不存在', 'data': None}), 404
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 30, type=int)
    
    # 构建查询
    query = FundNAV.query.filter_by(fund_code=fund_code)
    
    if start_date:
        query = query.filter(FundNAV.date >= start_date)
    if end_date:
        query = query.filter(FundNAV.date <= end_date)
    
    # 分页查询
    pagination = query.order_by(FundNAV.date.desc()).paginate(
        page=page,
        per_page=page_size,
        error_out=False
    )
    
    navs = [nav.to_dict() for nav in pagination.items]
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': {
            'list': navs,
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@fund_bp.route('/<string:fund_code>/holdings', methods=['GET'])
@handle_errors
def get_fund_holdings(fund_code: str):
    """获取基金持仓
    
    Args:
        fund_code: 基金代码
    
    Query Parameters:
        report_date: 报告期
    """
    # 验证基金是否存在
    fund = Fund.query.filter_by(code=fund_code).first()
    if not fund:
        return jsonify({'code': 404, 'message': '基金不存在', 'data': None}), 404
    
    report_date = request.args.get('report_date')
    
    # 构建查询
    query = FundHolding.query.filter_by(fund_code=fund_code)
    
    if report_date:
        query = query.filter_by(report_date=report_date)
    
    holdings = query.order_by(FundHolding.holding_ratio.desc()).all()
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': [holding.to_dict() for holding in holdings]
    })


@fund_bp.route('/managers', methods=['GET'])
@handle_errors
def get_fund_managers():
    """获取基金经理列表
    
    Query Parameters:
        page: 页码
        page_size: 每页数量
    """
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    
    pagination = FundManager.query.filter_by(status='active').paginate(
        page=page,
        per_page=page_size,
        error_out=False
    )
    
    managers = [manager.to_dict() for manager in pagination.items]
    
    return jsonify({
        'code': 0,
        'message': 'success',
        'data': {
            'list': managers,
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })
