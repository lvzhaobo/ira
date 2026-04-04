"""业绩分析Agent - 分析基金业绩表现"""
from typing import Any, Dict
from datetime import datetime, timedelta
from loguru import logger

from app.agents.base import BaseAgent
from app.models.fund import Fund, FundNAV
from app.extensions import db


class PerformanceAgent(BaseAgent):
    """业绩分析Agent
    
    职责:
    - 计算基金收益率（日/周/月/年）
    - 分析基金业绩排名
    - 进行业绩归因分析
    - 对比基准指数
    """
    
    def __init__(self):
        super().__init__('performance', '业绩分析Agent')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        """执行业绩分析任务"""
        fund_code = kwargs.get('fund_code')
        if not fund_code:
            raise ValueError('基金代码不能为空')
        
        self.log_execution(f"开始业绩分析: {fund_code}")
        
        try:
            result = self.analyze(fund_code, **kwargs)
            self.log_execution("业绩分析完成")
            return self.format_result(result)
        except Exception as e:
            return self.handle_error(e, "业绩分析失败")
    
    def analyze(self, fund_code: str, **kwargs) -> Dict[str, Any]:
        """分析基金业绩
        
        Args:
            fund_code: 基金代码
            **kwargs: 分析参数
                period: 分析周期 (1m/3m/6m/1y/3y/5y)
                
        Returns:
            业绩分析结果
        """
        period = kwargs.get('period', '1y')
        
        # 获取基金信息
        fund = Fund.query.filter_by(code=fund_code).first()
        if not fund:
            raise ValueError(f'基金不存在: {fund_code}')
        
        # 获取净值数据
        nav_data = self._get_nav_data(fund_code, period)
        
        if not nav_data:
            return {
                'fund_code': fund_code,
                'fund_name': fund.name,
                'period': period,
                'status': 'no_data',
                'message': '暂无净值数据'
            }
        
        # 计算收益率指标
        returns = self._calculate_returns(nav_data)
        
        # 计算风险调整收益
        risk_adjusted = self._calculate_risk_adjusted_returns(nav_data)
        
        result = {
            'fund_code': fund_code,
            'fund_name': fund.name,
            'period': period,
            'nav_data': nav_data,
            'returns': returns,
            'risk_adjusted_returns': risk_adjusted,
            'analysis_time': datetime.now().isoformat()
        }
        
        return result
    
    def _get_nav_data(self, fund_code: str, period: str) -> list:
        """获取净值数据
        
        Args:
            fund_code: 基金代码
            period: 分析周期
            
        Returns:
            净值数据列表
        """
        # 计算起始日期
        period_days = {
            '1m': 30,
            '3m': 90,
            '6m': 180,
            '1y': 365,
            '3y': 1095,
            '5y': 1825
        }
        
        days = period_days.get(period, 365)
        start_date = datetime.now() - timedelta(days=days)
        
        # 查询净值数据
        navs = FundNAV.query.filter(
            FundNAV.fund_code == fund_code,
            FundNAV.date >= start_date
        ).order_by(FundNAV.date).all()
        
        return [nav.to_dict() for nav in navs]
    
    def _calculate_returns(self, nav_data: list) -> Dict[str, float]:
        """计算收益率指标
        
        Args:
            nav_data: 净值数据
            
        Returns:
            收益率指标
        """
        if len(nav_data) < 2:
            return {}
        
        first_nav = float(nav_data[0]['nav'])
        last_nav = float(nav_data[-1]['nav'])
        
        # 总收益率
        total_return = (last_nav - first_nav) / first_nav * 100
        
        # 年化收益率
        days = (datetime.fromisoformat(nav_data[-1]['date']) - 
                datetime.fromisoformat(nav_data[0]['date'])).days
        annual_return = ((last_nav / first_nav) ** (365 / days) - 1) * 100 if days > 0 else 0
        
        return {
            'total_return': round(total_return, 2),
            'annual_return': round(annual_return, 2),
            'start_nav': first_nav,
            'end_nav': last_nav,
            'days': days
        }
    
    def _calculate_risk_adjusted_returns(self, nav_data: list) -> Dict[str, float]:
        """计算风险调整收益指标
        
        Args:
            nav_data: 净值数据
            
        Returns:
            风险调整收益指标
        """
        # TODO: 实现夏普比率、索提诺比率等计算
        # 这里返回示例数据
        
        return {
            'sharpe_ratio': None,
            'sortino_ratio': None,
            'max_drawdown': None,
            'volatility': None
        }
