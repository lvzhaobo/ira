"""Agent基类"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime
from loguru import logger


class BaseAgent(ABC):
    """Agent抽象基类
    
    所有具体的Agent都应该继承此类并实现其抽象方法
    """
    
    def __init__(self, agent_type: str, agent_name: str):
        """初始化Agent
        
        Args:
            agent_type: Agent类型标识
            agent_name: Agent名称
        """
        self.agent_type = agent_type
        self.agent_name = agent_name
        self.created_at = datetime.now()
        logger.info(f"初始化Agent: {agent_name} ({agent_type})")
    
    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """执行Agent任务（必须由子类实现）
        
        Args:
            **kwargs: 任务参数
            
        Returns:
            执行结果字典
        """
        pass
    
    @abstractmethod
    def analyze(self, fund_code: str, **kwargs) -> Dict[str, Any]:
        """分析基金（必须由子类实现）
        
        Args:
            fund_code: 基金代码
            **kwargs: 分析参数
            
        Returns:
            分析结果字典
        """
        pass
    
    def get_status(self) -> Dict[str, Any]:
        """获取Agent状态
        
        Returns:
            Agent状态信息
        """
        return {
            'agent_type': self.agent_type,
            'agent_name': self.agent_name,
            'created_at': self.created_at.isoformat(),
            'status': 'ready'
        }
    
    def validate_params(self, **kwargs) -> bool:
        """验证参数
        
        Args:
            **kwargs: 待验证的参数
            
        Returns:
            参数是否有效
        """
        # 子类可以重写此方法以实现自定义参数验证
        return True
    
    def format_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """格式化结果
        
        Args:
            result: 原始结果
            
        Returns:
            格式化后的结果
        """
        return {
            'agent_type': self.agent_type,
            'agent_name': self.agent_name,
            'timestamp': datetime.now().isoformat(),
            'result': result
        }
    
    def log_execution(self, message: str, level: str = 'info'):
        """记录执行日志
        
        Args:
            message: 日志消息
            level: 日志级别 (debug/info/warning/error)
        """
        log_func = getattr(logger, level, logger.info)
        log_func(f"[{self.agent_name}] {message}")
    
    def handle_error(self, error: Exception, context: str = '') -> Dict[str, Any]:
        """处理错误
        
        Args:
            error: 异常对象
            context: 错误上下文
            
        Returns:
            错误信息字典
        """
        error_msg = f"{context}: {str(error)}" if context else str(error)
        logger.error(f"[{self.agent_name}] {error_msg}")
        
        return {
            'agent_type': self.agent_type,
            'agent_name': self.agent_name,
            'status': 'error',
            'error': error_msg,
            'timestamp': datetime.now().isoformat()
        }
