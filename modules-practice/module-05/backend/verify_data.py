"""快速验证脚本 - 检查数据库中的数据"""
from app import create_app
from app.models.fund import Fund, FundNAV, FundManager
from loguru import logger

def verify_data():
    """验证数据完整性"""
    app = create_app()
    
    with app.app_context():
        logger.info("=" * 60)
        logger.info("数据库数据验证")
        logger.info("=" * 60)
        
        # 统计信息
        fund_count = Fund.query.count()
        manager_count = FundManager.query.count()
        nav_count = FundNAV.query.count()
        
        logger.info(f"\n基础统计:")
        logger.info(f"  - 基金经理: {manager_count} 位")
        logger.info(f"  - 基金: {fund_count} 只")
        logger.info(f"  - 净值记录: {nav_count} 条")
        
        # 按类型统计基金
        logger.info(f"\n基金类型分布:")
        fund_types = db.session.query(Fund.fund_type, db.func.count(Fund.id)).group_by(Fund.fund_type).all()
        for fund_type, count in fund_types:
            logger.info(f"  - {fund_type}: {count} 只")
        
        # 显示部分基金示例
        logger.info(f"\n基金示例（前5只）:")
        funds = Fund.query.order_by(Fund.code).limit(5).all()
        for fund in funds:
            logger.info(f"  - {fund.code} {fund.name} ({fund.fund_type})")
        
        # 检查净值数据
        logger.info(f"\n净值数据检查:")
        sample_fund = Fund.query.first()
        if sample_fund:
            nav_count_for_fund = FundNAV.query.filter_by(fund_code=sample_fund.code).count()
            logger.info(f"  - 基金 {sample_fund.code} 的净值记录数: {nav_count_for_fund}")
            
            latest_nav = FundNAV.query.filter_by(fund_code=sample_fund.code).order_by(
                FundNAV.date.desc()
            ).first()
            if latest_nav:
                logger.info(f"  - 最新净值: {latest_nav.nav} (日期: {latest_nav.date})")
        
        logger.info("\n" + "=" * 60)
        logger.info("验证完成！")
        logger.info("=" * 60)


if __name__ == '__main__':
    from app.extensions import db
    verify_data()
