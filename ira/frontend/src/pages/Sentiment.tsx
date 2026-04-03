import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteJson, getJson, postJson } from "../api/client";
import PageShell from "../components/PageShell";
import {
  HOT_TOPICS,
  INGESTION_PIPELINE,
  SECTOR_SENTIMENT,
  SENTIMENT_ALERTS,
  SENTIMENT_KPIS,
  SOURCE_MIX,
  STOCK_SENTIMENT,
  WATCH_MATRIX,
  type AlertLevel,
  type HotTopicRow,
  type IngestionStats,
  type SectorSentimentRow,
  type SentimentAlertRow,
  type SentimentKpi,
  type SourceMixRow,
  type StockSentimentRow,
  type WatchMatrixRow,
} from "../data/sentimentMock";

type WatchItem = { keyword: string; count: number };
type AlertItem = {
  id: string;
  title: string;
  source_name?: string;
  published_at?: string;
  sentiment?: string;
};
type PipelineRun = { run_id: string; status: string; trace_id?: string; started_at?: string };
type EventCluster = { dedup_group_id?: string; cluster_title?: string; risk_level?: string; sentiment?: string; trace_id?: string };
type CronJob = { job_id: string; enabled?: boolean; schedule?: string; last_run_status?: string };
type CopawAgent = { agent_id: string; name: string };
type CopawResult = {
  title?: string;
  risk_level?: string;
  sentiment?: string;
  impact_scope?: string;
  risk_tags?: string[];
  suggested_actions?: string[];
  brief_md?: string;
};
type CopawRunMeta = {
  run_id: string;
  trace_id: string;
  llm_used?: boolean;
  llm_model?: string;
  started_at?: string;
  ended_at?: string;
  elapsed_ms?: number;
  response_preview?: string;
  provider?: string;
  llm_provider?: string;
};

function levelLabel(l: AlertLevel): string {
  switch (l) {
    case "high":
      return "高";
    case "medium":
      return "中";
    default:
      return "低";
  }
}

function scoreBarClass(score: number): string {
  if (score >= 60) return "ira-sentiment-scorebar__fill--ok";
  if (score >= 45) return "ira-sentiment-scorebar__fill--mid";
  return "ira-sentiment-scorebar__fill--low";
}

function riskLabel(r: "high" | "watch" | "normal"): { text: string; cls: string } {
  switch (r) {
    case "high":
      return { text: "高风险", cls: "ira-sentiment-risk--high" };
    case "watch":
      return { text: "关注", cls: "ira-sentiment-risk--watch" };
    default:
      return { text: "正常", cls: "ira-sentiment-risk--normal" };
  }
}

export default function Sentiment() {
  const [watch, setWatch] = useState<WatchItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [kw, setKw] = useState("");
  const [ingTitle, setIngTitle] = useState("");
  const [ingSummary, setIngSummary] = useState("");
  const [err, setErr] = useState("");
  const [kpisUi, setKpisUi] = useState<SentimentKpi[]>(SENTIMENT_KPIS);
  const [topAlertsUi, setTopAlertsUi] = useState<SentimentAlertRow[]>(SENTIMENT_ALERTS);
  const [sectorUi, setSectorUi] = useState<SectorSentimentRow[]>(SECTOR_SENTIMENT);
  const [sourceMixUi, setSourceMixUi] = useState<SourceMixRow[]>(SOURCE_MIX);
  const [hotTopicsUi, setHotTopicsUi] = useState<HotTopicRow[]>(HOT_TOPICS);
  const [stockSentUi, setStockSentUi] = useState<StockSentimentRow[]>(STOCK_SENTIMENT);
  const [watchMatrixUi, setWatchMatrixUi] = useState<WatchMatrixRow[]>(WATCH_MATRIX);
  const [ingestionPipelineUi, setIngestionPipelineUi] = useState<IngestionStats[]>(INGESTION_PIPELINE);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [eventClusters, setEventClusters] = useState<EventCluster[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [copawAgents, setCopawAgents] = useState<CopawAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("agent.sentiment.pm-assistant");
  const [assistantStatus, setAssistantStatus] = useState<"idle" | "processing">("idle");
  const [assistantResult, setAssistantResult] = useState<CopawResult | null>(null);
  const [assistantMeta, setAssistantMeta] = useState<CopawRunMeta | null>(null);
  const [alertStatus, setAlertStatus] = useState<Record<string, "idle" | "processing" | "done" | "error">>({});
  const [alertResult, setAlertResult] = useState<Record<string, CopawResult>>({});
  const [alertMeta, setAlertMeta] = useState<Record<string, CopawRunMeta>>({});
  const [reportId, setReportId] = useState("");
  const [apiMsg, setApiMsg] = useState("");
  const [bizMsg, setBizMsg] = useState("");

  const load = useCallback(async () => {
    const [w, a, r, e, cj, kpis, topAlerts, sector, sourceMix, hotTopics, stockSent, watchMatrix, ingestionPipe, agents] =
      await Promise.all([
      getJson<{ items: WatchItem[] }>("/sentiment/watchlist"),
      getJson<{ items: AlertItem[] }>("/sentiment/alerts"),
      getJson<{ items: PipelineRun[] }>("/sentiment/pipeline/runs").catch(() => ({ items: [] })),
      getJson<{ items: EventCluster[] }>("/sentiment/events?limit=8").catch(() => ({ items: [] })),
      getJson<{ items: CronJob[] }>("/cron/jobs").catch(() => ({ items: [] })),
      getJson<{ items: SentimentKpi[] }>("/sentiment/mock/kpis").catch(() => ({ items: SENTIMENT_KPIS })),
      getJson<{ items: SentimentAlertRow[] }>("/sentiment/alerts/for-ui?limit=6").catch(() => ({ items: SENTIMENT_ALERTS })),
      getJson<{ items: SectorSentimentRow[] }>("/sentiment/mock/sector-sentiment").catch(() => ({ items: SECTOR_SENTIMENT })),
      getJson<{ items: SourceMixRow[] }>("/sentiment/mock/source-mix").catch(() => ({ items: SOURCE_MIX })),
      getJson<{ items: HotTopicRow[] }>("/sentiment/mock/hot-topics").catch(() => ({ items: HOT_TOPICS })),
      getJson<{ items: StockSentimentRow[] }>("/sentiment/mock/stock-sentiment").catch(() => ({ items: STOCK_SENTIMENT })),
      getJson<{ items: WatchMatrixRow[] }>("/sentiment/mock/watch-matrix").catch(() => ({ items: WATCH_MATRIX })),
      getJson<{ items: IngestionStats[] }>("/sentiment/mock/ingestion-pipeline").catch(() => ({ items: INGESTION_PIPELINE })),
      getJson<{ items: CopawAgent[] }>("/sentiment/copaw/agents").catch(() => ({ items: [{ agent_id: "agent.sentiment.pm-assistant", name: "投研经理舆情助手" }] })),
    ]);
    setWatch(w.items || []);
    setAlerts(a.items || []);
    setPipelineRuns(r.items || []);
    setEventClusters(e.items || []);
    setCronJobs(cj.items || []);
    setKpisUi(kpis.items || SENTIMENT_KPIS);
    setTopAlertsUi(topAlerts.items || SENTIMENT_ALERTS);
    setSectorUi(sector.items || SECTOR_SENTIMENT);
    setSourceMixUi(sourceMix.items || SOURCE_MIX);
    setHotTopicsUi(hotTopics.items || HOT_TOPICS);
    setStockSentUi(stockSent.items || STOCK_SENTIMENT);
    setWatchMatrixUi(watchMatrix.items || WATCH_MATRIX);
    setIngestionPipelineUi(ingestionPipe.items || INGESTION_PIPELINE);
    setCopawAgents(agents.items || []);
  }, []);

  useEffect(() => {
    load().catch(() => setErr("无法加载舆情 API（联调区仍可展示本地 Mock）"));
  }, [load]);

  const apiHint = useMemo(() => (err ? err : "联调区已连接后端演示接口"), [err]);

  async function addKeyword() {
    setErr("");
    if (!kw.trim()) return;
    await postJson("/sentiment/watchlist", { keyword: kw.trim() });
    setKw("");
    await load();
  }

  async function removeKeyword(keyword: string) {
    await deleteJson(`/sentiment/watchlist?keyword=${encodeURIComponent(keyword)}`);
    await load();
  }

  async function ingest() {
    setErr("");
    await postJson("/sentiment/ingest", {
      title: ingTitle || "手动录入",
      summary: ingSummary || "",
      source_type: "manual",
      source_name: "console",
      published_at: new Date().toISOString().slice(0, 10),
    });
    setIngTitle("");
    setIngSummary("");
    await load();
  }

  async function runAnalyze() {
    setErr("");
    setApiMsg("");
    setAssistantStatus("processing");
    const t0 = Date.now();
    const localStartedAt = new Date().toISOString();
    try {
      const r = await postJson<{
        run_id: string;
        trace_id: string;
        llm_used?: boolean;
        llm_model?: string;
        started_at?: string;
        ended_at?: string;
        elapsed_ms?: number;
        response_preview?: string;
        provider?: string;
        llm_provider?: string;
        result?: CopawResult;
      }>("/sentiment/copaw/agent/run", { agent_id: selectedAgentId, action: "analyze_overview", time_window: "24h", keywords: watch.slice(0, 5).map((x) => x.keyword) });
      const llmText = r.llm_used ? `百炼在线（model：${r.llm_model ?? "—"}）` : "Mock回退（未配置/失败时兜底）";
      const msg = `分析任务已触发：${r.run_id} · trace ${r.trace_id} · ${llmText}`;
      setApiMsg(msg);
      setBizMsg(`AI 已更新今日舆情结论（${llmText}）`);
      if (r.result) setAssistantResult(r.result);
      const fallbackPreview =
        r.response_preview ??
        r.result?.impact_scope ??
        (r.result?.suggested_actions?.slice(0, 2).join("；") || "") ??
        r.result?.brief_md ??
        "";
      setAssistantMeta({
        run_id: r.run_id,
        trace_id: r.trace_id,
        llm_used: r.llm_used,
        llm_model: r.llm_model,
        started_at: r.started_at ?? localStartedAt,
        ended_at: r.ended_at ?? new Date().toISOString(),
        elapsed_ms: r.elapsed_ms ?? Math.max(1, Date.now() - t0),
        response_preview: fallbackPreview || "（无摘录，已返回结构化结果）",
        provider: r.provider,
        llm_provider: r.llm_provider,
      });
      await load();
    } catch {
      setErr("AI业务助手调用失败，请稍后重试");
      setBizMsg("处理失败：百炼/CoPaw 接口暂不可用");
    } finally {
      setAssistantStatus("idle");
    }
  }

  async function generateReport() {
    setErr("");
    setApiMsg("");
    const r = await postJson<{ report_id: string; trace_id: string; report_title: string }>("/sentiment/report/generate", {
      report_type: "daily",
      time_window: "24h",
      template_version: "sentiment-daily-v1",
      include_sections: ["summary", "key_points", "risk", "trace_refs"],
    });
    setReportId(r.report_id);
    const msg = `报告已生成：${r.report_title}（${r.report_id}） · trace ${r.trace_id}`;
    setApiMsg(msg);
    setBizMsg("已生成可投决讨论的舆情简报草稿");
  }

  async function runPush() {
    setErr("");
    setApiMsg("");
    const r = await postJson<{ status: string; trace_id: string; push_batch_id: string; blocked?: boolean }>(
      "/sentiment/push/run",
      { report_id: reportId || undefined, channels: ["feishu", "ding", "email"], require_compliance_scan: true }
    );
    const msg = `推送批次 ${r.push_batch_id}：${r.status}${r.blocked ? "（命中拦截）" : ""} · trace ${r.trace_id}`;
    setApiMsg(msg);
    setBizMsg(r.blocked ? "推送前合规检查命中规则，已自动拦截" : "舆情结论已推送到订阅渠道");
    await load();
  }

  async function runCron(jobId: string) {
    setErr("");
    setApiMsg("");
    const r = await postJson<{ run_id: string; trace_id: string }>("/cron/jobs/run-once", { job_id: jobId, params: { time_window: "24h" } });
    setApiMsg(`Cron 已触发：${jobId} / ${r.run_id} · trace ${r.trace_id}`);
  }

  async function aiExplainAlert(alert: SentimentAlertRow) {
    setErr("");
    setApiMsg("");
    setAlertStatus((s) => ({ ...s, [alert.id]: "processing" }));
    const t0 = Date.now();
    const localStartedAt = new Date().toISOString();
    try {
      const r = await postJson<{
        run_id: string;
        trace_id: string;
        llm_used?: boolean;
        llm_model?: string;
        started_at?: string;
        ended_at?: string;
        elapsed_ms?: number;
        response_preview?: string;
        provider?: string;
        llm_provider?: string;
        result?: CopawResult;
      }>("/sentiment/copaw/agent/run", {
        agent_id: selectedAgentId,
        action: "explain_alert",
        time_window: "24h",
        keywords: [alert.category, ...(alert.tags ?? [])].filter(Boolean).slice(0, 5),
        alert,
      });
      const llmText = r.llm_used ? `百炼在线（${r.llm_model ?? "默认模型"}）` : "规则回退";
      setApiMsg(`单条事件分析已触发：${alert.title} · ${r.run_id} · trace ${r.trace_id}`);
      setBizMsg(`AI解读已更新：${alert.title}（${llmText}）`);
      if (r.result) setAlertResult((x) => ({ ...x, [alert.id]: r.result! }));
      const fallbackPreview =
        r.response_preview ??
        r.result?.impact_scope ??
        (r.result?.suggested_actions?.slice(0, 2).join("；") || "") ??
        r.result?.brief_md ??
        "";
      setAlertMeta((x) => ({
        ...x,
        [alert.id]: {
          run_id: r.run_id,
          trace_id: r.trace_id,
          llm_used: r.llm_used,
          llm_model: r.llm_model,
          started_at: r.started_at ?? localStartedAt,
          ended_at: r.ended_at ?? new Date().toISOString(),
          elapsed_ms: r.elapsed_ms ?? Math.max(1, Date.now() - t0),
          response_preview: fallbackPreview || "（无摘录，已返回结构化结果）",
          provider: r.provider,
          llm_provider: r.llm_provider,
        },
      }));
      setAlertStatus((s) => ({ ...s, [alert.id]: "done" }));
      await load();
    } catch {
      setErr("AI解读调用失败，请稍后重试");
      setAlertStatus((s) => ({ ...s, [alert.id]: "error" }));
    }
  }

  async function aiSuggestAlertActions(alert: SentimentAlertRow) {
    setErr("");
    setApiMsg("");
    setAlertStatus((s) => ({ ...s, [alert.id]: "processing" }));
    const t0 = Date.now();
    const localStartedAt = new Date().toISOString();
    try {
      const r = await postJson<{
        run_id: string;
        trace_id: string;
        llm_used?: boolean;
        llm_model?: string;
        started_at?: string;
        ended_at?: string;
        elapsed_ms?: number;
        response_preview?: string;
        provider?: string;
        llm_provider?: string;
        result?: CopawResult;
      }>("/sentiment/copaw/agent/run", {
        agent_id: selectedAgentId,
        action: "suggest_actions",
        time_window: "24h",
        keywords: [...(alert.relatedCodes ?? []), ...(alert.tags ?? []), alert.category].filter(Boolean).slice(0, 6),
        alert,
      });
      const llmText = r.llm_used ? `百炼在线（${r.llm_model ?? "默认模型"}）` : "规则回退";
      setApiMsg(`处置建议分析已触发：${alert.title} · ${r.run_id} · trace ${r.trace_id}`);
      setBizMsg(`已生成建议动作：先核验来源、再确认影响范围、最后同步投研结论（${llmText}）`);
      if (r.result) setAlertResult((x) => ({ ...x, [alert.id]: r.result! }));
      const fallbackPreview =
        r.response_preview ??
        r.result?.impact_scope ??
        (r.result?.suggested_actions?.slice(0, 2).join("；") || "") ??
        r.result?.brief_md ??
        "";
      setAlertMeta((x) => ({
        ...x,
        [alert.id]: {
          run_id: r.run_id,
          trace_id: r.trace_id,
          llm_used: r.llm_used,
          llm_model: r.llm_model,
          started_at: r.started_at ?? localStartedAt,
          ended_at: r.ended_at ?? new Date().toISOString(),
          elapsed_ms: r.elapsed_ms ?? Math.max(1, Date.now() - t0),
          response_preview: fallbackPreview || "（无摘录，已返回结构化结果）",
          provider: r.provider,
          llm_provider: r.llm_provider,
        },
      }));
      setAlertStatus((s) => ({ ...s, [alert.id]: "done" }));
      await load();
    } catch {
      setErr("处置建议调用失败，请稍后重试");
      setAlertStatus((s) => ({ ...s, [alert.id]: "error" }));
    }
  }

  return (
    <PageShell title="舆情监控">
      <div className="ira-sentiment">
        <p className="ira-sentiment__lead">
          面向<strong>投研与合规</strong>的一体化舆情看板：多源聚合、分级预警、重仓关联与关键词矩阵（当前页面主体为{" "}
          <strong>API 返回数据</strong>：默认从 Mock 接口提供；触发“分析 run”后会切换为百炼生成的聚类/报告/推送结果）。
        </p>

        <div className="ira-sentiment__toolbar">
          <div className="ira-sentiment__tabs" role="tablist" aria-label="时间范围（演示）">
            {["24h", "7 日", "30 日"].map((t, i) => (
              <button key={t} type="button" className={`ira-sentiment__tab${i === 0 ? " ira-sentiment__tab--active" : ""}`} disabled={i !== 0}>
                {t}
              </button>
            ))}
          </div>
          <div className="ira-sentiment__toolbar-meta">
            <span className="ira-sentiment__pill">数据截止：今日 22:00（演示口径）</span>
            <button type="button" className="ira-sentiment__ghost-btn" title="演示环境未接导出">
              导出简报
            </button>
          </div>
        </div>

        <section className="ira-card ira-sentiment-card" aria-label="AI业务助手">
          <div className="ira-sentiment-card__head">
            <h2 className="ira-sentiment-card__title">AI业务助手（CoPaw + 百炼）</h2>
            <span className="ira-sentiment-card__hint">面向投资经理的业务入口</span>
          </div>
          <div className="ira-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            <select className="ira-input" style={{ maxWidth: "18rem" }} value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
              {(copawAgents.length ? copawAgents : [{ agent_id: "agent.sentiment.pm-assistant", name: "投研经理舆情助手" }]).map((a) => (
                <option key={a.agent_id} value={a.agent_id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button type="button" className="ira-btn" onClick={runAnalyze}>
              {assistantStatus === "processing" ? "处理中..." : "更新今日舆情结论"}
            </button>
            <button type="button" className="ira-btn" onClick={generateReport}>
              生成晨会舆情简报
            </button>
            <button type="button" className="ira-btn ira-btn--ghost" onClick={runPush}>
              推送给研究组/产品组
            </button>
          </div>
          <p className="ira-muted" style={{ marginTop: "0.6rem" }}>
            {bizMsg || "说明：按钮面向业务场景；系统会在后台自动编排采集/分析/聚类/报告/推送，并保留 trace 追溯。"}
          </p>
          <div className="ira-card ira-card--muted" style={{ marginTop: "0.55rem" }}>
            <div className="ira-muted" style={{ marginBottom: "0.35rem" }}>处理结果</div>
            {assistantStatus === "processing" ? (
              <div className="ira-muted">CoPaw Agent 正在调用百炼分析中，请稍候...</div>
            ) : assistantResult ? (
              <div className="ira-stack">
                <div>
                  <strong>{assistantResult.title ?? "舆情结论"}</strong>
                </div>
                <div className="ira-muted">{assistantResult.impact_scope ?? "影响范围待确认"}</div>
                {assistantResult.suggested_actions && assistantResult.suggested_actions.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                    {assistantResult.suggested_actions.slice(0, 3).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                )}
                {assistantMeta && (
                  <div className="ira-muted" style={{ marginTop: "0.35rem" }}>
                    请求时间：{assistantMeta.started_at ?? "—"} ｜耗时：{assistantMeta.elapsed_ms ?? 0}ms ｜Provider：
                    {assistantMeta.provider ?? "copaw"} / {assistantMeta.llm_provider ?? "unknown"} ｜LLM：
                    {assistantMeta.llm_used ? `百炼(${assistantMeta.llm_model ?? "default"})` : "回退"}
                    <br />
                    响应摘录：{assistantMeta.response_preview ?? "—"}
                  </div>
                )}
              </div>
            ) : (
              <div className="ira-muted">点击上方按钮后，这里会展示结构化处理结果。</div>
            )}
          </div>
        </section>

        <section className="ira-sentiment__kpis" aria-label="核心指标">
          {kpisUi.map((k) => (
            <article key={k.id} className={`ira-sentiment-kpi ira-sentiment-kpi--${k.accent ?? "neutral"}`}>
              <div className="ira-sentiment-kpi__label">{k.label}</div>
              <div className="ira-sentiment-kpi__value">{k.value}</div>
              {k.sub && <div className="ira-sentiment-kpi__sub">{k.sub}</div>}
              {k.delta && (
                <div className={`ira-sentiment-kpi__delta ira-sentiment-kpi__delta--${k.trend ?? "flat"}`}>{k.delta}</div>
              )}
            </article>
          ))}
        </section>

        <div className="ira-sentiment__grid2">
          <section className="ira-card ira-sentiment-card">
            <div className="ira-sentiment-card__head">
              <h2 className="ira-sentiment-card__title">分级预警与要闻摘要</h2>
              <span className="ira-sentiment-card__hint">按处置优先级排序 · 支持 AI 解释</span>
            </div>
            <ul className="ira-sentiment-alert-list">
              {topAlertsUi.map((a) => (
                <li key={a.id} className={`ira-sentiment-alert ira-sentiment-alert--${a.level}`}>
                  <div className="ira-sentiment-alert__top">
                    <span className="ira-sentiment-alert__level">{levelLabel(a.level)}</span>
                    <span className="ira-sentiment-alert__cat">{a.category}</span>
                    <time className="ira-sentiment-alert__time">{a.time}</time>
                  </div>
                  <h3 className="ira-sentiment-alert__title">{a.title}</h3>
                  <p className="ira-sentiment-alert__summary">{a.summary}</p>
                  <div className="ira-sentiment-alert__foot">
                    <span>
                      {a.source} · {a.channel}
                    </span>
                    {a.relatedCodes && a.relatedCodes.length > 0 && (
                      <span className="ira-sentiment-alert__codes">{a.relatedCodes.join(" · ")}</span>
                    )}
                  </div>
                  {a.tags && (
                    <div className="ira-sentiment-alert__tags">
                      {a.tags.map((t) => (
                        <span key={t} className="ira-sentiment-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="ira-row" style={{ marginTop: "0.55rem", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button type="button" className="ira-btn ira-btn--ghost" onClick={() => aiExplainAlert(a)} disabled={alertStatus[a.id] === "processing"}>
                      {alertStatus[a.id] === "processing" ? "AI解读处理中..." : "AI解读"}
                    </button>
                    <button type="button" className="ira-btn ira-btn--ghost" onClick={() => aiSuggestAlertActions(a)} disabled={alertStatus[a.id] === "processing"}>
                      {alertStatus[a.id] === "processing" ? "建议生成中..." : "处置建议"}
                    </button>
                  </div>
                  <div className="ira-card ira-card--muted" style={{ marginTop: "0.5rem" }}>
                    {alertStatus[a.id] === "processing" ? (
                      <div className="ira-muted">正在通过 CoPaw Agent 调用百炼处理，请稍候...</div>
                    ) : alertStatus[a.id] === "error" ? (
                      <div className="ira-muted">处理失败，请重试（接口不可用或超时）。</div>
                    ) : alertResult[a.id] ? (
                      <div className="ira-stack">
                        <div>
                          <strong>{alertResult[a.id].title ?? "事件解读"}</strong>
                        </div>
                        <div className="ira-muted">{alertResult[a.id].impact_scope ?? "影响范围待确认"}</div>
                        {alertResult[a.id].suggested_actions && alertResult[a.id].suggested_actions!.length > 0 && (
                          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                            {alertResult[a.id].suggested_actions!.slice(0, 3).map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        )}
                        {alertMeta[a.id] && (
                          <div className="ira-muted" style={{ marginTop: "0.3rem" }}>
                            请求时间：{alertMeta[a.id].started_at ?? "—"} ｜耗时：{alertMeta[a.id].elapsed_ms ?? 0}ms ｜LLM：
                            {alertMeta[a.id].llm_used ? `百炼(${alertMeta[a.id].llm_model ?? "default"})` : "回退"}
                            <br />
                            响应摘录：{alertMeta[a.id].response_preview ?? "—"}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ira-muted">点击“AI解读/处置建议”后，这里展示处理结果。</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="ira-sentiment__stack">
            <section className="ira-card ira-sentiment-card">
              <div className="ira-sentiment-card__head">
                <h2 className="ira-sentiment-card__title">行业情绪指数</h2>
                <span className="ira-sentiment-card__hint">0–100 · 周环比 · 可生成点评</span>
              </div>
              <ul className="ira-sentiment-sector-list">
                {sectorUi.map((s) => (
                  <li key={s.name} className="ira-sentiment-sector">
                    <div className="ira-sentiment-sector__name">{s.name}</div>
                    <div className="ira-sentiment-sector__bar-wrap" role="img" aria-label={`${s.name} 情绪 ${s.score}`}>
                      <div className="ira-sentiment-sector__bar" style={{ width: `${s.score}%` }} />
                    </div>
                    <div className="ira-sentiment-sector__nums">
                      <span>{s.score}</span>
                      <span className={s.deltaW >= 0 ? "ira-sentiment-delta--up" : "ira-sentiment-delta--down"}>
                        {s.deltaW >= 0 ? "+" : ""}
                        {s.deltaW}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="ira-card ira-sentiment-card">
              <div className="ira-sentiment-card__head">
                <h2 className="ira-sentiment-card__title">信息来源结构</h2>
              </div>
              <ul className="ira-sentiment-source">
                {sourceMixUi.map((s) => (
                  <li key={s.name} className="ira-sentiment-source__row">
                    <span className="ira-sentiment-source__name">{s.name}</span>
                    <div className="ira-sentiment-source__track">
                      <div className="ira-sentiment-source__fill" style={{ width: `${s.pct}%` }} />
                    </div>
                    <span className="ira-sentiment-source__pct">{s.pct}%</span>
                    <span className="ira-sentiment-source__count">{s.count.toLocaleString()} 条</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <section className="ira-card ira-sentiment-card">
          <div className="ira-sentiment-card__head">
            <h2 className="ira-sentiment-card__title">热点话题（API 热度）</h2>
          </div>
          <div className="ira-sentiment-topics">
            {hotTopicsUi.map((h) => (
              <span
                key={h.topic}
                className={`ira-sentiment-topic ira-sentiment-topic--${h.sentiment}`}
                style={{ fontSize: `${0.72 + (h.heat / 120) * 0.35}rem` }}
              >
                {h.topic}
                <em className="ira-sentiment-topic__heat">{h.heat}</em>
              </span>
            ))}
          </div>
        </section>

        <section className="ira-card ira-sentiment-card">
          <div className="ira-sentiment-card__head">
            <h2 className="ira-sentiment-card__title">重点标的舆情（重仓 / 核心池关联示意）</h2>
            <span className="ira-sentiment-card__hint">情感分 0–100 · 24h 声量变化</span>
          </div>
          <div className="ira-table-wrap">
            <table className="ira-table ira-sentiment-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>简称</th>
                  <th>情感分</th>
                  <th>24h 声量 Δ</th>
                  <th>讨论条数</th>
                  <th>持仓标签</th>
                  <th>关联产品（示意）</th>
                  <th>风险</th>
                </tr>
              </thead>
              <tbody>
                {stockSentUi.map((r) => {
                  const rk = riskLabel(r.risk);
                  return (
                    <tr key={r.code}>
                      <td className="ira-sentiment-mono">{r.code}</td>
                      <td>{r.name}</td>
                      <td>
                        <div className="ira-sentiment-scorecell">
                          <span>{r.score}</span>
                          <div className="ira-sentiment-scorebar">
                            <div className={`ira-sentiment-scorebar__fill ${scoreBarClass(r.score)}`} style={{ width: `${r.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className={r.change24h >= 0 ? "ira-sentiment-delta--up" : "ira-sentiment-delta--down"}>
                        {r.change24h >= 0 ? "+" : ""}
                        {r.change24h}%
                      </td>
                      <td>{r.buzz}</td>
                      <td>{r.positionTag}</td>
                      <td className="ira-sentiment-funds">{r.funds.join("；")}</td>
                      <td>
                        <span className={`ira-sentiment-risk ${rk.cls}`}>{rk.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="ira-sentiment__grid2">
          <section className="ira-card ira-sentiment-card">
            <div className="ira-sentiment-card__head">
              <h2 className="ira-sentiment-card__title">关键词监控矩阵</h2>
              <span className="ira-sentiment-card__hint">合规 / 权益 / 产品分工（演示）</span>
            </div>
            <div className="ira-table-wrap">
              <table className="ira-table">
                <thead>
                  <tr>
                    <th>关键词 / 主题</th>
                    <th>范围</th>
                    <th>24h 命中</th>
                    <th>负面占比</th>
                    <th>责任条线</th>
                  </tr>
                </thead>
                <tbody>
                  {watchMatrixUi.map((w) => (
                    <tr key={w.keyword}>
                      <td>{w.keyword}</td>
                      <td>{w.scope}</td>
                      <td>{w.hits24h}</td>
                      <td>{w.negRatio}</td>
                      <td>{w.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ira-card ira-sentiment-card">
            <div className="ira-sentiment-card__head">
              <h2 className="ira-sentiment-card__title">采集与解析管线状态</h2>
            </div>
            <ul className="ira-sentiment-pipeline">
              {ingestionPipelineUi.map((p) => (
                <li key={p.label} className="ira-sentiment-pipeline__row">
                  <span className="ira-sentiment-pipeline__label">{p.label}</span>
                  <span className={`ira-sentiment-pipeline__status ira-sentiment-pipeline__status--${p.status}`}>{p.value}</span>
                </li>
              ))}
            </ul>
            <p className="ira-sentiment-pipeline__note">
              生产环境可对接机构采购的数据源与内部 NLP；此处状态条用于 Workshop 说明数据链路设计。
            </p>
          </section>
        </div>

        <details className="ira-sentiment-api">
          <summary className="ira-sentiment-api__summary">系统编排明细（中台联调/运维）</summary>
          <p className="ira-muted" style={{ marginTop: "0.5rem" }}>
            {apiHint}
          </p>
          <div className="ira-stack" style={{ marginTop: "0.75rem" }}>
            <section className="ira-card ira-card--muted">
              <h3 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem" }}>关注词</h3>
              <div className="ira-row" style={{ marginBottom: "0.75rem" }}>
                <input className="ira-input" value={kw} onChange={(e) => setKw(e.target.value)} placeholder="新增关键词" />
                <button type="button" className="ira-btn" onClick={addKeyword}>
                  添加
                </button>
              </div>
              <div className="ira-table-wrap">
                <table className="ira-table">
                  <thead>
                    <tr>
                      <th>关键词</th>
                      <th>命中次数</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {watch.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="ira-muted">
                          暂无（演示可手动添加）
                        </td>
                      </tr>
                    ) : (
                      watch.map((x) => (
                        <tr key={x.keyword}>
                          <td>{x.keyword}</td>
                          <td>{x.count}</td>
                          <td>
                            <button type="button" className="ira-btn ira-btn--ghost" onClick={() => removeKeyword(x.keyword)}>
                              删除
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="ira-card ira-card--muted">
              <h3 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem" }}>手动录入告警</h3>
              <div className="ira-stack" style={{ maxWidth: 560 }}>
                <input
                  className="ira-input"
                  style={{ maxWidth: "none" }}
                  value={ingTitle}
                  onChange={(e) => setIngTitle(e.target.value)}
                  placeholder="标题"
                />
                <textarea className="ira-textarea" value={ingSummary} onChange={(e) => setIngSummary(e.target.value)} placeholder="摘要" rows={3} />
                <button type="button" className="ira-btn" onClick={ingest}>
                  入库
                </button>
              </div>
            </section>
            <section className="ira-card ira-card--muted">
              <h3 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem" }}>接口返回的舆情告警</h3>
              <div className="ira-table-wrap">
                <table className="ira-table">
                  <thead>
                    <tr>
                      <th>标题</th>
                      <th>来源</th>
                      <th>情感</th>
                      <th>日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="ira-muted">
                          暂无（可通过上方入库）
                        </td>
                      </tr>
                    ) : (
                      alerts.map((a) => (
                        <tr key={a.id}>
                          <td>{a.title}</td>
                          <td>{a.source_name ?? "—"}</td>
                          <td>{a.sentiment ?? "—"}</td>
                          <td>{a.published_at ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="ira-card ira-card--muted">
              <h3 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem" }}>CoPaw 编排联调（分析/报告/推送/Cron）</h3>
              <div className="ira-row" style={{ marginBottom: "0.65rem", flexWrap: "wrap" }}>
                <button type="button" className="ira-btn" onClick={runAnalyze}>
                  触发分析 run
                </button>
                <button type="button" className="ira-btn" onClick={generateReport}>
                  生成报告草稿
                </button>
                <button type="button" className="ira-btn ira-btn--ghost" onClick={runPush}>
                  执行多渠道推送
                </button>
                <input
                  className="ira-input"
                  style={{ maxWidth: "16rem" }}
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  placeholder="可选：report_id"
                />
              </div>
              {apiMsg && (
                <p className="ira-muted" style={{ margin: "0 0 0.65rem" }}>
                  {apiMsg}
                </p>
              )}
              <div className="ira-table-wrap" style={{ marginBottom: "0.65rem" }}>
                <table className="ira-table">
                  <thead>
                    <tr>
                      <th>run_id</th>
                      <th>状态</th>
                      <th>trace</th>
                      <th>开始</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineRuns.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="ira-muted">
                          暂无 run
                        </td>
                      </tr>
                    ) : (
                      pipelineRuns.slice(0, 6).map((x) => (
                        <tr key={x.run_id}>
                          <td>{x.run_id}</td>
                          <td>{x.status}</td>
                          <td>{x.trace_id ?? "—"}</td>
                          <td>{x.started_at ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="ira-table-wrap" style={{ marginBottom: "0.65rem" }}>
                <table className="ira-table">
                  <thead>
                    <tr>
                      <th>聚类组</th>
                      <th>标题</th>
                      <th>风险</th>
                      <th>情绪</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventClusters.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="ira-muted">
                          暂无聚类事件（先触发分析 run）
                        </td>
                      </tr>
                    ) : (
                      eventClusters.slice(0, 8).map((e, idx) => (
                        <tr key={`${e.dedup_group_id}-${idx}`}>
                          <td>{e.dedup_group_id ?? "—"}</td>
                          <td>{e.cluster_title ?? "—"}</td>
                          <td>{e.risk_level ?? "—"}</td>
                          <td>{e.sentiment ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="ira-row" style={{ flexWrap: "wrap" }}>
                {cronJobs.length === 0 ? (
                  <span className="ira-muted">无 Cron 配置</span>
                ) : (
                  cronJobs.map((j) => (
                    <button key={j.job_id} type="button" className="ira-btn ira-btn--ghost" onClick={() => runCron(j.job_id)}>
                      运行 {j.job_id}
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        </details>
      </div>
    </PageShell>
  );
}
