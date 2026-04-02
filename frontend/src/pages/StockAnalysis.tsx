import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getJson, postJson } from "../api/client";
import PageShell from "../components/PageShell";
import { EQUITY_QUICK_SYMBOLS, mockCloseSeries, resolveEquityProfile } from "../data/stockAnalysisMock";
import { loadRecent, mergeRecent, type WorkshopRecentEntry } from "../lib/workshopSidePanels";

const PAGE = "workshop-stock";

type Quote = { last?: number | null; pe_ttm?: number | null; mock?: boolean; symbol?: string };

function PriceSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 3;
  const w = 120;
  const h = 44;
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const last = values[values.length - 1];
  const first = values[0];
  const pct = first !== 0 ? (((last - first) / first) * 100).toFixed(2) : "0.00";
  return (
    <div className="ira-equity-spark-wrap">
      <svg className="ira-equity-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="ira-equity-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          className="ira-equity-spark__fill"
          fill="url(#ira-equity-spark-fill)"
          points={`${pad},${h - pad} ${pts} ${w - pad},${h - pad}`}
        />
        <polyline className="ira-equity-spark__line" fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={pts} />
      </svg>
      <div className="ira-equity-spark__meta">
        <span>区间涨跌（Mock）</span>
        <strong className={Number(pct) < 0 ? "ira-equity-spark__pct--down" : Number(pct) > 0 ? "ira-equity-spark__pct--up" : ""}>{pct}%</strong>
      </div>
    </div>
  );
}

export default function StockAnalysis() {
  const [sym, setSym] = useState("600519.SH");
  const [mainTab, setMainTab] = useState<"draft" | "brief">("draft");
  const [content, setContent] = useState("");
  const [trace, setTrace] = useState("");
  const [asOf, setAsOf] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [sourcesLine, setSourcesLine] = useState("");
  const [toolTrace, setToolTrace] = useState<{ tool?: string; mock?: boolean; as_of?: string }[]>([]);
  const [disclaimerApplied, setDisclaimerApplied] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [recentList, setRecentList] = useState<WorkshopRecentEntry[]>([]);
  const [toast, setToast] = useState<{ text: string; type: "ok" | "fail" } | null>(null);

  const profile = useMemo(() => resolveEquityProfile(sym), [sym]);
  const series20 = useMemo(() => mockCloseSeries(sym.trim() || "600519.SH", 20), [sym]);

  useEffect(() => {
    setRecentList(loadRecent(PAGE));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function runDraft() {
    if (loadingDraft) return;
    setLoadingDraft(true);
    try {
      const res = await postJson<{
        content: string;
        trace_id: string;
        as_of?: string;
        sources: { name: string; mock?: boolean }[];
        tool_trace?: { tool?: string; mock?: boolean; as_of?: string }[];
        disclaimer_applied?: boolean;
      }>("/research/stock/analysis", { symbol: sym.trim() || "600519.SH", mock: true });
      setContent(res.content);
      setTrace(res.trace_id);
      setAsOf(res.as_of ?? "");
      setDisclaimerApplied(Boolean(res.disclaimer_applied));
      const src = (res.sources || []).map((s) => `${s.name}${s.mock ? "（mock）" : ""}`).join(" · ");
      setSourcesLine(src || "—");
      setToolTrace(res.tool_trace || []);
      setRecentList(mergeRecent(PAGE, sym.trim() || "600519.SH", `${profile.name} · ${res.trace_id}`));
      setToast({ text: "已生成覆盖备忘录（演示）", type: "ok" });
      setMainTab("draft");
    } catch {
      setToast({ text: "生成失败", type: "fail" });
    } finally {
      setLoadingDraft(false);
    }
  }

  async function loadQuote() {
    setLoadingQuote(true);
    try {
      const q = await getJson<Quote>(`/research/stock/quote?symbol=${encodeURIComponent(sym.trim() || "600519.SH")}&mock=true`);
      setQuote(q);
      setToast({ text: "已刷新演示行情", type: "ok" });
    } catch {
      setToast({ text: "行情请求失败", type: "fail" });
    } finally {
      setLoadingQuote(false);
    }
  }

  function applyRecent(r: WorkshopRecentEntry) {
    setSym(r.text);
  }

  return (
    <PageShell
      title="个股覆盖"
      note="指「分析师对单只股票的研究覆盖页」，非基金持仓覆盖率；含 Mock 走势示意、备忘录与要点风险；结论与评级以内部正式发布为准。"
    >
      {toast && (
        <div className="ira-toast-wrap" aria-live="polite">
          <div className={`ira-toast ${toast.type === "ok" ? "ira-toast--ok" : "ira-toast--fail"}`}>{toast.text}</div>
        </div>
      )}

      <div className="ira-equity">
        <section className="ira-equity__lead" aria-label="页面说明">
          <p>
            <strong>「个股覆盖」</strong>在投研语境里通常指<strong>卖方/买方分析师对某只标的持续跟踪</strong>（观点、评级、模型、备忘录），
            与风控或产品报表里的<strong>「基金个股覆盖率」</strong>（组合层指标）不是同一概念。
          </p>
          <p className="ira-equity__lead-muted">
            本页价值（Workshop）：串联<strong>行情占位 → 走势示意 → 草稿生成 → trace/合规/多 Agent</strong>；
            下方走势为<strong>前端确定性 Mock</strong>，与「刷新行情」接口无关，仅供课堂展示「覆盖页应有信息密度」。
          </p>
          <details className="ira-equity__details">
            <summary>基金个股覆盖率（与本页区别）</summary>
            <p>
              常见定义之一：<code>覆盖率 = 持仓股票只数 / 可比股票池只数</code>（股票池可为基金合同约定范围、业绩基准成分或公司统一股票池，口径需披露）。
              本演示<strong>不计算</strong>该指标；若要做，应在「组合管理 / 风控报表」模块接持仓与池数据，而非本单票页。
            </p>
          </details>
        </section>

        <header className="ira-equity__hero">
          <div className="ira-equity__identity">
            <h2 className="ira-equity__name">{profile.name}</h2>
            <div className="ira-equity__codes">
              <span className="ira-equity__code-pill">{sym.trim() || "—"}</span>
              <span className="ira-equity__meta">{profile.industry}</span>
              <span className="ira-equity__meta">{profile.board}</span>
            </div>
            <p className="ira-equity__analyst">
              覆盖：<strong>{profile.analyst}</strong> · 内部评级：<strong>{profile.rating}</strong>
            </p>
          </div>
          <div className="ira-equity__actions">
            <label className="ira-equity__sym-label">
              标的代码
              <input className="ira-input" value={sym} onChange={(e) => setSym(e.target.value)} placeholder="600519.SH" />
            </label>
            <button type="button" className="ira-btn" onClick={() => void loadQuote()} disabled={loadingQuote}>
              {loadingQuote ? "刷新中…" : "刷新行情"}
            </button>
            <button type="button" className="ira-btn ira-btn--ghost" onClick={() => void runDraft()} disabled={loadingDraft}>
              {loadingDraft ? "生成中…" : "生成覆盖备忘录"}
            </button>
          </div>
        </header>

        <div className="ira-equity__chips">
          <span className="ira-equity__chips-label">快捷</span>
          {EQUITY_QUICK_SYMBOLS.map((s) => (
            <button key={s} type="button" className={`ira-equity-chip${s === sym.trim() ? " ira-equity-chip--active" : ""}`} onClick={() => setSym(s)}>
              {s}
            </button>
          ))}
        </div>

        <section className="ira-equity__kpis" aria-label="关键指标">
          <article className="ira-equity-kpi">
            <div className="ira-equity-kpi__label">最新价</div>
            <div className="ira-equity-kpi__value">{quote?.last != null ? quote.last.toFixed(2) : "—"}</div>
            <div className="ira-equity-kpi__sub">{quote?.mock ? "演示接口固定样例" : "点击刷新行情"}</div>
          </article>
          <article className="ira-equity-kpi">
            <div className="ira-equity-kpi__label">PE（TTM）</div>
            <div className="ira-equity-kpi__value">{quote?.pe_ttm != null ? String(quote.pe_ttm) : "—"}</div>
            <div className="ira-equity-kpi__sub">估值带需结合盈利预测</div>
          </article>
          <article className="ira-equity-kpi">
            <div className="ira-equity-kpi__label">总市值（示意）</div>
            <div className="ira-equity-kpi__value ira-equity-kpi__value--sm">{profile.marketCap}</div>
            <div className="ira-equity-kpi__sub">非实时计算</div>
          </article>
          <article className="ira-equity-kpi">
            <div className="ira-equity-kpi__label">近 20 日涨跌</div>
            <div
              className={`ira-equity-kpi__value${
                profile.chg20d.startsWith("-")
                  ? " ira-equity-kpi__value--down"
                  : profile.chg20d.startsWith("+")
                    ? " ira-equity-kpi__value--up"
                    : ""
              }`}
            >
              {profile.chg20d}
            </div>
            <div className="ira-equity-kpi__sub">Mock · 2026E EPS：{profile.epsFY26}</div>
          </article>
        </section>

        <section className="ira-equity__chart-card" aria-label="价格走势示意">
          <div className="ira-equity__chart-head">
            <span className="ira-equity-kpi__label">近 20 日收盘连线（Mock）</span>
            <span className="ira-equity__chart-hint">非 K 线、非真实行情；随标的代码确定性生成，仅供视觉密度演示</span>
          </div>
          <PriceSparkline values={series20} />
        </section>

        {trace && (
          <p className="ira-equity__trace">
            <span className="ira-equity__trace-label">本次 trace</span>
            <code>{trace}</code>
            {asOf && <span className="ira-equity__trace-asof">as_of {asOf}</span>}
            <Link className="ira-equity__link" to={`/lineage?tid=${encodeURIComponent(trace)}`}>
              数据血缘
            </Link>
            <Link className="ira-equity__link" to="/compliance">
              合规扫描
            </Link>
            <Link className="ira-equity__link" to="/multi-agent-stock">
              多 Agent 深度
            </Link>
          </p>
        )}

        <div className="ira-equity__grid">
          <div className="ira-equity__main">
            <div className="ira-equity-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mainTab === "draft"}
                className={`ira-equity-tabs__btn${mainTab === "draft" ? " ira-equity-tabs__btn--active" : ""}`}
                onClick={() => setMainTab("draft")}
              >
                覆盖备忘录（草稿）
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mainTab === "brief"}
                className={`ira-equity-tabs__btn${mainTab === "brief" ? " ira-equity-tabs__btn--active" : ""}`}
                onClick={() => setMainTab("brief")}
              >
                要点与风险（Mock）
              </button>
            </div>

            {mainTab === "draft" && (
              <div className="ira-equity-panel" role="tabpanel">
                <div className="ira-equity-panel__head">
                  <span>Markdown 草稿 · {disclaimerApplied ? "已注入免责声明模板" : "生成后显示"}</span>
                </div>
                <div className="ira-equity-md">{content || "点击「生成覆盖备忘录」从后端拉取演示正文（含免责声明段落）。"}</div>
              </div>
            )}

            {mainTab === "brief" && (
              <div className="ira-equity-panel" role="tabpanel">
                <div className="ira-equity-brief">
                  <div>
                    <h3 className="ira-equity-brief__h">核心催化 / 关注</h3>
                    <ul className="ira-equity-brief__ul">
                      {profile.catalysts.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="ira-equity-brief__h ira-equity-brief__h--risk">主要风险</h3>
                    <ul className="ira-equity-brief__ul ira-equity-brief__ul--risk">
                      {profile.risks.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="ira-equity__aside">
            <section className="ira-equity-aside-card">
              <h3 className="ira-equity-aside-card__title">数据与工具</h3>
              <p className="ira-equity-aside-card__p">{sourcesLine || "生成备忘录后展示 sources。"}</p>
              {toolTrace.length > 0 ? (
                <ul className="ira-equity-tools">
                  {toolTrace.map((t, i) => (
                    <li key={`${t.tool}-${i}`}>
                      <code>{t.tool}</code>
                      {t.mock !== undefined && <span className="ira-muted"> {t.mock ? "· mock" : ""}</span>}
                      {t.as_of && <div className="ira-equity-tools__time">{t.as_of}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ira-muted" style={{ fontSize: "0.75rem", margin: 0 }}>
                  tool_trace 随草稿返回
                </p>
              )}
            </section>

            <section className="ira-equity-aside-card ira-equity-aside-card--check">
              <h3 className="ira-equity-aside-card__title">对外前检查</h3>
              <ul className="ira-equity-check">
                <li>草稿须过合规关键词扫描后再外发。</li>
                <li>演示行情与 PE 非逐标的实时，勿对客宣称为即时行情。</li>
                <li>内部评级与 EPS 示意与研究所正式覆盖表可能不一致。</li>
              </ul>
            </section>

            {recentList.length > 0 && (
              <section className="ira-equity-aside-card">
                <h3 className="ira-equity-aside-card__title">最近标的</h3>
                <ul className="ira-equity-recent">
                  {recentList.slice(0, 6).map((r) => (
                    <li key={`${r.ts}-${r.text}`}>
                      <button type="button" className="ira-equity-recent__btn" onClick={() => applyRecent(r)}>
                        <span>{r.text}</span>
                        {r.meta && <small>{r.meta}</small>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
