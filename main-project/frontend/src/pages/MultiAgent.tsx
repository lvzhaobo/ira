import { useEffect, useMemo, useState } from "react";
import { postJson } from "../api/client";
import MultiAgentDagSvg from "../components/MultiAgentDagSvg";
import PageShell from "../components/PageShell";
import {
  AGENT_ROSTER,
  HANDOFF_EDGES,
  PIPELINE_STEPS,
  STATIC_BUS,
  STATIC_DISCUSSION,
  STATIC_MERGED,
  type BusMessage,
  type DiscussionItem,
} from "../data/multiAgentMock";

type ApiAgent = {
  id: string;
  name: string;
  role_tag: string;
  status: string;
  output?: string;
  trace?: string;
  card_order?: number;
};

type Discussion = {
  utterance_id: string;
  round: number;
  speaker_id?: string;
  speaker_name: string;
  content: string;
  reply_to_utterance_id?: string | null;
  mentions?: string[];
};

type RunResponse = {
  merged_text: string;
  discussion: Discussion[];
  agents?: ApiAgent[];
  orchestration_trace?: string;
  messages?: BusMessage[];
  compliance?: { ruleset_version?: string; filtered?: boolean; decline_reason?: string | null };
  merge_trace?: string;
  trace_id?: string;
  execution_source?: "copaw" | "local_mock" | string;
};

const SPEAKER_COLOR: Record<string, string> = {
  industry: "ira-magent-bubble--industry",
  quant: "ira-magent-bubble--quant",
  risk: "ira-magent-bubble--risk",
  orch: "ira-magent-bubble--orch",
};

function bubbleClass(speakerId?: string): string {
  return SPEAKER_COLOR[speakerId ?? ""] ?? "ira-magent-bubble--default";
}

export default function MultiAgent() {
  const [sym, setSym] = useState("600519.SH");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [merged, setMerged] = useState("");
  const [discussion, setDiscussion] = useState<DiscussionItem[]>(STATIC_DISCUSSION);
  const [apiAgents, setApiAgents] = useState<ApiAgent[]>([]);
  const [orchTrace, setOrchTrace] = useState<string | null>(null);
  const [bus, setBus] = useState<BusMessage[]>(STATIC_BUS);
  const [compliance, setCompliance] = useState<RunResponse["compliance"] | null>(null);
  const [mergeTrace, setMergeTrace] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [executionSource, setExecutionSource] = useState<string | null>(null);
  const [ran, setRan] = useState(false);
  /** DAG 动画阶段：0–5 与 SVG 节点对应；仅在 loading 时递增 */
  const [dagPhase, setDagPhase] = useState(-1);

  useEffect(() => {
    if (!loading) {
      setDagPhase(-1);
      return;
    }
    setDagPhase(0);
    const timer = window.setInterval(() => {
      setDagPhase((p) => (p >= 5 ? 5 : p + 1));
    }, 420);
    return () => window.clearInterval(timer);
  }, [loading]);

  const sortedAgents = useMemo(() => {
    return [...apiAgents].sort((a, b) => (a.card_order ?? 0) - (b.card_order ?? 0));
  }, [apiAgents]);

  function agentById(id: string): ApiAgent | undefined {
    return sortedAgents.find((a) => a.id === id);
  }

  async function run() {
    setErr(null);
    setLoading(true);
    try {
      const res = await postJson<RunResponse>("/research/stock/multi-agent/run", { symbol: sym, mock: true });
      setMerged(res.merged_text);
      setDiscussion((res.discussion as DiscussionItem[]) || []);
      setApiAgents(res.agents?.length ? res.agents : []);
      setOrchTrace(res.orchestration_trace ?? null);
      setBus(res.messages?.length ? res.messages : STATIC_BUS);
      setCompliance(res.compliance ?? null);
      setMergeTrace(res.merge_trace ?? null);
      setTraceId(res.trace_id ?? null);
      setExecutionSource(res.execution_source ?? null);
      setRan(true);
    } catch {
      setErr("请求失败：请确认后端已启动（/api/v1/research/stock/multi-agent/run）。");
    } finally {
      setLoading(false);
    }
  }

  function resetPreview() {
    setRan(false);
    setMerged("");
    setDiscussion(STATIC_DISCUSSION);
    setApiAgents([]);
    setOrchTrace(null);
    setBus(STATIC_BUS);
    setCompliance(null);
    setMergeTrace(null);
    setTraceId(null);
    setExecutionSource(null);
    setErr(null);
  }

  const mergedDisplay = ran ? merged : STATIC_MERGED;

  return (
    <PageShell title="多 Agent 协作">
      <div className="ira-magent">
        <p className="ira-magent__lead">
          <strong>场景</strong>：针对单标的，由<strong>编排 Agent</strong>并行调度<strong>行业 / 量化 / 合规</strong>三只子 Agent，完成证据化输出；第二轮支持{" "}
          <strong>@互评与 reply_to</strong>，最后经<strong>合并与合规闸门</strong>生成可读结论（演示数据，非生产模型）。
        </p>

        <div className="ira-card ira-magent__run">
          <div className="ira-magent__run-row">
            <label className="ira-magent__label">
              标的代码
              <input className="ira-input" value={sym} onChange={(e) => setSym(e.target.value)} placeholder="如 600519.SH" />
            </label>
            <div className="ira-magent__run-actions">
              <button type="button" className="ira-btn" onClick={run} disabled={loading}>
                {loading ? "运行中…" : "运行协作（调用 API）"}
              </button>
              <button type="button" className="ira-btn ira-btn--ghost" onClick={resetPreview} disabled={loading}>
                恢复预览文案
              </button>
            </div>
          </div>
          {err && <p className="ira-magent__err">{err}</p>}
          {traceId && (
            <p className="ira-magent__trace">
              本次请求 trace_id：<code>{traceId}</code>
              {executionSource && (
                <>
                  {" "}
                  · 运行来源：
                  <strong>{executionSource === "copaw" ? "CoPaw 多Agent" : "本地编排回退"}</strong>
                </>
              )}
              {mergeTrace && (
                <>
                  {" "}
                  · merge_trace：<code>{mergeTrace.slice(0, 12)}…</code>
                </>
              )}
            </p>
          )}
        </div>

        <section className="ira-card ira-magent__section" aria-labelledby="magent-pipeline-title">
          <h2 id="magent-pipeline-title" className="ira-magent__h2">
            协作拓扑（DAG）
          </h2>
          <p className="ira-magent__sub">
            编排 Agent 对子任务 <strong>fan-out 并行</strong>，收集 artifact 后可触发 <strong>第二轮 reply_to</strong>（图中虚线示意），再 <strong>merge</strong> 进入合规闸门。
            点击「运行协作」时，下图将按阶段高亮并播放连线动效。
          </p>
          <MultiAgentDagSvg phase={dagPhase} loading={loading} completed={ran} />
          <ol className="ira-magent-pipeline">
            {PIPELINE_STEPS.map((s, i) => (
              <li key={s.id} className="ira-magent-pipeline__step">
                <span className="ira-magent-pipeline__idx">{i + 1}</span>
                <span className="ira-magent-pipeline__label">{s.label}</span>
                {s.sub && <span className="ira-magent-pipeline__sub">{s.sub}</span>}
                {i < PIPELINE_STEPS.length - 1 && <span className="ira-magent-pipeline__arrow" aria-hidden />}
              </li>
            ))}
          </ol>
          <ul className="ira-magent-handoff">
            {HANDOFF_EDGES.map((e) => (
              <li key={`${e.from}-${e.to}`} className="ira-magent-handoff__item">
                <span className="ira-magent-handoff__from">{e.from}</span>
                <span className="ira-magent-handoff__edge">{e.label}</span>
                <span className="ira-magent-handoff__to">{e.to}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ira-magent__section" aria-labelledby="magent-roster-title">
          <h2 id="magent-roster-title" className="ira-magent__h2">
            Agent 阵容与工具
          </h2>
          <div className="ira-magent-roster">
            {AGENT_ROSTER.map((roster) => {
              const api = roster.id !== "orch" ? agentById(roster.id) : undefined;
              const isOrch = roster.id === "orch";
              const status = !ran ? "idle" : isOrch ? "done" : api?.status ?? "idle";
              const output = isOrch
                ? ran && orchTrace
                  ? `编排 trace：${orchTrace}\n并行调度 industry / quant / risk → 收集 artifact → 触发第二轮互评 → 调用 merge。`
                  : "等待运行：将生成 orchestration_trace，并驱动子 Agent 并行执行。"
                : ran && api?.output
                  ? api.output
                  : `（预览）${roster.responsibility}`;

              return (
                <article key={roster.id} className={`ira-magent-agent ira-magent-agent--${roster.id}`}>
                  <header className="ira-magent-agent__head">
                    <span className="ira-magent-agent__dot" aria-hidden />
                    <div>
                      <h3 className="ira-magent-agent__name">{roster.name}</h3>
                      <p className="ira-magent-agent__role">{roster.roleTag}</p>
                    </div>
                    <span className={`ira-magent-agent__status ira-magent-agent__status--${status === "done" ? "done" : "idle"}`}>{status}</span>
                  </header>
                  <p className="ira-magent-agent__resp">{roster.responsibility}</p>
                  <div className="ira-magent-agent__tools">
                    {roster.tools.map((t) => (
                      <span key={t} className="ira-magent-tool">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="ira-magent-agent__out">
                    <span className="ira-magent-agent__out-label">输出 / 状态</span>
                    <p className="ira-magent-agent__out-body">{output}</p>
                    {!isOrch && api?.trace && ran && (
                      <p className="ira-magent-agent__subtrace">
                        sub_trace: <code>{api.trace.slice(0, 16)}…</code>
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="ira-card ira-magent__section" aria-labelledby="magent-bus-title">
          <h2 id="magent-bus-title" className="ira-magent__h2">
            消息总线（Handoff log）
          </h2>
          <p className="ira-magent__sub">模拟 BFF ↔ 编排 ↔ 子 Agent 的请求/回传顺序；运行后与后端返回对齐。</p>
          <div className="ira-table-wrap">
            <table className="ira-table ira-magent-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>From</th>
                  <th>To</th>
                  <th>类型</th>
                  <th>内容</th>
                </tr>
              </thead>
              <tbody>
                {bus.map((m, i) => (
                  <tr key={`${m.t}-${i}`}>
                    <td className="ira-magent-mono">{m.t}</td>
                    <td>{m.from}</td>
                    <td>{m.to}</td>
                    <td>
                      <span className={`ira-magent-kind ira-magent-kind--${m.kind}`}>{m.kind}</span>
                    </td>
                    <td className="ira-magent-bus-body">{m.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ira-card ira-magent__section" aria-labelledby="magent-discuss-title">
          <h2 id="magent-discuss-title" className="ira-magent__h2">
            多轮讨论与互评（reply_to）
          </h2>
          <p className="ira-magent__sub">同一标的下多 Agent 发言；<strong>第二轮</strong>可出现对上一轮结论的引用与修正（后端以 reply_to 关联）。</p>
          <div className="ira-magent-discuss">
            {discussion.map((d) => {
              const reply = d.reply_to_utterance_id ? (
                <span className="ira-magent-reply">
                  回复 utterance <code>{String(d.reply_to_utterance_id).slice(0, 8)}…</code>
                  {d.mentions?.length ? ` · mentions: ${d.mentions.join(", ")}` : ""}
                </span>
              ) : null;
              return (
                <article key={d.utterance_id} className={`ira-magent-bubble ${bubbleClass(d.speaker_id)}`}>
                  <header className="ira-magent-bubble__head">
                    <span className="ira-magent-bubble__round">R{d.round}</span>
                    <strong className="ira-magent-bubble__who">{d.speaker_name}</strong>
                    {reply}
                  </header>
                  <p className="ira-magent-bubble__text">{d.content}</p>
                </article>
              );
            })}
          </div>
        </section>

        <div className="ira-magent__grid2">
          <section className="ira-card ira-magent__section" aria-labelledby="magent-comp-title">
            <h2 id="magent-comp-title" className="ira-magent__h2">
              合规闸门
            </h2>
            {!ran ? (
              <p className="ira-muted">运行后展示接口返回的 ruleset 与过滤结果。</p>
            ) : compliance ? (
              <ul className="ira-magent-compliance">
                <li>
                  规则集版本：<strong>{compliance.ruleset_version ?? "—"}</strong>
                </li>
                <li>
                  是否拦截输出：<strong>{compliance.filtered ? "是" : "否"}</strong>
                </li>
                <li>
                  原因：<strong>{compliance.decline_reason ?? "—"}</strong>
                </li>
              </ul>
            ) : (
              <p className="ira-muted">无 compliance 字段</p>
            )}
          </section>
          <section className="ira-card ira-magent__section" aria-labelledby="magent-merge-title">
            <h2 id="magent-merge-title" className="ira-magent__h2">
              合并结论（merged_text）
            </h2>
            <pre className="ira-pre ira-magent-merge">{mergedDisplay}</pre>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
