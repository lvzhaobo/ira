import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getJson } from "../api/client";
import PageShell from "../components/PageShell";
import {
  DISCLOSURE_LINEAGE,
  LINEAGE_KPIS,
  RESEARCH_SCENARIOS,
  type ResearchScenario,
} from "../data/lineageMock";

type TraceSummary = {
  trace_id?: string;
  summary?: string;
  artifact_type?: string;
  created_at?: string;
};

type TabId = "research" | "disclosure" | "audit";

const PAGE_NOTE =
  "主栏为公募典型「结论血缘 + 披露字段溯源」示意；「技术审计」页签仍对接本地 traces.json，供合规/个股页跳转 trace_id。";

export default function Lineage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>("research");
  const [scenarioId, setScenarioId] = useState(RESEARCH_SCENARIOS[0]?.id ?? "");
  const scenario = useMemo(
    () => RESEARCH_SCENARIOS.find((s) => s.id === scenarioId) ?? RESEARCH_SCENARIOS[0],
    [scenarioId]
  );

  const [tid, setTid] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<TraceSummary[]>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailErr, setDetailErr] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const skipNextUrlSync = useRef(false);

  const search = useCallback(async (query: string) => {
    setLoadingList(true);
    try {
      const r = await getJson<{ items?: TraceSummary[] }>(`/lineage/search?q=${encodeURIComponent(query)}&limit=24`);
      setItems(r.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadTrace = useCallback(
    async (id: string, updateUrl: boolean) => {
      const raw = id.trim();
      if (!raw) return;
      setTid(raw);
      setLoadingTrace(true);
      setDetailErr(null);
      try {
        const r = await getJson<Record<string, unknown>>(`/lineage/traces/${encodeURIComponent(raw)}`);
        setDetail(r);
        if (updateUrl) {
          skipNextUrlSync.current = true;
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("tid", raw);
            return next;
          });
        }
      } catch {
        setDetail(null);
        setDetailErr("未找到该 trace 或请求失败（404）");
      } finally {
        setLoadingTrace(false);
      }
    },
    [setSearchParams]
  );

  const tidParam = searchParams.get("tid") ?? "";
  useEffect(() => {
    if (!tidParam.trim()) return;
    if (skipNextUrlSync.current) {
      skipNextUrlSync.current = false;
      return;
    }
    setTab("audit");
    void loadTrace(tidParam, false);
  }, [tidParam, loadTrace]);

  useEffect(() => {
    void search("");
  }, [search]);

  const detailRows = detail ? Object.entries(detail).filter(([k]) => k !== "error") : [];

  return (
    <PageShell title="数据与结论血缘" note={PAGE_NOTE}>
      <div className="ira-lineage">
        <nav className="ira-lineage__tabs" role="tablist" aria-label="血缘视图">
          {(
            [
              { id: "research" as const, label: "投研结论血缘" },
              { id: "disclosure" as const, label: "监管披露溯源" },
              { id: "audit" as const, label: "技术审计 trace" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`ira-lineage__tab${tab === t.id ? " ira-lineage__tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "research" && scenario && (
          <div className="ira-lineage-panel">
            <p className="ira-lineage__lead">
              <strong>用途</strong>：满足投研合规与内控对「结论从哪来」的追问——从<strong>外部数据与内部制品</strong>，经<strong>加工任务与模型</strong>，到<strong>报告段落/图表</strong>及<strong>对外使用场景</strong>，形成可解释链路（以下为 Workshop Mock）。
            </p>

            <section className="ira-lineage__kpis" aria-label="血缘覆盖概览">
              {LINEAGE_KPIS.map((k) => (
                <article key={k.id} className="ira-lineage-kpi">
                  <div className="ira-lineage-kpi__label">{k.label}</div>
                  <div className="ira-lineage-kpi__value">{k.value}</div>
                  <div className="ira-lineage-kpi__sub">{k.sub}</div>
                </article>
              ))}
            </section>

            <div className="ira-card ira-lineage-card">
              <label className="ira-lineage-select-label">
                选择示例结论场景
                <select className="ira-input" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)} style={{ maxWidth: "100%" }}>
                  {RESEARCH_SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
              {scenario.product && (
                <p className="ira-lineage-card__meta">
                  责任主体：<strong>{scenario.product}</strong>
                </p>
              )}
              <p className="ira-lineage-card__summary">{scenario.summary}</p>
            </div>

            <section className="ira-lineage-card ira-card" aria-labelledby="lineage-lanes-title">
              <h2 id="lineage-lanes-title" className="ira-lineage-card__h2">
                分层血缘（数据源 → 加工 → 投研 → 制品 → 消费）
              </h2>
              <div className="ira-lineage-lanes">
                {scenario.lanes.map((lane, li) => (
                  <Fragment key={lane.id}>
                    <div className="ira-lineage-lane">
                      <div className="ira-lineage-lane__title">{lane.title}</div>
                      <ul className="ira-lineage-lane__nodes">
                        {lane.nodes.map((n) => (
                          <li key={n.id} className="ira-lineage-node">
                            <div className="ira-lineage-node__label">{n.label}</div>
                            {n.sub && <div className="ira-lineage-node__sub">{n.sub}</div>}
                            {n.system && <div className="ira-lineage-node__sys">{n.system}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {li < scenario.lanes.length - 1 && <div className="ira-lineage-lane__arrow" aria-hidden />}
                  </Fragment>
                ))}
              </div>
            </section>

            <div className="ira-lineage__grid2">
              <section className="ira-card ira-lineage-card">
                <h2 className="ira-lineage-card__h2">字段级溯源</h2>
                <p className="ira-lineage-card__hint">报告可见单元与上游数据集/批次绑定，便于监管问询与内部复核。</p>
                <div className="ira-table-wrap">
                  <table className="ira-table ira-lineage-table">
                    <thead>
                      <tr>
                        <th>输出单元</th>
                        <th>来源系统</th>
                        <th>数据集 / 对象</th>
                        <th>批次 / 版本</th>
                        <th>刷新时间</th>
                        <th>Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenario.fields.map((f) => (
                        <tr key={f.field}>
                          <td>{f.field}</td>
                          <td>{f.source}</td>
                          <td className="ira-lineage-mono">{f.dataset}</td>
                          <td>{f.batchOrVersion}</td>
                          <td>{f.refreshed}</td>
                          <td>{f.owner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="ira-lineage__stack">
                <section className="ira-card ira-lineage-card ira-lineage-card--impact">
                  <h2 className="ira-lineage-card__h2">影响与断档风险</h2>
                  <ul className="ira-lineage-impact">
                    {scenario.impacts.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </section>
                <section className="ira-card ira-lineage-card">
                  <h2 className="ira-lineage-card__h2">合规闸门</h2>
                  <p className="ira-lineage-card__gate">{scenario.complianceGate}</p>
                </section>
              </div>
            </div>
          </div>
        )}

        {tab === "disclosure" && (
          <div className="ira-lineage-panel">
            <p className="ira-lineage__lead">
              <strong>监管披露视角</strong>：季报、招募说明书等对外字段，需对应到<strong>TA、估值、行情、指数库</strong>等上游及批处理时点；状态列为演示示意。
            </p>
            <section className="ira-card ira-lineage-card">
              <h2 className="ira-lineage-card__h2">披露字段 → 上游系统</h2>
              <div className="ira-table-wrap">
                <table className="ira-table ira-lineage-table">
                  <thead>
                    <tr>
                      <th>报告类型</th>
                      <th>披露字段</th>
                      <th>上游系统</th>
                      <th>加工链路</th>
                      <th>核对状态</th>
                      <th>基准日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DISCLOSURE_LINEAGE.map((r, i) => (
                      <tr key={`${r.field}-${i}`}>
                        <td>{r.report}</td>
                        <td>{r.field}</td>
                        <td>{r.upstream}</td>
                        <td>{r.pipeline}</td>
                        <td>
                          <span className={`ira-lineage-status ira-lineage-status--${r.status === "已核对" ? "ok" : r.status === "待复核" ? "warn" : "mock"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>{r.asOf}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {tab === "audit" && (
          <div className="ira-lineage-panel">
            <p className="ira-lineage__lead">
              与 Workshop 演示接口对齐：问答、个股草稿、多 Agent 等写入 <code className="ira-lineage-code">traces.json</code>
              。可从
              <Link to="/compliance" className="ira-lineage-inline-link">
                合规
              </Link>
              、
              <Link to="/stock-analysis" className="ira-lineage-inline-link">
                个股分析
              </Link>
              携带 <code className="ira-lineage-code">?tid=</code> 跳转本页自动加载。
            </p>

            <div className="ira-lineage-audit-grid">
              <section className="ira-card ira-lineage-card">
                <h2 className="ira-lineage-card__h2">直查 trace_id</h2>
                <div className="ira-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                  <input
                    className="ira-input"
                    style={{ flex: "1 1 220px", minWidth: 0 }}
                    value={tid}
                    onChange={(e) => setTid(e.target.value)}
                    placeholder="粘贴 trace_id"
                  />
                  <button type="button" className="ira-btn" onClick={() => void loadTrace(tid, true)} disabled={loadingTrace || !tid.trim()}>
                    {loadingTrace ? "加载中…" : "加载"}
                  </button>
                </div>

                <h3 className="ira-lineage-card__h3">检索 traces</h3>
                <div className="ira-row" style={{ flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.65rem" }}>
                  <input
                    className="ira-input"
                    style={{ flex: "1 1 180px", minWidth: 0 }}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="摘要关键词或 trace 片段"
                  />
                  <button type="button" className="ira-btn ira-btn--ghost" onClick={() => void search(q)} disabled={loadingList}>
                    检索
                  </button>
                </div>
                {loadingList ? (
                  <p className="ira-muted">加载中…</p>
                ) : items.length === 0 ? (
                  <p className="ira-muted">无匹配。可先在研报问答、个股等页产生 trace。</p>
                ) : (
                  <ul className="ira-lineage-hitlist">
                    {items.map((it) => (
                      <li key={it.trace_id}>
                        <button
                          type="button"
                          className="ira-lineage-hit"
                          onClick={() => it.trace_id && void loadTrace(it.trace_id, true)}
                          disabled={!it.trace_id || loadingTrace}
                        >
                          <span className="ira-lineage-hit__id">
                            <code>{it.trace_id}</code>
                          </span>
                          <span className="ira-lineage-hit__sum">{it.summary || "—"}</span>
                          <span className="ira-lineage-hit__meta">
                            {it.artifact_type && <span>{it.artifact_type}</span>}
                            {it.created_at && <span>{it.created_at}</span>}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="ira-card ira-lineage-card ira-lineage-card--detail">
                <div className="ira-lineage-card__headrow">
                  <h2 className="ira-lineage-card__h2">原始记录（JSON）</h2>
                  {detail?.trace_id && (
                    <Link to="/compliance" className="ira-lineage-inline-link">
                      去合规扫描
                    </Link>
                  )}
                </div>
                {detailErr && (
                  <p className="ira-lineage-err" role="alert">
                    {detailErr}
                  </p>
                )}
                {!detail && !detailErr && <p className="ira-muted">选择列表项或输入 trace_id。</p>}
                {detail && (
                  <dl className="ira-lineage-dl">
                    {detailRows.map(([k, v]) => (
                      <div key={k} className="ira-lineage-dl__row">
                        <dt>{k}</dt>
                        <dd>
                          {typeof v === "object" && v !== null ? (
                            <pre className="ira-pre ira-pre--tight">{JSON.stringify(v, null, 2)}</pre>
                          ) : (
                            String(v)
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
