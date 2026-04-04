"""分析相关数据模型"""
from datetime import datetime
from typing import Optional, List
from app.extensions import db


class AnalysisTask(db.Model):
    """分析任务表"""
    __tablename__ = 'analysis_tasks'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    fund_code = db.Column(db.String(10), nullable=False, index=True, comment='基金代码')
    task_name = db.Column(db.String(100), comment='任务名称')
    task_type = db.Column(db.String(50), nullable=False, comment='任务类型: comprehensive/performance/risk/portfolio/manager/market')
    status = db.Column(db.String(20), default='pending', comment='状态: pending/running/completed/failed')
    progress = db.Column(db.Integer, default=0, comment='进度: 0-100')
    params = db.Column(db.Text, comment='任务参数(JSON)')
    error_message = db.Column(db.Text, comment='错误信息')
    started_at = db.Column(db.DateTime, comment='开始时间')
    completed_at = db.Column(db.DateTime, comment='完成时间')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    # 关系
    results = db.relationship('AnalysisResult', backref='task', lazy='dynamic', cascade='all, delete-orphan')
    
    __table_args__ = (
        db.Index('idx_task_status', 'status'),
        db.Index('idx_task_created', 'created_at'),
    )
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'fund_code': self.fund_code,
            'task_name': self.task_name,
            'task_type': self.task_type,
            'status': self.status,
            'progress': self.progress,
            'params': self.params,
            'error_message': self.error_message,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class AnalysisResult(db.Model):
    """分析结果表"""
    __tablename__ = 'analysis_results'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    task_id = db.Column(db.Integer, db.ForeignKey('analysis_tasks.id'), nullable=False, comment='任务ID')
    agent_type = db.Column(db.String(50), nullable=False, comment='Agent类型: coordinator/performance/risk/portfolio/manager/market')
    result_data = db.Column(db.Text, comment='分析结果数据(JSON)')
    summary = db.Column(db.Text, comment='分析摘要')
    score = db.Column(db.DECIMAL(5, 2), comment='评分')
    status = db.Column(db.String(20), default='success', comment='状态: success/failed')
    error_message = db.Column(db.Text, comment='错误信息')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    
    __table_args__ = (
        db.Index('idx_result_task', 'task_id'),
        db.Index('idx_result_agent', 'agent_type'),
    )
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'task_id': self.task_id,
            'agent_type': self.agent_type,
            'result_data': self.result_data,
            'summary': self.summary,
            'score': float(self.score) if self.score else None,
            'status': self.status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Report(db.Model):
    """报告表"""
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    task_id = db.Column(db.Integer, db.ForeignKey('analysis_tasks.id'), comment='任务ID')
    fund_code = db.Column(db.String(10), nullable=False, index=True, comment='基金代码')
    report_type = db.Column(db.String(50), nullable=False, comment='报告类型: comprehensive/performance/risk/portfolio')
    title = db.Column(db.String(200), nullable=False, comment='报告标题')
    content = db.Column(db.Text, comment='报告内容(Markdown/HTML)')
    summary = db.Column(db.Text, comment='报告摘要')
    file_path = db.Column(db.String(500), comment='文件路径')
    status = db.Column(db.String(20), default='draft', comment='状态: draft/published/archived')
    created_by = db.Column(db.String(50), comment='创建者')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    # 关系
    task = db.relationship('AnalysisTask', backref='reports', lazy='joined')
    
    __table_args__ = (
        db.Index('idx_report_type', 'report_type'),
        db.Index('idx_report_status', 'status'),
    )
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'task_id': self.task_id,
            'fund_code': self.fund_code,
            'report_type': self.report_type,
            'title': self.title,
            'content': self.content,
            'summary': self.summary,
            'file_path': self.file_path,
            'status': self.status,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
