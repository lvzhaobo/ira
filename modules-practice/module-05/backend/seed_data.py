"""数据库种子数据脚本 - 添加基金测试数据"""
from datetime import datetime, date
from decimal import Decimal
import random
from app import create_app
from app.extensions import db
from app.models.fund import Fund, FundNAV, FundManager
from loguru import logger


# 基金经理数据
MANAGERS_DATA = [
    {'name': '王泽实', 'gender': '男', 'education': '硕士研究生', 'experience_years': 12, 'biography': '资深基金经理，擅长成长股投资'},
    {'name': '刘健维', 'gender': '男', 'education': '博士研究生', 'experience_years': 10, 'biography': '专注于中小盘成长股研究'},
    {'name': '陈浩', 'gender': '男', 'education': '硕士研究生', 'experience_years': 8, 'biography': '价值投资践行者'},
    {'name': '宋倩倩', 'gender': '女', 'education': '硕士研究生', 'experience_years': 9, 'biography': '擅长债券投资和资产配置'},
    {'name': '张明', 'gender': '男', 'education': '硕士研究生', 'experience_years': 11, 'biography': '指数投资和量化策略专家'},
    {'name': '李健', 'gender': '男', 'education': '博士研究生', 'experience_years': 15, 'biography': '资深债券基金经理'},
    {'name': '王海青', 'gender': '女', 'education': '硕士研究生', 'experience_years': 7, 'biography': '专注于可转债投资'},
    {'name': '陈晓东', 'gender': '男', 'education': '硕士研究生', 'experience_years': 13, 'biography': '擅长宏观策略和资产配置'},
]

# 基金数据
FUNDS_DATA = [
    # 股票型基金
    {'code': '000001', 'name': '华夏成长混合', 'fund_type': '混合型', 'manager_name': '王泽实', 'establish_date': '2015-03-15', 'scale': 50.5},
    {'code': '000002', 'name': '华夏回报混合', 'fund_type': '混合型', 'manager_name': '陈浩', 'establish_date': '2016-06-20', 'scale': 35.2},
    {'code': '000011', 'name': '华夏大盘精选混合', 'fund_type': '混合型', 'manager_name': '王海青', 'establish_date': '2014-08-10', 'scale': 42.8},
    {'code': '000021', 'name': '华夏优势增长混合', 'fund_type': '混合型', 'manager_name': '王泽实', 'establish_date': '2017-01-12', 'scale': 28.6},
    {'code': '000031', 'name': '华夏复兴混合', 'fund_type': '混合型', 'manager_name': '刘健维', 'establish_date': '2016-11-05', 'scale': 31.4},
    
    # 混合型基金
    {'code': '110011', 'name': '易方达中小盘混合', 'fund_type': '混合型', 'manager_name': '刘健维', 'establish_date': '2013-05-18', 'scale': 68.9},
    {'code': '110022', 'name': '易方达消费行业股票', 'fund_type': '股票型', 'manager_name': '陈浩', 'establish_date': '2014-09-25', 'scale': 55.3},
    {'code': '110033', 'name': '易方达创新驱动混合', 'fund_type': '混合型', 'manager_name': '王海青', 'establish_date': '2015-12-08', 'scale': 22.7},
    {'code': '110044', 'name': '易方达医疗健康混合', 'fund_type': '混合型', 'manager_name': '陈晓东', 'establish_date': '2018-03-22', 'scale': 18.5},
    {'code': '110055', 'name': '易方达科技混合', 'fund_type': '混合型', 'manager_name': '张明', 'establish_date': '2019-07-15', 'scale': 45.2},
    
    # 债券型基金
    {'code': '000003', 'name': '中银可转债债券', 'fund_type': '债券型', 'manager_name': '宋倩倩', 'establish_date': '2014-04-10', 'scale': 15.8},
    {'code': '000004', 'name': '南方宝元债券', 'fund_type': '债券型', 'manager_name': '李健', 'establish_date': '2013-08-20', 'scale': 25.6},
    {'code': '000005', 'name': '嘉实增强收益债券', 'fund_type': '债券型', 'manager_name': '宋倩倩', 'establish_date': '2015-11-30', 'scale': 18.9},
    {'code': '000006', 'name': '西部利得稳健债券', 'fund_type': '债券型', 'manager_name': '李健', 'establish_date': '2016-02-18', 'scale': 12.3},
    {'code': '000007', 'name': '鹏华信用增利债券', 'fund_type': '债券型', 'manager_name': '王海青', 'establish_date': '2017-05-25', 'scale': 20.1},
    
    # 指数型基金
    {'code': '159919', 'name': '沪深300ETF', 'fund_type': '指数型', 'manager_name': '张明', 'establish_date': '2012-12-25', 'scale': 120.5},
    {'code': '510300', 'name': '华泰柏瑞沪深300ETF', 'fund_type': '指数型', 'manager_name': '张明', 'establish_date': '2012-05-04', 'scale': 150.8},
    {'code': '000300', 'name': '易方达沪深300ETF联接', 'fund_type': '指数型', 'manager_name': '张明', 'establish_date': '2013-11-12', 'scale': 85.6},
    {'code': '000311', 'name': '景顺长城沪深300指数增强', 'fund_type': '指数型', 'manager_name': '陈晓东', 'establish_date': '2014-06-18', 'scale': 42.3},
    {'code': '510500', 'name': '中证500ETF', 'fund_type': '指数型', 'manager_name': '张明', 'establish_date': '2013-02-06', 'scale': 95.2},
]


def seed_managers():
    """添加基金经理数据"""
    logger.info("开始添加基金经理数据...")
    
    for manager_data in MANAGERS_DATA:
        # 检查是否已存在
        existing = FundManager.query.filter_by(name=manager_data['name']).first()
        if existing:
            logger.info(f"基金经理 {manager_data['name']} 已存在，跳过")
            continue
        
        manager = FundManager(
            name=manager_data['name'],
            gender=manager_data['gender'],
            education=manager_data['education'],
            experience_years=manager_data['experience_years'],
            biography=manager_data['biography'],
            start_date=date(2015, 1, 1),
            total_scale=Decimal('0'),
            status='active'
        )
        db.session.add(manager)
    
    db.session.commit()
    logger.info(f"成功添加 {len(MANAGERS_DATA)} 位基金经理")


def seed_funds():
    """添加基金数据"""
    logger.info("开始添加基金数据...")
    
    added_count = 0
    skipped_count = 0
    
    for fund_data in FUNDS_DATA:
        # 检查是否已存在
        existing = Fund.query.filter_by(code=fund_data['code']).first()
        if existing:
            logger.info(f"基金 {fund_data['code']} {fund_data['name']} 已存在，跳过")
            skipped_count += 1
            continue
        
        # 查找基金经理
        manager = FundManager.query.filter_by(name=fund_data['manager_name']).first()
        if not manager:
            logger.warning(f"基金经理 {fund_data['manager_name']} 不存在，跳过基金 {fund_data['code']}")
            skipped_count += 1
            continue
        
        # 解析成立日期
        establish_date = datetime.strptime(fund_data['establish_date'], '%Y-%m-%d').date()
        
        # 创建基金
        fund = Fund(
            code=fund_data['code'],
            name=fund_data['name'],
            fund_type=fund_data['fund_type'],
            manager_id=manager.id,
            establish_date=establish_date,
            scale=Decimal(str(fund_data['scale'])) * Decimal('100000000'),  # 转换为元
            status='active'
        )
        db.session.add(fund)
        added_count += 1
    
    db.session.commit()
    logger.info(f"成功添加 {added_count} 只基金，跳过 {skipped_count} 只")
    
    # 更新基金经理管理规模
    update_manager_scale()


def seed_nav_data():
    """添加基金净值数据（模拟数据）"""
    logger.info("开始添加基金净值数据...")
    
    funds = Fund.query.filter_by(status='active').all()
    added_count = 0
    
    for fund in funds:
        # 检查是否已有净值数据
        existing_nav = FundNAV.query.filter_by(fund_code=fund.code).first()
        if existing_nav:
            logger.info(f"基金 {fund.code} 已有净值数据，跳过")
            continue
        
        # 生成最近30天的净值数据
        base_nav = random.uniform(1.0, 3.0)  # 基础净值
        
        for days_ago in range(30):
            nav_date = date.today()
            from datetime import timedelta
            nav_date = nav_date - timedelta(days=days_ago)
            
            # 模拟净值变化（随机波动-2%到+2%）
            change = random.uniform(-0.02, 0.02)
            base_nav = base_nav * (1 + change)
            
            nav = FundNAV(
                fund_code=fund.code,
                date=nav_date,
                nav=Decimal(str(round(base_nav, 4))),
                accum_nav=Decimal(str(round(base_nav * 1.2, 4))),  # 累计净值略高
                daily_return=Decimal(str(round(change * 100, 4)))  # 日收益率(%)
            )
            db.session.add(nav)
            added_count += 1
    
    db.session.commit()
    logger.info(f"成功添加 {added_count} 条净值数据")


def update_manager_scale():
    """更新基金经理管理总规模"""
    logger.info("更新基金经理管理规模...")
    
    managers = FundManager.query.filter_by(status='active').all()
    
    for manager in managers:
        total_scale = db.session.query(db.func.sum(Fund.scale)).filter_by(
            manager_id=manager.id,
            status='active'
        ).scalar() or 0
        
        manager.total_scale = Decimal(str(total_scale))
    
    db.session.commit()
    logger.info("基金经理管理规模更新完成")


def main():
    """主函数"""
    app = create_app()
    
    with app.app_context():
        logger.info("=" * 60)
        logger.info("开始执行数据库种子数据脚本")
        logger.info("=" * 60)
        
        try:
            # 1. 添加基金经理
            seed_managers()
            
            # 2. 添加基金数据
            seed_funds()
            
            # 3. 添加净值数据
            seed_nav_data()
            
            logger.info("=" * 60)
            logger.info("数据库种子数据添加完成！")
            logger.info("=" * 60)
            
            # 统计信息
            fund_count = Fund.query.count()
            manager_count = FundManager.query.count()
            nav_count = FundNAV.query.count()
            
            logger.info(f"当前数据库统计:")
            logger.info(f"  - 基金经理: {manager_count} 位")
            logger.info(f"  - 基金: {fund_count} 只")
            logger.info(f"  - 净值记录: {nav_count} 条")
            
        except Exception as e:
            logger.error(f"种子数据添加失败: {e}")
            db.session.rollback()
            raise


if __name__ == '__main__':
    main()
