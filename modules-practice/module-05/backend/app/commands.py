"""CLI命令"""
import click
from flask.cli import with_appcontext
from loguru import logger


@click.command('init-db')
@with_appcontext
def init_db():
    """初始化数据库
    
    使用方式:
        flask init-db
    """
    from app.extensions import db
    from app.models import Fund, FundNAV, FundHolding, FundManager
    from app.models import AnalysisTask, AnalysisResult, Report
    
    logger.info("开始初始化数据库...")
    
    try:
        # 创建所有表
        db.create_all()
        logger.info("数据库表创建成功")
        
        click.echo('数据库初始化成功!')
        
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        click.echo(f'数据库初始化失败: {e}')
        raise


@click.command('drop-db')
@with_appcontext
def drop_db():
    """删除所有数据库表
    
    使用方式:
        flask drop-db
    """
    from app.extensions import db
    
    if click.confirm('确定要删除所有数据库表吗?'):
        logger.warning("开始删除数据库表...")
        
        try:
            db.drop_all()
            logger.info("数据库表删除成功")
            click.echo('数据库表已删除!')
        except Exception as e:
            logger.error(f"数据库表删除失败: {e}")
            click.echo(f'数据库表删除失败: {e}')
            raise
