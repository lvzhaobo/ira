"""协调Agent - 负责任务分配和结果整合"""
from typing import Any, Dict, List
from loguru import logger

from app.agents.base import BaseAgent
from app.agents.performance import PerformanceAgent
from app.agents.risk import RiskAgent
from app.agents.portfolio import PortfolioAgent
from app.agents.manager import ManagerAgent
from app.agents.market import MarketAgent


class CoordinatorAgent(BaseAgent):
    """协调Agent
    
    职责:
    - 接收分析任务
    - 分配任务给专业Agent
    - 整合各Agent的分析结果
    - 生成综合报告
    """
    
    def __init__(self):
        super().__init__('coordinator', '协调Agent')
        
        # 初始化专业Agent
        self.performance_agent = PerformanceAgent()
        self.risk_agent = RiskAgent()
        self.portfolio_agent = PortfolioAgent()
        self.manager_agent = ManagerAgent()
        self.market_agent = MarketAgent()
        
        # Agent映射
        self.agents_map = {
            'performance': self.performance_agent,
            'risk': self.risk_agent,
            'portfolio': self.portfolio_agent,
            'manager': self.manager_agent,
            'market': self.market_agent,
        }
        
        logger.info("协调Agent初始化完成")
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        """执行协调任务
        
        Args:
            **kwargs: 任务参数
                fund_code: 基金代码
                task_type: 任务类型
                params: 其他参数
                
        Returns:
            协调执行结果
        """
        fund_code = kwargs.get('fund_code')
        task_type = kwargs.get('task_type', 'comprehensive')
        
        if not fund_code:
            raise ValueError('基金代码不能为空')
        
        self.log_execution(f"开始执行协调任务: fund_code={fund_code}, type={task_type}")
        
        try:
            # 根据任务类型执行不同的分析流程
            if task_type == 'comprehensive':
                result = self._comprehensive_analysis(fund_code, kwargs)
            elif task_type in self.agents_map:
                result = self._single_analysis(fund_code, task_type, kwargs)
            else:
                raise ValueError(f'不支持的任务类型: {task_type}')
            
            self.log_execution("协调任务执行完成")
            return self.format_result(result)
            
        except Exception as e:
            return self.handle_error(e, "协调任务执行失败")
    
    def analyze(self, fund_code: str, **kwargs) -> Dict[str, Any]:
        """分析基金
        
        Args:
            fund_code: 基金代码
            **kwargs: 分析参数
            
        Returns:
            分析结果
        """
        return self.execute(fund_code=fund_code, **kwargs)
    
    def _comprehensive_analysis(self, fund_code: str, params: Dict) -> Dict[str, Any]:
        """执行综合分析（所有Agent协同）
        
        Args:
            fund_code: 基金代码
            params: 分析参数
            
        Returns:
            综合分析结果
        """
        self.log_execution("开始综合分析流程")
        
        results = {}
        
        # 并行或串行调用各专业Agent
        # 这里使用串行调用，实际可以改为并行
        
        # 1. 业绩分析
        self.log_execution("调用业绩分析Agent")
        results['performance'] = self.performance_agent.analyze(fund_code, **params)
        
        # 2. 风险评估
        self.log_execution("调用风险评估Agent")
        results['risk'] = self.risk_agent.analyze(fund_code, **params)
        
        # 3. 持仓分析
        self.log_execution("调用持仓分析Agent")
        results['portfolio'] = self.portfolio_agent.analyze(fund_code, **params)
        
        # 4. 基金经理分析
        self.log_execution("调用基金经理Agent")
        results['manager'] = self.manager_agent.analyze(fund_code, **params)
        
        # 5. 市场环境分析
        self.log_execution("调用市场环境Agent")
        results['market'] = self.market_agent.analyze(fund_code, **params)
        
        # 6. 整合结果
        integrated_result = self._integrate_results(results)
        
        return {
            'analysis_type': 'comprehensive',
            'fund_code': fund_code,
            'results': results,
            'integrated_result': integrated_result
        }
    
    def _single_analysis(self, fund_code: str, agent_type: str, params: Dict) -> Dict[str, Any]:
        """执行单项分析
        
        Args:
            fund_code: 基金代码
            agent_type: Agent类型
            params: 分析参数
            
        Returns:
            单项分析结果
        """
        agent = self.agents_map.get(agent_type)
        if not agent:
            raise ValueError(f'未知的Agent类型: {agent_type}')
        
        self.log_execution(f"调用{agent_type}Agent进行单项分析")
        result = agent.analyze(fund_code, **params)
        
        return {
            'analysis_type': agent_type,
            'fund_code': fund_code,
            'result': result
        }
    
    def _integrate_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """整合各Agent的分析结果
        
        Args:
            results: 各Agent的分析结果
            
        Returns:
            整合后的结果
        """
        # TODO: 实现结果整合逻辑
        # 这里可以添加:
        # - 综合评分计算
        # - 投资建议生成
        # - 风险提示汇总
        # - 关键发现提取
        
        integrated = {
            'summary': '综合分析完成',
            'overall_score': None,  # 综合评分
            'recommendation': '',  # 投资建议
            'key_findings': [],  # 关键发现
            'risks': [],  # 风险汇总
        }
        
        return integrated
    
    def get_status(self) -> Dict[str, Any]:
        """获取协调Agent状态"""
        status = super().get_status()
        status['agents'] = {
            name: agent.get_status() 
            for name, agent in self.agents_map.items()
        }
        return status
