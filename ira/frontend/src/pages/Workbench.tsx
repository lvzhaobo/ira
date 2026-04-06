import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../api/client";
import PageShell from "../components/PageShell";

type Health = {
  ok?: boolean;
  ruleset_version?: string;
  index_ver?: string;
  mock_quote?: boolean;
  research_qa_llm?: { enabled?: boolean; provider?: string | null; model?: string | null };
};

type Kpi = {
  sessions_today?: number;
  pending_review?: number;
  reports_in_pipeline?: number;
  kb_documents?: number;
  data_cutoff_note?: string;
};

type TodoItem = {
  id?: number;
  title: string;
  owner?: string;
  due?: string;
  meta?: string;
  level?: string;
};

type RecentSession = {
  trace_id?: string;
  type?: string;
  summary?: string;
  time?: string;
  review?: string;
};

type ReportDraftRow = { workflow_stage?: string; status?: string };
type OpsSummary = {
  multi_agent?: {
    total_runs?: number;
    pending_reviews?: number;
    approved_reviews?: number;
    rejected_reviews?: number;
  };
  notify?: {
    total_deliveries?: number;
    sent_count?: number;
    pending_dispatch_count?: number;
  };
};

/**
 * 与侧栏「五大核心模块」一致（不含工作台：总览单独占一栏）。
 * 映射：`modules-practice` 中 M01 对话、M03 知识库、M05 多 Agent；合规/舆情为 ira 主线投研风控与市场面。
 */
const CORE_MODULE_ENTRIES: { to: string; title: string; desc: string; tag: string }[] = [
  {
    to: "/research-qa-change",
    title: "研报问答",
    desc: "主问答入口：规格迭代与引用链；叙事对齐 M01「投研助手基础」与 Spec 变更",
    tag: "M1",
  },
  {
    to: "/stock-analysis",
    title: "个股覆盖",
    desc: "M2 数据消费主入口：聚合快照优先、mock 回退，承接 ingest/data hub。",
    tag: "M2",
  },
  {
    to: "/knowledge",
    title: "知识库",
    desc: "文档登记与 RAG 支撑；纵深对齐 M03「知识库与问答」",
    tag: "M3",
  },
  {
    to: "/messages",
    title: "消息推送",
    desc: "M4 主入口：渠道投递、发送前合规、投递历史与回溯。",
    tag: "M4",
  },
  {
    to: "/multi-agent-stock",
    title: "多 Agent",
    desc: "多角色编排与合并；叙事对齐 M05「多 Agent 投研」",
    tag: "M5",
  },
];

/** 侧栏「扩展与演示」：含血缘（追溯专题）、推送（M4）等，课堂按需选讲 */
const EXTENDED_QUICK_ENTRIES: { to: string; title: string; desc: string; tag: string }[] = [
  {
    to: "/research-qa",
    title: "研报问答 ①（MVP）",
    desc: "简化链路；默认不在侧栏，设置中可打开「显示研报问答①」",
    tag: "①",
  },
  {
    to: "/lineage",
    title: "数据血缘",
    desc: "与 M2 对照：trace 与披露血缘（下游可追溯）；ingest 管线在 module-02",
    tag: "M2",
  },
  { to: "/compliance", title: "合规扫描", desc: "发送、问答、报告前的规则校验与审计扩展页", tag: "风控" },
  { to: "/sentiment", title: "舆情分析", desc: "市场舆情看板与告警，作为研究辅助能力扩展", tag: "舆情" },
  { to: "/skills", title: "SKILL", desc: "能力与工具注入示意；可与 CoPaw 技能叙事对照", tag: "技能" },
  { to: "/reports", title: "报告登记", desc: "编制—内审—合规链路登记演示", tag: "流程" },
  { to: "/settings", title: "系统与偏好", desc: "参数、OpenAPI 入口与 MVP 导航开关", tag: "设置" },
];

function todoLevelClass(level?: string): string {
  switch (level) {
    case "red":
      return "ira-wb-todo__lvl--red";
    case "amber":
      return "ira-wb-todo__lvl--amber";
    default:
      return "ira-wb-todo__lvl--slate";
  }
}

function sessionTypeLabel(t?: string): string {
  switch (t) {
    case "qa_answer":
      return "问答";
    case "stock_draft":
      return "个股草稿";
    case "compliance_scan":
      return "合规扫描";
    default:
      return t ?? "活动";
  }
}

function countReportsInPipeline(items: ReportDraftRow[]): number {
  return items.filter((d) => (d.workflow_stage ?? d.status ?? "") !== "已定稿").length;
}

export default function Workbench() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthErr, setHealthErr] = useState(false);
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [recent, setRecent] = useState<RecentSession[]>([]);
  /** null = 尚未拉取或失败，用 kpi 静态兜底 */
  const [kbLiveCount, setKbLiveCount] = useState<number | null>(null);
  const [reportsPipelineLive, setReportsPipelineLive] = useState<number | null>(null);
  const [opsSummary, setOpsSummary] = useState<OpsSummary | null>(null);

  const load = useCallback(async () => {
    setHealthErr(false);
    const [h, k, td, sr, kb, rep, ops] = await Promise.all([
      getJson<Health>("/system/health").catch(() => {
        setHealthErr(true);
        return null;
      }),
      getJson<Kpi>("/dashboard/kpi").catch(() => null),
      getJson<{ items: TodoItem[] }>("/dashboard/todos").catch(() => ({ items: [] })),
      getJson<{ items: RecentSession[] }>("/sessions/recent").catch(() => ({ items: [] })),
      getJson<{ items: unknown[] }>("/kb/documents").catch(() => null),
      getJson<{ items: ReportDraftRow[] }>("/reports/drafts").catch(() => null),
      getJson<OpsSummary>("/system/ops/summary").catch(() => null),
    ]);
    setHealth(h);
    setKpi(k);
    setTodos(td.items || []);
    setRecent(sr.items || []);
    if (kb?.items) setKbLiveCount(kb.items.length);
    else setKbLiveCount(null);
    if (rep?.items) setReportsPipelineLive(countReportsInPipeline(rep.items));
    else setReportsPipelineLive(null);
    setOpsSummary(ops);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const llmOn = health?.research_qa_llm?.enabled;

  return (
    <PageShell title="投研工作台" note={null}>
      <div className="ira-wb">
        <header className="ira-wb__intro">
          <p className="ira-wb__lead">
            对标<strong>基金/资管投研日常动线</strong>：先看<strong>待办与复核</strong>、再进<strong>材料与问答</strong>，输出前过<strong>合规与登记</strong>。
            布局按调研结论拆为「概览 → 快捷入口 → 任务队列 → 最近活动 → 系统状态」，<strong>非三栏工作台</strong>；数据以 API + 本地 JSON 演示为主。
          </p>
          <p className="ira-wb__meta">
            <span className="ira-wb__pill">{kpi?.data_cutoff_note ?? "数据口径见 KPI 区说明"}</span>
            {healthErr && <span className="ira-wb__pill ira-wb__pill--warn">后端未连接：请先启动 Flask :5000</span>}
          </p>
        </header>

        <section className="ira-wb-section" aria-labelledby="wb-kpi">
          <div className="ira-wb-section__head">
            <h2 id="wb-kpi" className="ira-wb-section__title">
              今日概览
            </h2>
            <span className="ira-wb-section__sub">
              与 AlphaSense/内网知识库类产品共性：先呈现「量」与「待处置」，再下钻功能模块。其中<strong>知识库册数</strong>与
              <strong>报告在途</strong>在联调成功时取自 <code>GET /kb/documents</code>、<code>GET /reports/drafts</code>（未结环节≠已定稿）。
            </span>
          </div>
          <div className="ira-wb-kpis">
            <div className="ira-wb-kpi">
              <span className="ira-wb-kpi__label">本会话/问答活跃度（演示）</span>
              <span className="ira-wb-kpi__value">{kpi?.sessions_today ?? "—"}</span>
              <span className="ira-wb-kpi__hint">sessions_today</span>
            </div>
            <div className="ira-wb-kpi">
              <span className="ira-wb-kpi__label">待复核/待处置</span>
              <span className="ira-wb-kpi__value">{kpi?.pending_review ?? "—"}</span>
              <span className="ira-wb-kpi__hint">含问答结论、话术等（演示字段）</span>
            </div>
            <div className="ira-wb-kpi">
              <span className="ira-wb-kpi__label">报告在途（登记簿）</span>
              <span className="ira-wb-kpi__value">
                {reportsPipelineLive !== null ? reportsPipelineLive : (kpi?.reports_in_pipeline ?? "—")}
              </span>
              <span className="ira-wb-kpi__hint">
                {reportsPipelineLive !== null ? "实时：未处于「已定稿」的条数" : "静态 KPI 兜底；联调后自动替换"}
              </span>
            </div>
            <div className="ira-wb-kpi">
              <span className="ira-wb-kpi__label">知识库已登记</span>
              <span className="ira-wb-kpi__value">{kbLiveCount !== null ? kbLiveCount : (kpi?.kb_documents ?? "—")}</span>
              <span className="ira-wb-kpi__hint">
                {kbLiveCount !== null ? "实时：GET /kb/documents 条数" : "静态 KPI 示意；联调后自动替换"}
              </span>
            </div>
            <div className="ira-wb-kpi ira-wb-kpi--accent">
              <span className="ira-wb-kpi__label">模型服务</span>
              <span className="ira-wb-kpi__value">{healthErr ? "—" : llmOn ? "百炼在线" : "离线占位"}</span>
              <span className="ira-wb-kpi__hint">{llmOn ? (health?.research_qa_llm?.model ?? "通义") : "未配置 DASHSCOPE_API_KEY"}</span>
            </div>
          </div>
        </section>

        <section className="ira-wb-section" aria-labelledby="wb-quick">
          <div className="ira-wb-section__head">
            <h2 id="wb-quick" className="ira-wb-section__title">
              能力入口
            </h2>
            <span className="ira-wb-section__sub">
              当前页为<strong>工作台总览</strong>；下方<strong>五大核心模块</strong>与侧栏第二组一致（M1 问答 / M2 个股覆盖 / M3
              知识库 / M4 推送 / M5 多Agent）。其余为<strong>扩展与演示</strong>（含血缘、合规、舆情等）。
            </span>
          </div>
          <ul className="ira-wb-grid ira-wb-grid--core">
            {CORE_MODULE_ENTRIES.map((e) => (
              <li key={e.to}>
                <Link to={e.to} className="ira-wb-card">
                  <span className="ira-wb-card__tag">{e.tag}</span>
                  <span className="ira-wb-card__title">{e.title}</span>
                  <span className="ira-wb-card__desc">{e.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="ira-wb-subsection" aria-labelledby="wb-quick-ext">
            <h3 id="wb-quick-ext" className="ira-wb-subsection__title">
              扩展与演示
            </h3>
            <p className="ira-wb-subsection__note">
              以下页面在页头与侧栏标为「扩展」：含数据血缘（M02 追溯专题）、个股、推送（M4）、报告登记与系统调试等；默认不要求与五大核心同等课时。
            </p>
            <ul className="ira-wb-grid">
              {EXTENDED_QUICK_ENTRIES.map((e) => (
                <li key={e.to}>
                  <Link to={e.to} className="ira-wb-card ira-wb-card--secondary">
                    <span className="ira-wb-card__tag">扩展 · {e.tag}</span>
                    <span className="ira-wb-card__title">{e.title}</span>
                    <span className="ira-wb-card__desc">{e.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="ira-wb-split">
          <section className="ira-wb-section ira-wb-section--panel" aria-labelledby="wb-todo">
            <div className="ira-wb-section__head">
              <h2 id="wb-todo" className="ira-wb-section__title">
                待办与复核队列
              </h2>
              <button type="button" className="ira-wb-ghost" onClick={() => void load()}>
                刷新
              </button>
            </div>
            <p className="ira-wb-hint">来源 <code>GET /dashboard/todos</code>；生产可对接 OA/邮件/合规工单。</p>
            <ul className="ira-wb-todos">
              {todos.length === 0 ? (
                <li className="ira-wb-todo ira-wb-todo--empty">暂无待办</li>
              ) : (
                todos.map((t) => (
                  <li key={t.id ?? t.title} className="ira-wb-todo">
                    <span className={`ira-wb-todo__lvl ${todoLevelClass(t.level)}`} title="优先级示意">
                      {t.level === "red" ? "急" : t.level === "amber" ? "办" : "常"}
                    </span>
                    <div className="ira-wb-todo__body">
                      <div className="ira-wb-todo__title">{t.title}</div>
                      <div className="ira-wb-todo__row">
                        {t.owner && <span>{t.owner}</span>}
                        {t.due && <span className="ira-wb-todo__due">截止 {t.due}</span>}
                      </div>
                      {t.meta && <div className="ira-wb-todo__meta">{t.meta}</div>}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="ira-wb-section ira-wb-section--panel" aria-labelledby="wb-recent">
            <div className="ira-wb-section__head">
              <h2 id="wb-recent" className="ira-wb-section__title">
                最近投研活动
              </h2>
              <Link to="/lineage" className="ira-wb-ghost">
                打开血缘
              </Link>
            </div>
            <p className="ira-wb-hint">来源 <code>GET /sessions/recent</code>；强调<strong>可追溯</strong>（调研：分析师关心材料与结论留痕）。</p>
            <ul className="ira-wb-recent">
              {recent.length === 0 ? (
                <li className="ira-wb-recent__empty">暂无记录</li>
              ) : (
                recent.map((r) => (
                  <li key={r.trace_id ?? r.summary} className="ira-wb-recent__row">
                    <div className="ira-wb-recent__top">
                      <span className="ira-wb-recent__type">{sessionTypeLabel(r.type)}</span>
                      <span className="ira-wb-recent__time">{r.time}</span>
                    </div>
                    <div className="ira-wb-recent__sum">{r.summary}</div>
                    <div className="ira-wb-recent__foot">
                      {r.review && <span className="ira-wb-recent__rev">{r.review}</span>}
                      {r.trace_id && (
                        <Link className="ira-wb-recent__link" to={`/lineage?tid=${encodeURIComponent(r.trace_id)}`}>
                          trace · {r.trace_id}
                        </Link>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <section className="ira-wb-section ira-wb-section--risk" aria-labelledby="wb-sys">
          <div className="ira-wb-section__head">
            <h2 id="wb-sys" className="ira-wb-section__title">
              系统与合规提示
            </h2>
          </div>
          <div className="ira-wb-section__head" style={{ marginBottom: "0.45rem" }}>
            <span className="ira-wb-section__sub">
              闭环状态（M5 审核 → M4 推送）：来自 <code>GET /system/ops/summary</code>，用于课堂演示“未审核不可正式发送”。
            </span>
          </div>
          <div className="ira-wb-kpis" style={{ marginBottom: "0.75rem" }}>
            <div className="ira-wb-kpi">
              <span className="ira-wb-kpi__label">多Agent待审核</span>
              <span className="ira-wb-kpi__value">{opsSummary?.multi_agent?.pending_reviews ?? "—"}</span>
              <span className="ira-wb-kpi__hint">pending_reviews</span>
            </div>
            <div className="ira-wb-kpi">
              <span className="ira-wb-kpi__label">多Agent已通过</span>
              <span className="ira-wb-kpi__value">{opsSummary?.multi_agent?.approved_reviews ?? "—"}</span>
              <span className="ira-wb-kpi__hint">approved_reviews</span>
            </div>
            <div className="ira-wb-kpi">
              <span className="ira-wb-kpi__label">推送待发送</span>
              <span className="ira-wb-kpi__value">{opsSummary?.notify?.pending_dispatch_count ?? "—"}</span>
              <span className="ira-wb-kpi__hint">pending_dispatch_count</span>
            </div>
            <div className="ira-wb-kpi">
              <span className="ira-wb-kpi__label">推送已发送</span>
              <span className="ira-wb-kpi__value">{opsSummary?.notify?.sent_count ?? "—"}</span>
              <span className="ira-wb-kpi__hint">sent_count</span>
            </div>
          </div>
          <div className="ira-wb-sys">
            <dl className="ira-wb-dl">
              <dt>规则集版本</dt>
              <dd>{health?.ruleset_version ?? "—"}</dd>
              <dt>索引/版本标识</dt>
              <dd>{health?.index_ver ?? "—"}</dd>
              <dt>行情数据</dt>
              <dd>{health?.mock_quote ? "演示 Mock（非 Wind 实时）" : "—"}</dd>
            </dl>
            <ul className="ira-wb-risklist">
              <li>本页展示内容<strong>不构成投资建议</strong>；对外材料须走公司披露与合规流程。</li>
              <li>权限、水印、部门/组合维度的访问控制为生产必备能力，当前 Workshop 为原型级演示。</li>
              <li>与调研一致：优先保证<strong>引用可追溯</strong>、<strong>合规话术</strong>与<strong>Mock/在线模型可区分</strong>。</li>
            </ul>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
