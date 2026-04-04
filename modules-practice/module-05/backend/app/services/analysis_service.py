"""分析业务服务"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from loguru import logger

from app.models.analysis import AnalysisTask, AnalysisResult
from app.extensions import db
from app.agents.coordinator import CoordinatorAgent


class AnalysisService:
    """分析业务服务
    
    提供分析任务相关的业务逻辑处理
    """
    
    @staticmethod
    def create_analysis_task(
        fund_code: str,
        task_type: str = 'comprehensive',
        task_name: str = '',
        params: Dict = None
    ) -> AnalysisTask:
        """创建分析任务
        
        Args:
            fund_code: 基金代码
            task_type: 任务类型
            task_name: 任务名称
            params: 任务参数
            
        Returns:
            分析任务对象
        """
        if not task_name:
            task_name = f'{task_type}分析'
        
        task = AnalysisTask(
            fund_code=fund_code,
            task_name=task_name,
            task_type=task_type,
            status='pending',
            progress=0,
            params=str(params or {}),
            created_at=datetime.now()
        )
        
        db.session.add(task)
        db.session.commit()
        
        logger.info(f"创建分析任务: id={task.id}, fund_code={fund_code}, type={task_type}")
        
        return task
    
    @staticmethod
    def execute_analysis_task(task_id: int) -> Dict[str, Any]:
        """执行分析任务
        
        Args:
            task_id: 任务ID
            
        Returns:
            执行结果
        """
        task = AnalysisTask.query.get(task_id)
        
        if not task:
            raise ValueError(f'任务不存在: {task_id}')
        
        if task.status not in ['pending', 'failed']:
            raise ValueError(f'任务状态不允许执行: {task.status}')
        
        # 更新任务状态为运行中
        task.status = 'running'
        task.started_at = datetime.now()
        task.progress = 0
        db.session.commit()
        
        try:
            # 创建协调Agent并执行分析
            coordinator = CoordinatorAgent()
            
            # 解析任务参数
            import json
            params = json.loads(task.params) if task.params else {}
            params['fund_code'] = task.fund_code
            params['task_type'] = task.task_type
            
            # 执行分析
            result = coordinator.execute(**params)
            
            # 保存分析结果
            AnalysisService._save_analysis_result(task_id, result)
            
            # 更新任务状态
            task.status = 'completed'
            task.progress = 100
            task.completed_at = datetime.now()
            db.session.commit()
            
            logger.info(f"分析任务完成: id={task_id}")
            
            return result
            
        except Exception as e:
            logger.error(f"分析任务失败: id={task_id}, error={e}")
            
            # 更新任务状态为失败
            task.status = 'failed'
            task.error_message = str(e)
            task.completed_at = datetime.now()
            db.session.commit()
            
            raise
    
    @staticmethod
    def _save_analysis_result(task_id: int, result: Dict[str, Any]):
        """保存分析结果
        
        Args:
            task_id: 任务ID
            result: 分析结果
        """
        import json
        
        # 保存整体结果
        overall_result = AnalysisResult(
            task_id=task_id,
            agent_type='coordinator',
            result_data=json.dumps(result, ensure_ascii=False),
            summary=result.get('result', {}).get('integrated_result', {}).get('summary', ''),
            status='success',
            created_at=datetime.now()
        )
        
        db.session.add(overall_result)
        
        # 保存各Agent的结果
        results = result.get('result', {}).get('results', {})
        for agent_type, agent_result in results.items():
            agent_result_record = AnalysisResult(
                task_id=task_id,
                agent_type=agent_type,
                result_data=json.dumps(agent_result, ensure_ascii=False),
                summary='',
                status='success',
                created_at=datetime.now()
            )
            db.session.add(agent_result_record)
        
        db.session.commit()
    
    @staticmethod
    def get_task_status(task_id: int) -> Optional[Dict[str, Any]]:
        """获取任务状态
        
        Args:
            task_id: 任务ID
            
        Returns:
            任务状态信息
        """
        task = AnalysisTask.query.get(task_id)
        
        if not task:
            return None
        
        return task.to_dict()
    
    @staticmethod
    def get_task_results(task_id: int) -> List[Dict[str, Any]]:
        """获取任务结果
        
        Args:
            task_id: 任务ID
            
        Returns:
            分析结果列表
        """
        results = AnalysisResult.query.filter_by(task_id=task_id).all()
        
        return [result.to_dict() for result in results]
    
    @staticmethod
    def get_tasks_list(
        fund_code: str = '',
        status: str = '',
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """获取任务列表
        
        Args:
            fund_code: 基金代码
            status: 任务状态
            page: 页码
            page_size: 每页数量
            
        Returns:
            任务列表
        """
        query = AnalysisTask.query
        
        if fund_code:
            query = query.filter_by(fund_code=fund_code)
        if status:
            query = query.filter_by(status=status)
        
        pagination = query.order_by(AnalysisTask.created_at.desc()).paginate(
            page=page,
            per_page=page_size,
            error_out=False
        )
        
        return {
            'list': [task.to_dict() for task in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    
    @staticmethod
    def cancel_task(task_id: int) -> bool:
        """取消任务
        
        Args:
            task_id: 任务ID
            
        Returns:
            是否成功
        """
        task = AnalysisTask.query.get(task_id)
        
        if not task:
            return False
        
        if task.status in ['completed', 'failed']:
            return False
        
        task.status = 'failed'
        task.error_message = '用户主动取消'
        task.updated_at = datetime.now()
        
        db.session.commit()
        
        logger.info(f"取消分析任务: id={task_id}")
        
        return True
