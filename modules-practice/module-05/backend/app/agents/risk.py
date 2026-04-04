"""风险评估Agent - 评估基金风险水平"""
from typing import Any, Dict
from datetime import datetime
from loguru import logger

from app.agents.base import BaseAgent
from app.models.fund import Fund, FundNAV
from app.extensions import db


class RiskAgent(BaseAgent):
    """风险评估Agent
    
    职责:
    - 计算波动率
    - 计算最大回撤
    - 计算VaR (Value at Risk)
    - 评估风险等级
    """
    
    def __init__(self):
        super().__init__('risk', '风险评估Agent')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        """执行风险评估任务"""
        fund_code = kwargs.get('fund_code')
        if not fund_code:
            raise ValueError('基金代码不能为空')
        
        self.log_execution(f"开始风险评估: {fund_code}")
        
        try:
            result = self.analyze(fund_code, **kwargs)
            self.log_execution("风险评估完成")
            return self.format_result(result)
        except Exception as e:
            return self.handle_error(e, "风险评估失败")
    
    def analyze(self, fund_code: str, **kwargs) -> Dict[str, Any]:
        """分析基金风险
        
        Args:
            fund_code: 基金代码
            **kwargs: 分析参数
                period: 分析周期
                
        Returns:
            风险评估结果
        """
        period = kwargs.get('period', '1y')
        
        # 获取基金信息
        fund = Fund.query.filter_by(code=fund_code).first()
        if not fund:
            raise ValueError(f'基金不存在: {fund_code}')
        
        # 获取净值数据（需要更长时间序列的数据）
        nav_data = self._get_nav_data(fund_code, period)
        
        if not nav_data or len(nav_data) < 30:
            return {
                'fund_code': fund_code,
                'fund_name': fund.name,
                'period': period,
                'status': 'insufficient_data',
                'message': '数据不足，无法进行风险评估'
            }
        
        # 计算风险指标
        risk_metrics = self._calculate_risk_metrics(nav_data)
        
        # 评估风险等级
        risk_level = self._assess_risk_level(risk_metrics)
        
        result = {
            'fund_code': fund_code,
            'fund_name': fund.name,
            'period': period,
            'risk_metrics': risk_metrics,
            'risk_level': risk_level,
            'analysis_time': datetime.now().isoformat()
        }
        
        return result
    
    def _get_nav_data(self, fund_code: str, period: str) -> list:
        """获取净值数据"""
        from datetime import timedelta
        
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
        
        navs = FundNAV.query.filter(
            FundNAV.fund_code == fund_code,
            FundNAV.date >= start_date
        ).order_by(FundNAV.date).all()
        
        return [nav.to_dict() for nav in navs]
    
    def _calculate_risk_metrics(self, nav_data: list) -> Dict[str, Any]:
        """计算风险指标
        
        Args:
            nav_data: 净值数据
            
        Returns:
            风险指标
        """
        # TODO: 实现详细的风险指标计算
        # 这里返回示例数据结构
        
        navs = [float(item['nav']) for item in nav_data]
        
        # 计算日收益率
        daily_returns = []
        for i in range(1, len(navs)):
            daily_return = (navs[i] - navs[i-1]) / navs[i-1]
            daily_returns.append(daily_return)
        
        # 最大回撤计算
        max_drawdown = self._calculate_max_drawdown(navs)
        
        return {
            'volatility': None,  # 年化波动率
            'max_drawdown': max_drawdown,  # 最大回撤
            'var_95': None,  # 95% VaR
            'var_99': None,  # 99% VaR
            'downside_risk': None,  # 下行风险
            'beta': None,  # Beta系数
            'alpha': None,  # Alpha系数
        }
    
    def _calculate_max_drawdown(self, navs: list) -> float:
        """计算最大回撤
        
        Args:
            navs: 净值列表
            
        Returns:
            最大回撤百分比
        """
        if not navs:
            return 0.0
        
        peak = navs[0]
        max_dd = 0.0
        
        for nav in navs:
            if nav > peak:
                peak = nav
            drawdown = (peak - nav) / peak
            if drawdown > max_dd:
                max_dd = drawdown
        
        return round(max_dd * 100, 2)
    
    def _assess_risk_level(self, risk_metrics: Dict) -> str:
        """评估风险等级
        
        Args:
            risk_metrics: 风险指标
            
        Returns:
            风险等级 (low/medium/high/very_high)
        """
        # TODO: 实现风险等级评估逻辑
        return 'medium'
