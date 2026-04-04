"""报告业务服务"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from loguru import logger

from app.models.analysis import Report, AnalysisTask
from app.extensions import db


class ReportService:
    """报告业务服务
    
    提供报告相关的业务逻辑处理
    """
    
    @staticmethod
    def create_report(
        task_id: int,
        fund_code: str,
        report_type: str,
        title: str,
        content: str = '',
        summary: str = ''
    ) -> Report:
        """创建报告
        
        Args:
            task_id: 任务ID
            fund_code: 基金代码
            report_type: 报告类型
            title: 报告标题
            content: 报告内容
            summary: 报告摘要
            
        Returns:
            报告对象
        """
        report = Report(
            task_id=task_id,
            fund_code=fund_code,
            report_type=report_type,
            title=title,
            content=content,
            summary=summary,
            status='draft',
            created_at=datetime.now()
        )
        
        db.session.add(report)
        db.session.commit()
        
        logger.info(f"创建报告: id={report.id}, fund_code={fund_code}, type={report_type}")
        
        return report
    
    @staticmethod
    def get_report(report_id: int) -> Optional[Dict[str, Any]]:
        """获取报告详情
        
        Args:
            report_id: 报告ID
            
        Returns:
            报告详情
        """
        report = Report.query.get(report_id)
        
        if not report:
            return None
        
        return report.to_dict()
    
    @staticmethod
    def get_reports_list(
        fund_code: str = '',
        report_type: str = '',
        status: str = '',
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """获取报告列表
        
        Args:
            fund_code: 基金代码
            report_type: 报告类型
            status: 报告状态
            page: 页码
            page_size: 每页数量
            
        Returns:
            报告列表
        """
        query = Report.query
        
        if fund_code:
            query = query.filter_by(fund_code=fund_code)
        if report_type:
            query = query.filter_by(report_type=report_type)
        if status:
            query = query.filter_by(status=status)
        
        pagination = query.order_by(Report.created_at.desc()).paginate(
            page=page,
            per_page=page_size,
            error_out=False
        )
        
        return {
            'list': [report.to_dict() for report in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    
    @staticmethod
    def update_report(
        report_id: int,
        title: str = None,
        content: str = None,
        summary: str = None,
        status: str = None
    ) -> Optional[Dict[str, Any]]:
        """更新报告
        
        Args:
            report_id: 报告ID
            title: 标题
            content: 内容
            summary: 摘要
            status: 状态
            
        Returns:
            更新后的报告
        """
        report = Report.query.get(report_id)
        
        if not report:
            return None
        
        if title is not None:
            report.title = title
        if content is not None:
            report.content = content
        if summary is not None:
            report.summary = summary
        if status is not None:
            report.status = status
        
        report.updated_at = datetime.now()
        
        db.session.commit()
        
        logger.info(f"更新报告: id={report_id}")
        
        return report.to_dict()
    
    @staticmethod
    def publish_report(report_id: int) -> Optional[Dict[str, Any]]:
        """发布报告
        
        Args:
            report_id: 报告ID
            
        Returns:
            发布后的报告
        """
        report = Report.query.get(report_id)
        
        if not report:
            return None
        
        report.status = 'published'
        report.updated_at = datetime.now()
        
        db.session.commit()
        
        logger.info(f"发布报告: id={report_id}")
        
        return report.to_dict()
    
    @staticmethod
    def delete_report(report_id: int) -> bool:
        """删除报告
        
        Args:
            report_id: 报告ID
            
        Returns:
            是否成功
        """
        report = Report.query.get(report_id)
        
        if not report:
            return False
        
        db.session.delete(report)
        db.session.commit()
        
        logger.info(f"删除报告: id={report_id}")
        
        return True
    
    @staticmethod
    def generate_report_from_task(task_id: int) -> Optional[Report]:
        """从分析任务生成报告
        
        Args:
            task_id: 任务ID
            
        Returns:
            生成的报告
        """
        task = AnalysisTask.query.get(task_id)
        
        if not task:
            return None
        
        if task.status != 'completed':
            raise ValueError('只有完成的任务才能生成报告')
        
        # TODO: 实现从分析结果生成报告的逻辑
        # 这里可以调用报告生成服务，整合各Agent的分析结果
        
        report = Report(
            task_id=task_id,
            fund_code=task.fund_code,
            report_type=task.task_type,
            title=f'{task.fund_code} {task.task_name}',
            content='',  # 从分析结果生成
            summary='',  # 从分析结果生成
            status='draft',
            created_at=datetime.now()
        )
        
        db.session.add(report)
        db.session.commit()
        
        logger.info(f"从任务生成报告: task_id={task_id}, report_id={report.id}")
        
        return report
