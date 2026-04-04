"""持仓分析Agent - 分析基金持仓结构"""
from typing import Any, Dict
from datetime import datetime
from loguru import logger

from app.agents.base import BaseAgent
from app.models.fund import Fund, FundHolding
from app.extensions import db


class PortfolioAgent(BaseAgent):
    """持仓分析Agent
    
    职责:
    - 分析行业分布
    - 分析个股持仓
    - 计算持仓集中度
    - 分析持仓变化趋势
    """
    
    def __init__(self):
        super().__init__('portfolio', '持仓分析Agent')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        """执行持仓分析任务"""
        fund_code = kwargs.get('fund_code')
        if not fund_code:
            raise ValueError('基金代码不能为空')
        
        self.log_execution(f"开始持仓分析: {fund_code}")
        
        try:
            result = self.analyze(fund_code, **kwargs)
            self.log_execution("持仓分析完成")
            return self.format_result(result)
        except Exception as e:
            return self.handle_error(e, "持仓分析失败")
    
    def analyze(self, fund_code: str, **kwargs) -> Dict[str, Any]:
        """分析基金持仓
        
        Args:
            fund_code: 基金代码
            **kwargs: 分析参数
                report_date: 报告期
                
        Returns:
            持仓分析结果
        """
        report_date = kwargs.get('report_date')
        
        # 获取基金信息
        fund = Fund.query.filter_by(code=fund_code).first()
        if not fund:
            raise ValueError(f'基金不存在: {fund_code}')
        
        # 获取持仓数据
        holdings_data = self._get_holdings_data(fund_code, report_date)
        
        if not holdings_data:
            return {
                'fund_code': fund_code,
                'fund_name': fund.name,
                'report_date': report_date,
                'status': 'no_data',
                'message': '暂无持仓数据'
            }
        
        # 分析持仓结构
        portfolio_structure = self._analyze_portfolio_structure(holdings_data)
        
        # 计算集中度
        concentration = self._calculate_concentration(holdings_data)
        
        result = {
            'fund_code': fund_code,
            'fund_name': fund.name,
            'report_date': report_date,
            'holdings': holdings_data,
            'portfolio_structure': portfolio_structure,
            'concentration': concentration,
            'analysis_time': datetime.now().isoformat()
        }
        
        return result
    
    def _get_holdings_data(self, fund_code: str, report_date: str = None) -> list:
        """获取持仓数据
        
        Args:
            fund_code: 基金代码
            report_date: 报告期
            
        Returns:
            持仓数据列表
        """
        query = FundHolding.query.filter_by(fund_code=fund_code)
        
        if report_date:
            query = query.filter_by(report_date=report_date)
        
        # 获取最新报告期的持仓
        holdings = query.order_by(FundHolding.report_date.desc()).all()
        
        return [holding.to_dict() for holding in holdings]
    
    def _analyze_portfolio_structure(self, holdings: list) -> Dict[str, Any]:
        """分析持仓结构
        
        Args:
            holdings: 持仓数据
            
        Returns:
            持仓结构分析
        """
        if not holdings:
            return {}
        
        # 计算总持仓比例
        total_ratio = sum(float(h.get('holding_ratio', 0)) for h in holdings)
        
        # 按持仓比例排序
        sorted_holdings = sorted(
            holdings, 
            key=lambda x: float(x.get('holding_ratio', 0)), 
            reverse=True
        )
        
        # 前十大持仓
        top_10 = sorted_holdings[:10]
        top_10_ratio = sum(float(h.get('holding_ratio', 0)) for h in top_10)
        
        return {
            'total_holdings': len(holdings),
            'total_ratio': round(total_ratio, 2),
            'top_10_holdings': top_10,
            'top_10_ratio': round(top_10_ratio, 2),
            'avg_holding_ratio': round(total_ratio / len(holdings), 2) if holdings else 0
        }
    
    def _calculate_concentration(self, holdings: list) -> Dict[str, float]:
        """计算持仓集中度
        
        Args:
            holdings: 持仓数据
            
        Returns:
            集中度指标
        """
        if not holdings:
            return {}
        
        ratios = [float(h.get('holding_ratio', 0)) for h in holdings]
        
        # 前5大持仓集中度
        top_5_ratio = sum(sorted(ratios, reverse=True)[:5])
        
        # 前3大持仓集中度
        top_3_ratio = sum(sorted(ratios, reverse=True)[:3])
        
        # 最大持仓集中度
        max_ratio = max(ratios) if ratios else 0
        
        return {
            'top_3_concentration': round(top_3_ratio, 2),
            'top_5_concentration': round(top_5_ratio, 2),
            'max_single_concentration': round(max_ratio, 2),
            'herfindahl_index': round(sum(r**2 for r in ratios), 2)  # 赫芬达尔指数
        }
