"""基金相关数据模型"""
from datetime import datetime
from typing import Optional, List
from app.extensions import db


class Fund(db.Model):
    """基金基本信息表"""
    __tablename__ = 'funds'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    code = db.Column(db.String(10), unique=True, nullable=False, index=True, comment='基金代码')
    name = db.Column(db.String(100), nullable=False, comment='基金名称')
    fund_type = db.Column(db.String(50), comment='基金类型')
    manager_id = db.Column(db.Integer, db.ForeignKey('fund_managers.id'), comment='基金经理ID')
    establish_date = db.Column(db.Date, comment='成立日期')
    scale = db.Column(db.DECIMAL(15, 2), comment='基金规模(元)')
    status = db.Column(db.String(20), default='active', comment='状态: active/inactive')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    # 关系
    manager = db.relationship('FundManager', backref='funds', lazy='joined')
    navs = db.relationship('FundNAV', backref='fund', lazy='dynamic', cascade='all, delete-orphan')
    holdings = db.relationship('FundHolding', backref='fund', lazy='dynamic', cascade='all, delete-orphan')
    
    __table_args__ = (
        db.Index('idx_fund_type', 'fund_type'),
        db.Index('idx_fund_status', 'status'),
    )
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'fund_type': self.fund_type,
            'manager_id': self.manager_id,
            'manager_name': self.manager.name if self.manager else None,
            'establish_date': self.establish_date.isoformat() if self.establish_date else None,
            'scale': float(self.scale) if self.scale else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class FundNAV(db.Model):
    """基金净值表"""
    __tablename__ = 'fund_nav'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    fund_code = db.Column(db.String(10), db.ForeignKey('funds.code'), nullable=False, comment='基金代码')
    date = db.Column(db.Date, nullable=False, index=True, comment='日期')
    nav = db.Column(db.DECIMAL(10, 4), comment='单位净值')
    accum_nav = db.Column(db.DECIMAL(10, 4), comment='累计净值')
    daily_return = db.Column(db.DECIMAL(10, 4), comment='日收益率')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    
    __table_args__ = (
        db.UniqueConstraint('fund_code', 'date', name='uk_fund_code_date'),
    )
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'fund_code': self.fund_code,
            'date': self.date.isoformat() if self.date else None,
            'nav': float(self.nav) if self.nav else None,
            'accum_nav': float(self.accum_nav) if self.accum_nav else None,
            'daily_return': float(self.daily_return) if self.daily_return else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class FundHolding(db.Model):
    """基金持仓表"""
    __tablename__ = 'fund_holdings'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    fund_code = db.Column(db.String(10), db.ForeignKey('funds.code'), nullable=False, comment='基金代码')
    stock_code = db.Column(db.String(10), nullable=False, comment='股票代码')
    stock_name = db.Column(db.String(100), nullable=False, comment='股票名称')
    holding_ratio = db.Column(db.DECIMAL(5, 2), comment='持仓比例(%)')
    holding_shares = db.Column(db.BigInteger, comment='持仓股数')
    market_value = db.Column(db.DECIMAL(15, 2), comment='市值')
    report_date = db.Column(db.Date, nullable=False, index=True, comment='报告期')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    
    __table_args__ = (
        db.Index('idx_fund_report', 'fund_code', 'report_date'),
    )
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'fund_code': self.fund_code,
            'stock_code': self.stock_code,
            'stock_name': self.stock_name,
            'holding_ratio': float(self.holding_ratio) if self.holding_ratio else None,
            'holding_shares': self.holding_shares,
            'market_value': float(self.market_value) if self.market_value else None,
            'report_date': self.report_date.isoformat() if self.report_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class FundManager(db.Model):
    """基金经理表"""
    __tablename__ = 'fund_managers'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    name = db.Column(db.String(100), nullable=False, comment='姓名')
    gender = db.Column(db.String(10), comment='性别')
    education = db.Column(db.String(200), comment='学历')
    experience_years = db.Column(db.Integer, comment='从业年限')
    biography = db.Column(db.Text, comment='简介')
    start_date = db.Column(db.Date, comment='开始管理基金日期')
    total_scale = db.Column(db.DECIMAL(15, 2), default=0, comment='管理总规模(元)')
    status = db.Column(db.String(20), default='active', comment='状态: active/inactive')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'gender': self.gender,
            'education': self.education,
            'experience_years': self.experience_years,
            'biography': self.biography,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'total_scale': float(self.total_scale) if self.total_scale else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
