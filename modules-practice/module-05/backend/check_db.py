import sqlite3
import os

db_path = 'instance/fund_research.db'

if not os.path.exists(db_path):
    print(f"数据库文件不存在: {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 查看所有表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("=" * 60)
print("数据库表列表:")
print("=" * 60)
for table in tables:
    print(f"  - {table[0]}")

# 查看funds表数据
print("\n" + "=" * 60)
print("基金数据 (funds表):")
print("=" * 60)
cursor.execute("SELECT COUNT(*) FROM funds")
count = cursor.fetchone()[0]
print(f"基金总数: {count}")

if count > 0:
    cursor.execute("SELECT code, name, fund_type, status FROM funds LIMIT 10")
    funds = cursor.fetchall()
    print(f"\n前{min(10, count)}条基金数据:")
    print(f"{'基金代码':<10} {'基金名称':<20} {'基金类型':<15} {'状态':<10}")
    print("-" * 60)
    for fund in funds:
        print(f"{fund[0]:<10} {fund[1]:<20} {fund[2]:<15} {fund[3]:<10}")
else:
    print("\n⚠️  数据库中没有基金数据！")
    print("需要添加测试数据。")

# 查看其他表的数据量
print("\n" + "=" * 60)
print("各表数据统计:")
print("=" * 60)
for table in tables:
    table_name = table[0]
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"  {table_name}: {count} 条记录")

conn.close()
