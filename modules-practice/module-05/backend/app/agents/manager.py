"""基金经理Agent - 分析基金经理能力和风格"""
from typing import Any, Dict
from datetime import datetime
from loguru import logger

from app.agents.base import BaseAgent
from app.models.fund import Fund, FundManager
from app.extensions import db


class ManagerAgent(BaseAgent):
    """基金经理Agent
    
    职责:
    - 分析基金经理从业经历
    - 评估管理业绩
    - 识别投资风格
    - 评估管理能力
    """
    
    def __init__(self):
        super().__init__('manager', '基金经理Agent')
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        """执行基金经理分析任务"""
        fund_code = kwargs.get('fund_code')
        if not fund_code:
            raise ValueError('基金代码不能为空')
        
        self.log_execution(f"开始基金经理分析: {fund_code}")
        
        try:
            result = self.analyze(fund_code, **kwargs)
            self.log_execution("基金经理分析完成")
            return self.format_result(result)
        except Exception as e:
            return self.handle_error(e, "基金经理分析失败")
    
    def analyze(self, fund_code: str, **kwargs) -> Dict[str, Any]:
        """分析基金经理
        
        Args:
            fund_code: 基金代码
            **kwargs: 分析参数
            
        Returns:
            基金经理分析结果
        """
        # 获取基金信息
        fund = Fund.query.filter_by(code=fund_code).first()
        if not fund:
            raise ValueError(f'基金不存在: {fund_code}')
        
        # 获取基金经理信息
        manager = fund.manager
        if not manager:
            return {
                'fund_code': fund_code,
                'fund_name': fund.name,
                'status': 'no_manager',
                'message': '暂无基金经理信息'
            }
        
        # 分析经理信息
        manager_profile = self._analyze_manager_profile(manager)
        
        # 评估管理能力
        management_ability = self._evaluate_management_ability(manager)
        
        result = {
            'fund_code': fund_code,
            'fund_name': fund.name,
            'manager': manager_profile,
            'management_ability': management_ability,
            'analysis_time': datetime.now().isoformat()
        }
        
        return result
    
    def _analyze_manager_profile(self, manager: FundManager) -> Dict[str, Any]:
        """分析基金经理档案
        
        Args:
            manager: 基金经理对象
            
        Returns:
            经理档案分析
        """
        # 计算从业年限
        experience_years = manager.experience_years or 0
        
        # 计算管理当前基金的年限
        management_years = None
        if manager.start_date:
            management_years = (datetime.now().date() - manager.start_date).days / 365.25
        
        return {
            'manager_id': manager.id,
            'name': manager.name,
            'gender': manager.gender,
            'education': manager.education,
            'experience_years': experience_years,
            'management_years': round(management_years, 1) if management_years else None,
            'biography': manager.biography,
            'total_scale': float(manager.total_scale) if manager.total_scale else None,
            'status': manager.status
        }
    
    def _evaluate_management_ability(self, manager: FundManager) -> Dict[str, Any]:
        """评估管理能力
        
        Args:
            manager: 基金经理对象
            
        Returns:
            管理能力评估
        """
        # TODO: 实现管理能力评估逻辑
        # 这里可以分析:
        # - 管理的所有基金业绩
        # - 超额收益能力
        # - 风险控制能力
        # - 投资风格稳定性
        
        return {
            'overall_rating': None,  # 综合评级
            'return_ability': None,  # 收益能力
            'risk_control_ability': None,  # 风险控制能力
            'style_stability': None,  # 风格稳定性
            'experience_level': self._classify_experience_level(manager.experience_years)
        }
    
    def _classify_experience_level(self, years: int) -> str:
        """分类经验水平
        
        Args:
            years: 从业年限
            
        Returns:
            经验水平
        """
        if not years:
            return 'unknown'
        elif years < 3:
            return 'junior'
        elif years < 7:
            return 'intermediate'
        elif years < 15:
            return 'senior'
        else:
            return 'veteran'
