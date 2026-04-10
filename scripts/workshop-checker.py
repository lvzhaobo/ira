#!/usr/bin/env python3
"""
Workshop 自动检查 & 评分脚本
=============================
用法:
    python workshop-checker.py [--groups-dir PATH] [--module M1] [--output report.json]

功能:
    1. Spec 文档检查: 03~14 是否存在、结构是否合规、版本号是否填写
    2. 代码检查: 后端是否能通过 pytest、关键文件是否存在
    3. 追溯检查: REQ → US → AC → TC 是否断链
    4. 汇总评分: 输出 JSON + 控制台表格
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path


# ===================== 配置 =====================

# Spec 文档检查规则 (编号 → 必须包含的关键词)
SPEC_DOCS = {
    "03": {"name": "立项提案", "required_sections": ["背景", "提案", "范围", "成功标准", "风险"],
           "stage": "Proposal", "weight": 8},
    "04": {"name": "产品需求", "required_sections": ["愿景", "角色", "场景", "优先级"],
           "stage": "Proposal", "weight": 8},
    "05": {"name": "用户故事", "required_sections": ["US-", "验收", "REQ"],
           "stage": "Spec", "weight": 12},
    "06": {"name": "功能规格", "required_sections": ["前端", "交互", "状态"],
           "stage": "Spec", "weight": 8},
    "07": {"name": "非功能约束", "required_sections": ["性能", "安全", "降级"],
           "stage": "Spec", "weight": 5},
    "08": {"name": "系统架构", "required_sections": ["架构", "技术选型", "组件"],
           "stage": "Design", "weight": 5},
    "09": {"name": "API接口规格", "required_sections": ["GET", "POST", "状态码", "错误"],
           "stage": "Design", "weight": 12},
    "10": {"name": "数据模型", "required_sections": ["字段", "类型", "约束"],
           "stage": "Design", "weight": 8},
    "12": {"name": "实施计划", "required_sections": ["S1", "W1", "矩阵", "里程碑"],
           "stage": "Plan", "weight": 8},
    "13": {"name": "测试策略", "required_sections": ["TC-", "门禁", "用例"],
           "stage": "Test", "weight": 10},
    "14": {"name": "追踪矩阵", "required_sections": ["REQ", "US", "TC"],
           "stage": "Trace", "weight": 6},
}

# 后端代码必须存在的文件
BACKEND_REQUIRED_FILES = [
    "app.py",
    "requirements.txt",
]

# 后端代码建议存在的文件
BACKEND_OPTIONAL_FILES = [
    "agent.py",
    "storage.py",
    "tests/test_agent.py",
]

STAGE_COLORS = {
    "Proposal": "🟡", "Spec": "🔵", "Design": "🟢",
    "Plan": "🟠", "Test": "🔴", "Trace": "🟣",
}


# ===================== 检查函数 =====================

def find_spec_files(group_dir: Path) -> dict:
    """在 group_dir 下递归查找 Spec 文档 (支持多种命名)"""
    found = {}
    for f in group_dir.rglob("*.md"):
        name = f.name.lower()
        for doc_id in SPEC_DOCS:
            patterns = [
                f"{doc_id}-",        # 03-xxx.md
                f"m01-{doc_id}",     # M01-03-xxx.md
                f"-{doc_id}-",       # xx-03-xx.md
            ]
            if any(p in name for p in patterns):
                found[doc_id] = f
                break
    return found


def check_spec_doc(filepath: Path, doc_id: str) -> dict:
    """检查单份 Spec 文档的质量"""
    info = SPEC_DOCS[doc_id]
    result = {
        "doc_id": doc_id,
        "name": info["name"],
        "stage": info["stage"],
        "filepath": str(filepath),
        "exists": True,
        "checks": [],
        "score": 0,
        "max_score": info["weight"],
    }

    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception as e:
        result["checks"].append({"item": "可读性", "pass": False, "msg": str(e)})
        return result

    lines = content.strip().split("\n")
    score = 0
    max_score = info["weight"]

    # Check 1: 文件非空且超过 10 行
    has_content = len(lines) > 10
    result["checks"].append({
        "item": "内容充实 (>10行)",
        "pass": has_content,
        "msg": f"{len(lines)} 行" if has_content else f"仅 {len(lines)} 行，内容过少"
    })
    if has_content:
        score += max_score * 0.2

    # Check 2: 有版本号
    has_version = bool(re.search(r"v\d+\.\d+", content))
    result["checks"].append({
        "item": "版本号",
        "pass": has_version,
        "msg": "找到版本号" if has_version else "未找到 v*.* 版本号"
    })
    if has_version:
        score += max_score * 0.1

    # Check 3: 有表格 (Spec 文档通常有表格)
    has_table = "|" in content and "---" in content
    result["checks"].append({
        "item": "结构化表格",
        "pass": has_table,
        "msg": "包含表格" if has_table else "建议用表格结构化信息"
    })
    if has_table:
        score += max_score * 0.1

    # Check 4: 必须包含的关键词
    missing = []
    found_kw = 0
    for kw in info["required_sections"]:
        if kw.lower() in content.lower():
            found_kw += 1
        else:
            missing.append(kw)

    kw_ratio = found_kw / len(info["required_sections"]) if info["required_sections"] else 1
    result["checks"].append({
        "item": f"关键内容覆盖 ({found_kw}/{len(info['required_sections'])})",
        "pass": kw_ratio >= 0.6,
        "msg": f"缺少: {', '.join(missing)}" if missing else "全部覆盖"
    })
    score += max_score * 0.4 * kw_ratio

    # Check 5: 引用了其他文档 (追溯链)
    refs = set(re.findall(r"`(\d{2})`|文档\s*(\d{2})", content))
    ref_count = len([r for r in refs if any(r)])
    has_refs = ref_count >= 1
    result["checks"].append({
        "item": "文档间追溯引用",
        "pass": has_refs,
        "msg": f"引用了 {ref_count} 份文档" if has_refs else "未引用其他文档编号"
    })
    if has_refs:
        score += max_score * 0.2

    result["score"] = round(score, 1)
    return result


def check_backend_code(group_dir: Path) -> dict:
    """检查后端代码质量"""
    result = {
        "category": "backend_code",
        "checks": [],
        "score": 0,
        "max_score": 20,
    }

    backend_dir = None
    for candidate in ["backend", "backend/app", "app"]:
        p = group_dir / candidate
        if p.exists():
            backend_dir = p
            break

    if not backend_dir:
        result["checks"].append({"item": "后端目录", "pass": False, "msg": "未找到 backend/ 目录"})
        return result

    result["checks"].append({"item": "后端目录", "pass": True, "msg": str(backend_dir)})
    score = 2

    # Check: 必须文件
    for fname in BACKEND_REQUIRED_FILES:
        exists = (backend_dir / fname).exists()
        # 也在上级目录找
        if not exists:
            exists = (backend_dir.parent / fname).exists() if backend_dir.name != "backend" else False
        result["checks"].append({
            "item": f"文件 {fname}",
            "pass": exists,
            "msg": "存在" if exists else "缺失"
        })
        if exists:
            score += 2

    # Check: 可选文件
    for fname in BACKEND_OPTIONAL_FILES:
        exists = (backend_dir / fname).exists()
        if not exists:
            exists = (backend_dir.parent / fname).exists()
        result["checks"].append({
            "item": f"文件 {fname}",
            "pass": exists,
            "msg": "存在" if exists else "缺失 (建议补充)"
        })
        if exists:
            score += 1

    # Check: pytest
    test_dir = backend_dir / "tests"
    if not test_dir.exists():
        test_dir = backend_dir.parent / "tests"

    test_files = list(test_dir.glob("test_*.py")) if test_dir.exists() else []
    has_tests = len(test_files) > 0
    result["checks"].append({
        "item": "测试文件",
        "pass": has_tests,
        "msg": f"找到 {len(test_files)} 个测试文件" if has_tests else "未找到 test_*.py"
    })
    if has_tests:
        score += 3

    # Check: 尝试运行 pytest
    if has_tests:
        try:
            env = os.environ.copy()
            env["PYTHONPATH"] = str(backend_dir.parent)
            proc = subprocess.run(
                [sys.executable, "-m", "pytest", str(test_dir), "-q", "--tb=no", "--no-header"],
                capture_output=True, text=True, timeout=30, env=env, cwd=str(backend_dir.parent)
            )
            test_passed = proc.returncode == 0
            # Parse passed/failed
            output = proc.stdout + proc.stderr
            match = re.search(r"(\d+) passed", output)
            passed_count = int(match.group(1)) if match else 0
            match_fail = re.search(r"(\d+) failed", output)
            failed_count = int(match_fail.group(1)) if match_fail else 0

            result["checks"].append({
                "item": "pytest 运行",
                "pass": test_passed,
                "msg": f"{passed_count} passed, {failed_count} failed" if not test_passed
                       else f"{passed_count} passed ✓"
            })
            if test_passed:
                score += 5
            elif passed_count > 0:
                score += 2
        except subprocess.TimeoutExpired:
            result["checks"].append({"item": "pytest 运行", "pass": False, "msg": "超时 (>30s)"})
        except Exception as e:
            result["checks"].append({"item": "pytest 运行", "pass": False, "msg": str(e)[:100]})

    result["score"] = min(score, result["max_score"])
    return result


def check_traceability(group_dir: Path, spec_files: dict) -> dict:
    """检查追溯链: REQ → US → AC → TC 是否断链"""
    result = {
        "category": "traceability",
        "checks": [],
        "score": 0,
        "max_score": 10,
    }

    # 从 05 提取 REQ-ID
    reqs = set()
    if "05" in spec_files:
        content = spec_files["05"].read_text(encoding="utf-8")
        reqs = set(re.findall(r"REQ-M\w+-\d+", content))

    result["checks"].append({
        "item": "REQ-ID 定义",
        "pass": len(reqs) > 0,
        "msg": f"找到 {len(reqs)} 条: {', '.join(sorted(reqs)[:5])}" if reqs else "05 中未找到 REQ-ID"
    })

    # 从 13 提取 TC-ID
    tcs = set()
    if "13" in spec_files:
        content = spec_files["13"].read_text(encoding="utf-8")
        tcs = set(re.findall(r"TC-M\w+-\d+", content))

    result["checks"].append({
        "item": "TC-ID 定义",
        "pass": len(tcs) > 0,
        "msg": f"找到 {len(tcs)} 条" if tcs else "13 中未找到 TC-ID"
    })

    # 从 14 检查 REQ → TC 映射
    if "14" in spec_files:
        content = spec_files["14"].read_text(encoding="utf-8")
        mapped_reqs = set(re.findall(r"REQ-M\w+-\d+", content))
        unmapped = reqs - mapped_reqs
        result["checks"].append({
            "item": "14 追踪覆盖",
            "pass": len(unmapped) == 0,
            "msg": f"全部覆盖 ✓" if not unmapped else f"未追踪: {', '.join(sorted(unmapped))}"
        })
    else:
        result["checks"].append({"item": "14 追踪覆盖", "pass": False, "msg": "14 文档缺失"})

    # 评分
    score = 0
    if reqs:
        score += 3
    if tcs:
        score += 3
    if "14" in spec_files:
        content = spec_files["14"].read_text(encoding="utf-8")
        if all(r in content for r in reqs) and reqs:
            score += 4
        elif reqs:
            score += 2

    result["score"] = min(score, result["max_score"])
    return result


# ===================== 主逻辑 =====================

def check_one_group(group_dir: Path, group_name: str) -> dict:
    """检查一个小组的全部内容"""
    report = {
        "group": group_name,
        "dir": str(group_dir),
        "timestamp": datetime.now().isoformat(),
        "spec_docs": [],
        "code": None,
        "traceability": None,
        "total_score": 0,
        "max_score": 0,
        "grade": "",
    }

    # 1. Spec 文档检查
    spec_files = find_spec_files(group_dir)
    for doc_id, info in SPEC_DOCS.items():
        if doc_id in spec_files:
            doc_result = check_spec_doc(spec_files[doc_id], doc_id)
        else:
            doc_result = {
                "doc_id": doc_id, "name": info["name"], "stage": info["stage"],
                "exists": False, "checks": [{"item": "文件存在", "pass": False, "msg": "未找到"}],
                "score": 0, "max_score": info["weight"],
            }
        report["spec_docs"].append(doc_result)

    # 2. 代码检查
    report["code"] = check_backend_code(group_dir)

    # 3. 追溯链检查
    report["traceability"] = check_traceability(group_dir, spec_files)

    # 4. 汇总
    total = sum(d["score"] for d in report["spec_docs"])
    total += report["code"]["score"]
    total += report["traceability"]["score"]
    max_total = sum(d["max_score"] for d in report["spec_docs"])
    max_total += report["code"]["max_score"]
    max_total += report["traceability"]["max_score"]

    report["total_score"] = round(total, 1)
    report["max_score"] = max_total
    pct = (total / max_total * 100) if max_total else 0
    report["grade"] = (
        "A" if pct >= 90 else "B" if pct >= 75 else "C" if pct >= 60 else "D" if pct >= 40 else "F"
    )

    return report


def print_report(report: dict):
    """打印单组报告"""
    pct = report["total_score"] / report["max_score"] * 100 if report["max_score"] else 0
    print(f"\n{'='*60}")
    print(f"  📊 {report['group']}  |  得分: {report['total_score']}/{report['max_score']} ({pct:.0f}%)  |  等级: {report['grade']}")
    print(f"{'='*60}")

    # Spec 文档
    print(f"\n  📄 Spec 文档检查:")
    for d in report["spec_docs"]:
        icon = STAGE_COLORS.get(d.get("stage", ""), "⚪")
        status = "✅" if d.get("exists") and d["score"] > d["max_score"] * 0.5 else "❌" if not d.get("exists") else "⚠️"
        print(f"    {icon} [{d['doc_id']}] {d['name']:<10} {status} {d['score']}/{d['max_score']}")
        for c in d.get("checks", []):
            ck = "✓" if c["pass"] else "✗"
            print(f"       {ck} {c['item']}: {c['msg']}")

    # 代码
    code = report["code"]
    print(f"\n  💻 代码检查: {code['score']}/{code['max_score']}")
    for c in code["checks"]:
        ck = "✓" if c["pass"] else "✗"
        print(f"    {ck} {c['item']}: {c['msg']}")

    # 追溯
    trace = report["traceability"]
    print(f"\n  🔗 追溯检查: {trace['score']}/{trace['max_score']}")
    for c in trace["checks"]:
        ck = "✓" if c["pass"] else "✗"
        print(f"    {ck} {c['item']}: {c['msg']}")


def main():
    parser = argparse.ArgumentParser(description="Workshop 自动检查 & 评分")
    parser.add_argument("--groups-dir", default="modules-practice",
                        help="小组目录的父路径 (默认 modules-practice)")
    parser.add_argument("--group", default=None,
                        help="只检查指定小组目录名 (如 module-01-investment-assistant)")
    parser.add_argument("--output", default="workshop-report.json",
                        help="输出 JSON 报告路径")
    args = parser.parse_args()

    base = Path(args.groups_dir)
    if not base.is_absolute():
        base = Path.cwd() / base

    if not base.exists():
        print(f"❌ 目录不存在: {base}")
        sys.exit(1)

    # 发现小组
    if args.group:
        groups = [(args.group, base / args.group)]
    else:
        groups = sorted([
            (d.name, d) for d in base.iterdir()
            if d.is_dir() and not d.name.startswith(".")
        ])

    print(f"🔍 发现 {len(groups)} 个小组/模块，开始检查...\n")

    all_reports = []
    for name, path in groups:
        report = check_one_group(path, name)
        print_report(report)
        all_reports.append(report)

    # 排行榜
    print(f"\n\n{'='*60}")
    print(f"  🏆 排行榜")
    print(f"{'='*60}")
    sorted_reports = sorted(all_reports, key=lambda r: r["total_score"], reverse=True)
    for i, r in enumerate(sorted_reports, 1):
        pct = r["total_score"] / r["max_score"] * 100 if r["max_score"] else 0
        medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f" {i}."
        print(f"  {medal} {r['group']:<35} {r['total_score']:>5.1f}/{r['max_score']}  ({pct:>4.0f}%)  [{r['grade']}]")

    # 输出 JSON
    output_path = Path(args.output)
    output_data = {
        "generated_at": datetime.now().isoformat(),
        "groups_count": len(all_reports),
        "reports": all_reports,
    }
    output_path.write_text(json.dumps(output_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n📁 JSON 报告已保存: {output_path}")


if __name__ == "__main__":
    main()
