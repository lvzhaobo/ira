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

const QUICK_ENTRIES: { to: string; title: string; desc: string; tag: string }[] = [
  {
    to: "/research-qa",
    title: "研报问答 ①",
    desc: "MVP：检索、引用、合规提示与百炼/离线双态；对应 Workshop Spec Coding 初版",
    tag: "①",
  },
  {
    to: "/research-qa-change",
    title: "需求变更 ②",
    desc: "ira-1.1.0、风险标签与规格迭代演示；与 ① 对照回归",
    tag: "②",
  },
  { to: "/knowledge", title: "知识库", desc: "已登记文档与索引状态，支撑 RAG 与权限扩展", tag: "数据" },
  { to: "/compliance", title: "合规扫描", desc: "话术与材料预检，命中写入审计与血缘", tag: "合规" },
  { to: "/reports", title: "报告登记", desc: "报告/披露事项在编制—内审—合规—签章链路上的登记", tag: "流程" },
  { to: "/sentiment", title: "舆情监控", desc: "关键词、预警与联调区（机构侧多源聚合诉求）", tag: "运营" },
  { to: "/messages", title: "消息推送", desc: "钉钉/飞书/邮件 dry-run，发送前合规扫描", tag: "触达" },
  { to: "/lineage", title: "血缘追溯", desc: "结论与调用 trace，满足复核与监管问询字段模型", tag: "审计" },
  { to: "/stock-analysis", title: "个股草稿", desc: "标的分析草稿与演示行情（需授权数据源生产化）", tag: "覆盖" },
  { to: "/multi-agent-stock", title: "多 Agent", desc: "行业/量化/合规并行与合并编排演示（关卡 PR 抽检场景）", tag: "编排" },
  { to: "/settings", title: "系统与偏好", desc: "参数、持久化偏好与 Swagger / OpenAPI 入口（Debug/验收）", tag: "设置" },
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

  const load = useCallback(async () => {
    setHealthErr(false);
    const [h, k, td, sr, kb, rep] = await Promise.all([
      getJson<Health>("/system/health").catch(() => {
        setHealthErr(true);
        return null;
      }),
      getJson<Kpi>("/dashboard/kpi").catch(() => null),
      getJson<{ items: TodoItem[] }>("/dashboard/todos").catch(() => ({ items: [] })),
      getJson<{ items: RecentSession[] }>("/sessions/recent").catch(() => ({ items: [] })),
      getJson<{ items: unknown[] }>("/kb/documents").catch(() => null),
      getJson<{ items: ReportDraftRow[] }>("/reports/drafts").catch(() => null),
    ]);
    setHealth(h);
    setKpi(k);
    setTodos(td.items || []);
    setRecent(sr.items || []);
    if (kb?.items) setKbLiveCount(kb.items.length);
    else setKbLiveCount(null);
    if (rep?.items) setReportsPipelineLive(countReportsInPipeline(rep.items));
    else setReportsPipelineLive(null);
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
              与《环节与教学法映射》侧栏序号对齐：①② 拆分问答与规格变更；合规/推送/多 Agent 对应关卡 PR 抽检叙事；设置承接 Debug 与
              OpenAPI。
            </span>
          </div>
          <ul className="ira-wb-grid">
            {QUICK_ENTRIES.map((e) => (
              <li key={e.to}>
                <Link to={e.to} className="ira-wb-card">
                  <span className="ira-wb-card__tag">{e.tag}</span>
                  <span className="ira-wb-card__title">{e.title}</span>
                  <span className="ira-wb-card__desc">{e.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
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
