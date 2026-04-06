import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getJson, postJson } from "../api/client";
import PageShell from "../components/PageShell";
import {
  COMPLIANCE_MODULE_HINTS,
  DISCLAIMER_SNIPPETS,
  QUICK_SCENARIOS,
  REGULATORY_MAP,
} from "../data/complianceMock";
import { loadRecent, mergeRecent, type WorkshopRecentEntry } from "../lib/workshopSidePanels";

const PAGE = "workshop-compliance";

type RuleRow = { id: string; title: string; layer?: string; summary?: string };

type ScanHit = { rule_id: string; span?: string; message: string };

type BlockRow = { trace_id?: string; rule_id?: string | null; summary?: string };

export default function Compliance() {
  const [rulesetVersion, setRulesetVersion] = useState("—");
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [hits, setHits] = useState<ScanHit[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [recentList, setRecentList] = useState<WorkshopRecentEntry[]>([]);
  const [toast, setToast] = useState<{ text: string; type: "ok" | "fail" } | null>(null);
  const [modulesOpen, setModulesOpen] = useState(false);

  const loadBlocks = useCallback(() => {
    getJson<{ items?: BlockRow[] }>("/compliance/blocks/recent")
      .then((d) => setBlocks(d.items || []))
      .catch(() => setBlocks([]));
  }, []);

  useEffect(() => {
    getJson<{ ruleset_version?: string; rules?: RuleRow[] }>("/compliance/rules").then((r) => {
      setRulesetVersion(r.ruleset_version ?? "—");
      setRules(r.rules || []);
    });
    loadBlocks();
  }, [loadBlocks]);

  useEffect(() => {
    setRecentList(loadRecent(PAGE));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const kpis = useMemo(
    () => [
      { label: "当前规则集", value: rulesetVersion, sub: "扫描绑定版本" },
      { label: "生效规则条数", value: String(rules.length), sub: "来自 /compliance/rules" },
      { label: "审计流水条数", value: String(blocks.length), sub: "本地 blocks 累计" },
      { label: "引擎范围", value: "关键词/模式", sub: "演示非全量 NLP" },
    ],
    [rulesetVersion, rules.length, blocks.length]
  );

  async function scan(preset?: string) {
    const bodyText = (preset ?? text).trim();
    if (!bodyText || loading) return;
    setText(bodyText);
    setLoading(true);
    try {
      const r = await postJson<{
        trace_id: string;
        blocked: boolean;
        hits: ScanHit[];
        ruleset_version?: string;
      }>("/compliance/scan", { text: bodyText, context_trace_id: null });
      setTraceId(r.trace_id);
      setBlocked(r.blocked);
      setHits(r.hits || []);
      if (r.ruleset_version) setRulesetVersion(r.ruleset_version);
      setRecentList(mergeRecent(PAGE, bodyText, r.blocked ? `拦截 · ${r.trace_id}` : `通过 · ${r.trace_id}`));
      loadBlocks();
      setToast({ text: r.blocked ? "扫描完成：存在规则命中" : "扫描完成：未命中演示规则", type: "ok" });
    } catch {
      setToast({ text: "扫描请求失败", type: "fail" });
    } finally {
      setLoading(false);
    }
  }

  function appendDisclaimer(snippet: string) {
    setText((prev) => (prev.trim() ? `${prev.trim()}\n\n${snippet}` : snippet));
  }

  return (
    <PageShell
      title="合规与宣传审查"
      note="单栏工作台：规则治理、宣传话术扫描、监管映射示意与审计流水；R-G01/R-G02 等为演示规则，非生产全量引擎。"
    >
      {toast && (
        <div className="ira-toast-wrap" aria-live="polite">
          <div className={`ira-toast ${toast.type === "ok" ? "ira-toast--ok" : "ira-toast--fail"}`}>{toast.text}</div>
        </div>
      )}

      <div className="ira-comp-page">
        <p className="ira-comp-page__lead">
          基金公司合规门户通常围绕<strong>「规则版本 → 扫描入口 → 命中与拦截 → 审计留痕 → 复核闭环」</strong>组织；本页用<strong>单栏分区</strong>对应这些能力，避免三栏割裂。以下为 Workshop 演示实现。
        </p>

        <section className="ira-comp-page__fold">
          <button type="button" className="ira-comp-page__fold-btn" onClick={() => setModulesOpen((v) => !v)} aria-expanded={modulesOpen}>
            {modulesOpen ? "▼" : "▶"} 常见模块清单（设计参考）
          </button>
          {modulesOpen && (
            <ul className="ira-comp-page__module-list">
              {COMPLIANCE_MODULE_HINTS.map((m) => (
                <li key={m.id}>
                  <strong>{m.title}</strong>
                  <span> — {m.desc}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ira-comp-page__kpis" aria-label="规则与审计概览">
          {kpis.map((k) => (
            <article key={k.label} className="ira-comp-kpi">
              <div className="ira-comp-kpi__label">{k.label}</div>
              <div className="ira-comp-kpi__value">{k.value}</div>
              <div className="ira-comp-kpi__sub">{k.sub}</div>
            </article>
          ))}
        </section>

        <section className="ira-card ira-comp-section">
          <h2 className="ira-comp-section__h2">场景速检</h2>
          <p className="ira-comp-section__sub">一键填入典型话术并扫描；用于培训与抽检演示。</p>
          <div className="ira-comp-quick">
            {QUICK_SCENARIOS.map((s) => (
              <div key={s.id} className="ira-comp-quick__card">
                <div className="ira-comp-quick__label">{s.label}</div>
                <div className="ira-comp-quick__hint">{s.hint}</div>
                <div className="ira-comp-quick__actions">
                  <button type="button" className="ira-btn ira-btn--ghost ira-btn--xs" onClick={() => setText(s.preset)}>
                    填入
                  </button>
                  <button type="button" className="ira-btn ira-btn--xs" onClick={() => void scan(s.preset)} disabled={loading}>
                    填入并扫描
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ira-card ira-comp-section ira-comp-section--primary">
          <h2 className="ira-comp-section__h2">宣传推介 / 对外话术扫描</h2>
          <p className="ira-comp-section__sub">
            支持粘贴推送稿、路演要点、问答输出片段等；每次扫描生成 <code className="ira-comp-code">trace_id</code> 并写入审计流水，可跳转
            <Link to="/lineage" className="ira-comp-link">
              数据血缘
            </Link>
            查看技术字段。
          </p>

          {recentList.length > 0 && (
            <div className="ira-comp-recent-bar">
              <span className="ira-comp-recent-bar__label">本机最近</span>
              <div className="ira-comp-recent-bar__chips">
                {recentList.slice(0, 5).map((r) => (
                  <button key={`${r.ts}-${r.text.slice(0, 20)}`} type="button" className="ira-comp-recent-chip" onClick={() => setText(r.text)} title={r.text}>
                    {r.text.length > 20 ? `${r.text.slice(0, 20)}…` : r.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ira-comp-inserts">
            <span className="ira-comp-inserts__label">免责与标准表述（追加到文末）</span>
            <div className="ira-comp-inserts__btns">
              {DISCLAIMER_SNIPPETS.map((s, idx) => (
                <button key={idx} type="button" className="ira-comp-insert-btn" onClick={() => appendDisclaimer(s)}>
                  + {s.length > 20 ? `${s.slice(0, 20)}…` : s}
                </button>
              ))}
            </div>
          </div>

          <textarea className="ira-textarea ira-comp-textarea" value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder="在此粘贴待检测文案…" />
          <div className="ira-comp-scan-row">
            <button type="button" className="ira-btn" onClick={() => void scan()} disabled={loading || !text.trim()}>
              {loading ? "扫描中…" : "执行合规扫描"}
            </button>
            <span className="ira-muted" style={{ fontSize: "0.75rem" }}>
              规则集 {rulesetVersion}
            </span>
          </div>

          {(traceId || blocked !== null) && (
            <div className={`ira-comp-result${blocked ? " ira-comp-result--blocked" : " ira-comp-result--ok"}`}>
              <div className="ira-comp-result__head">
                <strong>{blocked ? "存在命中（演示拦截态）" : "未命中演示规则"}</strong>
                {traceId && (
                  <span className="ira-comp-result__trace">
                    <code>{traceId}</code>
                    <Link to={`/lineage?tid=${encodeURIComponent(traceId)}`} className="ira-comp-link">
                      血缘追溯
                    </Link>
                  </span>
                )}
              </div>
              {hits.length > 0 && (
                <ul className="ira-comp-hits">
                  {hits.map((h, i) => (
                    <li key={`${h.rule_id}-${i}`}>
                      <span className="ira-comp-hits__rule">{h.rule_id}</span>
                      {h.span && <span className="ira-comp-hits__span">{h.span}</span>}
                      <span>{h.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section className="ira-card ira-comp-section">
          <h2 className="ira-comp-section__h2">当前生效规则集</h2>
          <div className="ira-table-wrap">
            <table className="ira-table ira-comp-table">
              <thead>
                <tr>
                  <th>规则 ID</th>
                  <th>层级</th>
                  <th>标题</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="ira-muted">
                      暂无规则
                    </td>
                  </tr>
                ) : (
                  rules.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <code>{x.id}</code>
                      </td>
                      <td>{x.layer ?? "—"}</td>
                      <td>{x.title}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ira-card ira-comp-section">
          <h2 className="ira-comp-section__h2">监管口径映射（示意）</h2>
          <p className="ira-comp-section__sub">内部规则与法规要点的对照，便于培训与对外解释；非法律意见。</p>
          <div className="ira-table-wrap">
            <table className="ira-table ira-comp-table">
              <thead>
                <tr>
                  <th>规则</th>
                  <th>监管/自律口径（示意）</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {REGULATORY_MAP.map((row) => (
                  <tr key={row.ruleId}>
                    <td>
                      <code>{row.ruleId}</code>
                    </td>
                    <td>{row.reference}</td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ira-card ira-comp-section ira-comp-section--audit">
          <div className="ira-comp-section__headrow">
            <h2 className="ira-comp-section__h2">审计流水</h2>
            <button type="button" className="ira-btn ira-btn--ghost ira-btn--xs" onClick={loadBlocks}>
              刷新
            </button>
          </div>
          <p className="ira-comp-section__sub">每次扫描在服务端追加一条记录（<code className="ira-comp-code">/compliance/blocks/recent</code>）。</p>
          {blocks.length === 0 ? (
            <p className="ira-muted">暂无记录；执行扫描后出现。</p>
          ) : (
            <div className="ira-table-wrap">
              <table className="ira-table ira-comp-table">
                <thead>
                  <tr>
                    <th>状态</th>
                    <th>规则</th>
                    <th>摘要</th>
                    <th>trace_id</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {blocks.slice(0, 20).map((b, i) => (
                    <tr key={`${b.trace_id}-${i}`}>
                      <td>{b.rule_id ? <span className="ira-comp-badge ira-comp-badge--block">命中</span> : <span className="ira-comp-badge ira-comp-badge--pass">通过</span>}</td>
                      <td>{b.rule_id ?? "—"}</td>
                      <td className="ira-comp-table__sum">{b.summary || "—"}</td>
                      <td className="ira-comp-table__mono">
                        <code>{b.trace_id ?? "—"}</code>
                      </td>
                      <td>
                        {b.trace_id && (
                          <Link to={`/lineage?tid=${encodeURIComponent(b.trace_id)}`} className="ira-comp-link">
                            追溯
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
