"""seed_data.py — 生成练习用示例数据（运行一次即可）"""

import json
from pathlib import Path

DATA_DIR = Path("./data")
DATA_DIR.mkdir(exist_ok=True)


def write(name, obj):
    (DATA_DIR / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  ✅ {name}")


print("🌱 生成示例数据...")

write("funds.json", {
    "items": [
        {
            "id": "F001", "name": "南方新能源主题混合", "code": "012345", "type": "混合型",
            "internal_approval_id": "APR-2026-0042",
            "nav_history": [
                {"date": "2026-04-10", "nav": 1.2345},
                {"date": "2026-04-09", "nav": 1.2356},
                {"date": "2026-04-08", "nav": 1.2301},
                {"date": "2026-04-07", "nav": 1.2298},
            ],
        },
        {
            "id": "F002", "name": "南方品质优选混合", "code": "012346", "type": "混合型",
            "internal_approval_id": "APR-2026-0043",
            "nav_history": [
                {"date": "2026-04-10", "nav": 2.1500},
                {"date": "2026-04-09", "nav": 2.1480},
                {"date": "2026-04-08", "nav": 2.1520},
            ],
        },
        {
            "id": "F003", "name": "南方科技创新混合", "code": "012347", "type": "混合型",
            "internal_approval_id": "APR-2026-0044",
            "nav_history": [
                {"date": "2026-04-10", "nav": 0.8950},
                {"date": "2026-04-09", "nav": 0.8820},
            ],
        },
    ]
})

write("rules.json", {
    "ruleset_version": "rules-v1.0.0",
    "rules": [
        {"id": "R-G01", "layer": "L1", "title": "禁个性化投资建议"},
        {"id": "R-G02", "layer": "L1", "title": "禁保本收益承诺"},
    ]
})

write("alerts.json", {
    "items": [
        {"id": "a1", "title": "新能源龙头产能争议", "score": "85", "source": "财联社"},
        {"id": "a2", "title": "监管费率征求意见稿", "score": "92", "source": "协会官网"},
        {"id": "a3", "title": "固收+回撤讨论集中转发", "score": "7", "source": "微博"},
        {"id": "a4", "title": "半导体资本开支下调", "score": "78", "source": "Wind"},
        {"id": "a5", "title": "同业ETF费率讨论", "score": "100", "source": "上证e互动"},
        {"id": "a6", "title": "汇率波动解读分歧", "score": "9", "source": "Bloomberg"},
    ]
})

write("reports.json", {
    "items": [
        {
            "id": "RPT-001", "title": "2026Q1 新能源行业舆情周报",
            "status": "draft", "compliance_status": "未送审",
            "internal_reviewer": "李四", "internal_dept_code": "D-INVEST-03",
            "created_at": "2026-04-08",
        },
        {
            "id": "RPT-002", "title": "固收+产品净值波动分析",
            "status": "draft", "compliance_status": "未送审",
            "internal_reviewer": "王五", "internal_dept_code": "D-FIXED-01",
            "created_at": "2026-04-09",
        },
    ]
})

write("notify_history.json", {"items": []})

print("✅ 数据生成完毕！目录:", DATA_DIR.resolve())
