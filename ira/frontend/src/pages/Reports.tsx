import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getJson, patchJson } from "../api/client";
import PageShell from "../components/PageShell";

export type ReportDraft = {
  id: string;
  title: string;
  report_type?: string;
  type?: string;
  product_line?: string;
  product_code?: string;
  report_period?: string;
  department?: string;
  owner?: string;
  reviewer?: string;
  workflow_stage?: string;
  status?: string;
  compliance_status?: string;
  confidentiality?: string;
  updated_at?: string;
  due_at?: string;
  trace_id?: string;
};

const STAGES = ["编制中", "内审中", "合规审核", "待签章", "已定稿"] as const;

function nextStage(current: string): string {
  const i = STAGES.indexOf(current as (typeof STAGES)[number]);
  if (i < 0 || i >= STAGES.length - 1) return current;
  return STAGES[i + 1];
}

function stageBadgeClass(stage: string): string {
  switch (stage) {
    case "已定稿":
      return "ira-fund-tag ira-fund-tag--done";
    case "合规审核":
    case "待签章":
      return "ira-fund-tag ira-fund-tag--wait";
    case "编制中":
    default:
      return "ira-fund-tag ira-fund-tag--draft";
  }
}

export default function Reports() {
  const [items, setItems] = useState<ReportDraft[]>([]);
  const [kw, setKw] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<ReportDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await getJson<{ items: ReportDraft[] }>("/reports/drafts");
    setItems(r.items || []);
  }, []);

  useEffect(() => {
    load().catch(() => setMsg("无法加载报告登记数据"));
  }, [load]);

  useEffect(() => {
    getJson<{ preferences?: { reports_default_filter_stage?: string } }>("/system/settings")
      .then((s) => {
        const st = s.preferences?.reports_default_filter_stage;
        if (st && st !== "all") setStageFilter(st);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return items.filter((d) => {
      const stage = d.workflow_stage ?? d.status ?? "";
      if (stageFilter !== "all" && stage !== stageFilter) return false;
      const rt = d.report_type ?? d.type ?? "";
      if (typeFilter !== "all" && rt !== typeFilter) return false;
      if (kw.trim()) {
        const blob = `${d.title} ${d.owner ?? ""} ${d.product_code ?? ""} ${d.department ?? ""}`.toLowerCase();
        if (!blob.includes(kw.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [items, stageFilter, typeFilter, kw]);

  const kpis = useMemo(() => {
    const by = (s: string) => items.filter((d) => (d.workflow_stage ?? d.status) === s).length;
    const overdue = items.filter((d) => {
      if (!d.due_at) return false;
      const st = d.workflow_stage ?? d.status ?? "";
      if (st === "已定稿") return false;
      return d.due_at < new Date().toISOString().slice(0, 10);
    }).length;
    return {
      total: items.length,
      compliance: by("合规审核") + by("待签章"),
      finalized: by("已定稿"),
      overdue,
    };
  }, [items]);

  const reportTypes = useMemo(() => {
    const s = new Set<string>();
    items.forEach((d) => {
      const t = d.report_type ?? d.type;
      if (t) s.add(t);
    });
    return ["all", ...Array.from(s)];
  }, [items]);

  async function advanceStage(d: ReportDraft) {
    const cur = d.workflow_stage ?? d.status ?? "编制中";
    const next = nextStage(cur);
    if (next === cur) {
      setMsg("已在最后环节或未知状态，演示不继续推进。");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const updated = await patchJson<ReportDraft>(`/reports/drafts/${encodeURIComponent(d.id)}`, { workflow_stage: next });
      setItems((prev) => prev.map((x) => (x.id === d.id ? { ...x, ...updated } : x)));
      setSelected((s) => (s?.id === d.id ? { ...s, ...updated } : s));
      setMsg(`已推进环节：${cur} → ${next}（演示写回 JSON）`);
      await load();
    } catch {
      setMsg("环节更新失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title="报告与披露登记" note={null}>
      <div className="ira-fund-page">
        <header className="ira-fund-page__masthead">
          <div>
            <h2 className="ira-fund-page__h2">投研报告与披露事项登记簿</h2>
            <p className="ira-fund-page__sub">
              覆盖公募/专户/行业研究等输出在「编制—内审—合规—签章—定稿」链路上的登记与留痕需求；字段与环节可对接真实 OA
              / 文档库。本表为演示数据。
            </p>
          </div>
          <div className="ira-fund-page__masthead-actions">
            <button type="button" className="ira-btn ira-btn--ghost ira-btn--xs" disabled title="演示环境未接导出">
              导出 Excel
            </button>
            <button type="button" className="ira-btn ira-btn--ghost ira-btn--xs" onClick={() => void load()}>
              刷新列表
            </button>
          </div>
        </header>

        {msg && <p className={msg.includes("失败") ? "ira-fund-banner ira-fund-banner--warn" : "ira-fund-banner ira-fund-banner--ok"}>{msg}</p>}

        <section className="ira-fund-strip" aria-label="登记簿概览">
          <div className="ira-fund-strip__item">
            <span className="ira-fund-strip__label">在册报告（演示）</span>
            <span className="ira-fund-strip__value">{kpis.total}</span>
          </div>
          <div className="ira-fund-strip__item">
            <span className="ira-fund-strip__label">合规 / 签章环节</span>
            <span className="ira-fund-strip__value">{kpis.compliance}</span>
          </div>
          <div className="ira-fund-strip__item">
            <span className="ira-fund-strip__label">已定稿</span>
            <span className="ira-fund-strip__value">{kpis.finalized}</span>
          </div>
          <div className="ira-fund-strip__item ira-fund-strip__item--alert">
            <span className="ira-fund-strip__label">疑似超期（未结 + 过 due）</span>
            <span className="ira-fund-strip__value">{kpis.overdue}</span>
          </div>
        </section>

        <section className="ira-fund-toolbar" aria-label="筛选条件">
          <div className="ira-fund-toolbar__row">
            <label className="ira-fund-inline">
              <span>环节</span>
              <select className="ira-fund-select" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                <option value="all">全部</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="ira-fund-inline">
              <span>报告类型</span>
              <select className="ira-fund-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                {reportTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "全部类型" : t}
                  </option>
                ))}
              </select>
            </label>
            <label className="ira-fund-inline ira-fund-inline--grow">
              <span>关键字</span>
              <input className="ira-fund-input" placeholder="标题 / 编制人 / 产品代码 / 部门" value={kw} onChange={(e) => setKw(e.target.value)} />
            </label>
            <button
              type="button"
              className="ira-btn ira-btn--ghost ira-btn--xs"
              onClick={() => {
                setKw("");
                setStageFilter("all");
                setTypeFilter("all");
              }}
            >
              重置条件
            </button>
          </div>
          <p className="ira-fund-toolbar__hint">当前展示 {filtered.length} 条（共 {items.length} 条）。超期判断基于 due_at 与环节，简化为演示逻辑。</p>
        </section>

        <section className="ira-fund-table-section">
          <div className="ira-fund-section__bar">
            <h3 className="ira-fund-section__title">登记明细</h3>
            <span className="ira-fund-section__code">GET /reports/drafts · PATCH /reports/drafts/{"{id}"}</span>
          </div>
          <div className="ira-fund-table-wrap">
            <table className="ira-fund-table">
              <thead>
                <tr>
                  <th scope="col">报告名称</th>
                  <th scope="col">类型</th>
                  <th scope="col">产品/组合</th>
                  <th scope="col">报告期</th>
                  <th scope="col">编制部门</th>
                  <th scope="col">编制人</th>
                  <th scope="col">当前环节</th>
                  <th scope="col">合规状态</th>
                  <th scope="col">保密</th>
                  <th scope="col">截止</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="ira-fund-table__empty">
                      无符合条件记录
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => {
                    const stage = d.workflow_stage ?? d.status ?? "—";
                    const stageKnown = STAGES.includes(stage as (typeof STAGES)[number]);
                    const canAdvanceStage = stageKnown && nextStage(stage) !== stage;
                    const rt = d.report_type ?? d.type ?? "—";
                    const prod = d.product_line && d.product_code ? `${d.product_line} / ${d.product_code}` : d.product_line ?? d.product_code ?? "—";
                    return (
                      <tr key={d.id} className={selected?.id === d.id ? "ira-fund-table__row--active" : undefined}>
                        <td className="ira-fund-table__title">
                          <button type="button" className="ira-fund-table__title-btn" onClick={() => setSelected(d)} title="查看详情">
                            {d.title}
                          </button>
                        </td>
                        <td>{rt}</td>
                        <td>{prod}</td>
                        <td>{d.report_period ?? "—"}</td>
                        <td>{d.department ?? "—"}</td>
                        <td>{d.owner ?? "—"}</td>
                        <td>
                          {stageKnown ? (
                            <button
                              type="button"
                              className={`${stageBadgeClass(stage)} ira-fund-stage-btn`}
                              disabled={loading || !canAdvanceStage}
                              title={
                                canAdvanceStage
                                  ? "点击推进至下一环节（与「推进环节」相同，演示 PATCH）"
                                  : loading
                                    ? "正在提交…"
                                    : "已在最后环节，演示不再推进"
                              }
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void advanceStage(d);
                              }}
                            >
                              {stage}
                            </button>
                          ) : (
                            <span className={stageBadgeClass(stage)}>{stage}</span>
                          )}
                        </td>
                        <td>{d.compliance_status ?? "—"}</td>
                        <td>{d.confidentiality ?? "—"}</td>
                        <td>{d.due_at ?? "—"}</td>
                        <td className="ira-fund-table__ops">
                          <div className="ira-fund-table__actions" role="group" aria-label="行操作">
                            <button
                              type="button"
                              className="ira-btn ira-btn--ghost ira-btn--xs"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelected(d);
                              }}
                            >
                              详情
                            </button>
                            <button
                              type="button"
                              className="ira-btn ira-btn--xs"
                              disabled={loading || !canAdvanceStage}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void advanceStage(d);
                              }}
                              title={
                                canAdvanceStage
                                  ? "写入下一环节（演示 PATCH）"
                                  : loading
                                    ? "正在提交…"
                                    : "已在最后环节或未识别环节"
                              }
                            >
                              推进环节
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <section className="ira-fund-detail" aria-labelledby="rep-detail-title">
            <div className="ira-fund-detail__head">
              <h3 id="rep-detail-title" className="ira-fund-detail__title">
                事项详情 · {selected.title}
              </h3>
              <button type="button" className="ira-btn ira-btn--ghost ira-btn--xs" onClick={() => setSelected(null)}>
                关闭
              </button>
            </div>
            <div className="ira-fund-detail__grid">
              <dl className="ira-fund-dl">
                <dt>内部编号</dt>
                <dd>{selected.id}</dd>
                <dt>复核/内审</dt>
                <dd>{selected.reviewer ?? "—"}</dd>
                <dt>最近更新</dt>
                <dd>{selected.updated_at ?? "—"}</dd>
                <dt>血缘 trace</dt>
                <dd>
                  {selected.trace_id ? (
                    <Link className="ira-fund-anchor" to={`/lineage?tid=${encodeURIComponent(selected.trace_id)}`}>
                      {selected.trace_id}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </dl>
              <div className="ira-fund-timeline">
                <h4 className="ira-fund-timeline__h">流转示意（演示）</h4>
                <ol className="ira-fund-timeline__ol">
                  {STAGES.map((s) => {
                    const cur = selected.workflow_stage ?? selected.status ?? "";
                    const idx = STAGES.indexOf(cur as (typeof STAGES)[number]);
                    const si = STAGES.indexOf(s);
                    const done = idx >= 0 && si < idx;
                    const active = s === cur;
                    return (
                      <li key={s} className={`ira-fund-timeline__li${done ? " ira-fund-timeline__li--done" : ""}${active ? " ira-fund-timeline__li--active" : ""}`}>
                        {s}
                      </li>
                    );
                  })}
                </ol>
                <p className="ira-fund-muted">生产可对接 OA 审批节点时间戳、处理人、意见附件；此处仅高亮当前环节。</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
