"""数据模型"""
from app.extensions import db
from app.models.fund import Fund, FundNAV, FundHolding, FundManager
from app.models.analysis import AnalysisTask, AnalysisResult, Report

__all__ = [
    'db',
    'Fund',
    'FundNAV',
    'FundHolding',
    'FundManager',
    'AnalysisTask',
    'AnalysisResult',
    'Report'
]
