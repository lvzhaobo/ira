"""基金业务服务"""
from typing import Optional, List, Dict, Any
from loguru import logger

from app.models.fund import Fund, FundNAV, FundHolding, FundManager
from app.extensions import db


class FundService:
    """基金业务服务
    
    提供基金相关的业务逻辑处理
    """
    
    @staticmethod
    def search_funds(
        keyword: str = '',
        fund_type: str = '',
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """搜索基金
        
        Args:
            keyword: 搜索关键词
            fund_type: 基金类型
            page: 页码
            page_size: 每页数量
            
        Returns:
            搜索结果
        """
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
        
        pagination = query.order_by(Fund.code).paginate(
            page=page,
            per_page=page_size,
            error_out=False
        )
        
        return {
            'list': [fund.to_dict() for fund in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size,
            'pages': pagination.pages
        }
    
    @staticmethod
    def get_fund_detail(fund_code: str) -> Optional[Dict[str, Any]]:
        """获取基金详情
        
        Args:
            fund_code: 基金代码
            
        Returns:
            基金详情
        """
        fund = Fund.query.filter_by(code=fund_code).first()
        
        if not fund:
            return None
        
        fund_data = fund.to_dict()
        
        # 获取最新净值
        latest_nav = FundNAV.query.filter_by(fund_code=fund_code).order_by(
            FundNAV.date.desc()
        ).first()
        
        if latest_nav:
            fund_data['latest_nav'] = latest_nav.to_dict()
        
        # 获取基金经理
        if fund.manager:
            fund_data['manager'] = fund.manager.to_dict()
        
        return fund_data
    
    @staticmethod
    def get_fund_nav_history(
        fund_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        page_size: int = 30
    ) -> Dict[str, Any]:
        """获取基金净值历史
        
        Args:
            fund_code: 基金代码
            start_date: 开始日期
            end_date: 结束日期
            page: 页码
            page_size: 每页数量
            
        Returns:
            净值历史
        """
        query = FundNAV.query.filter_by(fund_code=fund_code)
        
        if start_date:
            query = query.filter(FundNAV.date >= start_date)
        if end_date:
            query = query.filter(FundNAV.date <= end_date)
        
        pagination = query.order_by(FundNAV.date.desc()).paginate(
            page=page,
            per_page=page_size,
            error_out=False
        )
        
        return {
            'list': [nav.to_dict() for nav in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    
    @staticmethod
    def get_fund_holdings(
        fund_code: str,
        report_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """获取基金持仓
        
        Args:
            fund_code: 基金代码
            report_date: 报告期
            
        Returns:
            持仓列表
        """
        query = FundHolding.query.filter_by(fund_code=fund_code)
        
        if report_date:
            query = query.filter_by(report_date=report_date)
        
        holdings = query.order_by(FundHolding.holding_ratio.desc()).all()
        
        return [holding.to_dict() for holding in holdings]
    
    @staticmethod
    def get_fund_statistics(fund_code: str) -> Dict[str, Any]:
        """获取基金统计数据
        
        Args:
            fund_code: 基金代码
            
        Returns:
            统计数据
        """
        fund = Fund.query.filter_by(code=fund_code).first()
        if not fund:
            return {}
        
        # 统计净值数量
        nav_count = FundNAV.query.filter_by(fund_code=fund_code).count()
        
        # 统计持仓数量
        holding_count = FundHolding.query.filter_by(fund_code=fund_code).count()
        
        return {
            'fund_code': fund_code,
            'fund_name': fund.name,
            'nav_records': nav_count,
            'holding_records': holding_count,
            'fund_type': fund.fund_type,
            'status': fund.status
        }
