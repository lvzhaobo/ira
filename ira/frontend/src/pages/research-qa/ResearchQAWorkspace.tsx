import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getJson, postFormData, postJson } from "../../api/client";
import PageShell from "../../components/PageShell";
import type { PageTagKind } from "../../config/pageModes";

type LlmInfo = { enabled: boolean; provider?: string | null; model?: string | null };

export type EvidenceRef = {
  doc_id: string;
  ref?: string;
  page?: number | null;
  retrieval_score?: number | null;
};

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  trace?: string;
  risk?: string;
  model?: string;
  isError?: boolean;
};

type QaSession = {
  id: string;
  title: string;
  messages: Msg[];
  updatedAt: number;
};

type TaskItem = {
  id: string;
  title: string;
  group: string;
  due: string;
  priority: "P0" | "P1" | "P2";
  preset: string;
};

const QUICK_MVP: { short: string; full: string }[] = [
  { short: "白酒景气度", full: "请概括白酒行业近季度景气度、渠道库存与估值水平的主要结论，并说明信息局限。" },
  { short: "茅台分析框架", full: "贵州茅台：请从盈利质量、批价走势与政策风险三方面给出投研分析框架（不构成投资建议）。" },
  { short: "龙头 vs 成长", full: "对比消费龙头与成长赛道在当前宏观环境下的配置逻辑，仅讨论框架不涉及具体买卖建议。" },
  { short: "材料不足披露", full: "在缺乏内部研报片段时，模型回答的局限性应如何向投资委员会与合规部门披露？" },
];

const QUICK_CHANGE: { short: string; full: string }[] = [
  { short: "集中度与风险", full: "请评估贵州茅台持仓对组合集中度与流动性风险的影响，并给出风险等级（ira-1.1.0 场景）。" },
  { short: "内控 8% 复核", full: "若组合需满足「单一标的不超过 8%」的内控，请列出需要复核的合规与披露要点。" },
  { short: "风险标签摘要", full: "请输出带风险标签的结论摘要，并说明是否涉及个股推荐语义。" },
  { short: "依据范围", full: "请说明本回答所依据的材料范围；若引用仅为公开信息，请明确标注。" },
];

const TASKS_MVP: TaskItem[] = [
  {
    id: "wk-consumption",
    title: "消费组周报 · 白酒景气摘要",
    group: "消费",
    due: "本周五",
    priority: "P1",
    preset:
      "作为消费组本周周报素材：请概括白酒板块景气度、渠道库存与估值，并列出 3 条需投资总监关注的争议点（不构成投资建议）。",
  },
  {
    id: "adhoc-moutai",
    title: "临时议题 · 茅台批价跟踪",
    group: "个股",
    due: "今日",
    priority: "P0",
    preset: "请梳理贵州茅台近期批价与渠道反馈的公开信息要点，并说明数据缺口与风险提示（不构成投资建议）。",
  },
  {
    id: "macro-liquidity",
    title: "宏观联动 · 流动性对消费估值影响",
    group: "宏观",
    due: "下周三",
    priority: "P2",
    preset: "在利率与流动性框架下，简述对必选消费估值中枢的影响路径，避免个股推荐表述。",
  },
];

const TASKS_CHANGE: TaskItem[] = [
  {
    id: "risk-hold",
    title: "组合复核 · 重仓集中度",
    group: "风控",
    due: "今日",
    priority: "P0",
    preset: "请评估贵州茅台持仓对组合集中度与流动性风险的影响，并给出风险等级（ira-1.1.0）。",
  },
  {
    id: "comp-8",
    title: "合规 · 单一标的 8% 内控",
    group: "合规",
    due: "本周",
    priority: "P1",
    preset: "若组合需满足「单一标的不超过 8%」的内控，请列出需复核的合规与披露要点。",
  },
];

const PIPELINE_LABELS = ["检索知识库与元数据", "融合会话与材料上下文", "调用大模型生成", "合规规则预检（演示）"];

/** 待关注：模拟投研协同里「尚未处理」的提醒（可标记已关注） */
type AttentionItem = { id: string; title: string; hint: string; preset: string };

const ATTENTION_MVP: AttentionItem[] = [
  {
    id: "att-kb-followup",
    title: "知识库有新文档时建议追问",
    hint: "入库后可用一句话拉摘要",
    preset:
      "请根据当前知识库已登记的研报/材料，列出与消费行业相关的 3 条要点，并说明哪些结论受材料覆盖范围限制（不构成投资建议）。",
  },
  {
    id: "att-meeting",
    title: "例会待跟进：白酒渠道反馈",
    hint: "演示协同任务",
    preset: "请整理白酒渠道库存与批价相关的公开信息要点，供组内例会讨论（不构成投资建议）。",
  },
  {
    id: "att-risk-review",
    title: "含风险提示类回答建议复核",
    hint: "合规视角",
    preset: "请说明在输出中带「风险」表述时，投研侧应如何留痕与复核，避免被误解为承诺或诱导（框架性说明即可）。",
  },
];

const ATTENTION_CHANGE: AttentionItem[] = [
  {
    id: "att-spec",
    title: "ira-1.1.0 风险标签待抽检",
    hint: "规格变更后建议抽一条验证",
    preset: "请用一段话说明组合集中度风险，并给出风险等级与依据范围（ira-1.1.0）。",
  },
  {
    id: "att-single-name",
    title: "个股相关回答需核对免责声明",
    hint: "合规待关注",
    preset: "请列出在回答涉及个股时，必须在文末或段落中提示的合规措辞要点（不涉及买卖建议）。",
  },
];

type RecentEntry = { text: string; ts: number; sessionId: string };

function recentStorageKey(mode: string) {
  return `ira-qa-recent-v1-${mode}`;
}

function attentionDismissKey(mode: string) {
  return `ira-qa-att-dismiss-v1-${mode}`;
}

function mergeRecent(mode: string, text: string, sessionId: string): RecentEntry[] {
  const key = recentStorageKey(mode);
  let list: RecentEntry[] = [];
  try {
    const raw = localStorage.getItem(key);
    list = raw ? (JSON.parse(raw) as RecentEntry[]) : [];
  } catch {
    list = [];
  }
  list = list.filter((x) => x.text !== text);
  list.unshift({ text, ts: Date.now(), sessionId });
  list = list.slice(0, 12);
  localStorage.setItem(key, JSON.stringify(list));
  return list;
}

function loadRecent(mode: string): RecentEntry[] {
  try {
    const raw = localStorage.getItem(recentStorageKey(mode));
    return raw ? (JSON.parse(raw) as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

function loadDismissed(mode: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(attentionDismissKey(mode)) || "[]") as string[];
  } catch {
    return [];
  }
}

function saveDismissed(mode: string, ids: string[]) {
  localStorage.setItem(attentionDismissKey(mode), JSON.stringify(ids));
}

function uid() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function storeKey(mode: string) {
  return `ira-qa-workspace-v1-${mode}`;
}

function loadStore(mode: string): { sessions: QaSession[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(storeKey(mode));
    if (!raw) return { sessions: [], activeId: null };
    const j = JSON.parse(raw) as { sessions: QaSession[]; activeId: string | null };
    return { sessions: j.sessions || [], activeId: j.activeId ?? null };
  } catch {
    return { sessions: [], activeId: null };
  }
}

function saveStore(mode: string, sessions: QaSession[], activeId: string | null) {
  localStorage.setItem(storeKey(mode), JSON.stringify({ sessions, activeId }));
}

export default function ResearchQAWorkspace({ mode }: { mode: "mvp" | "change" }) {
  const [sessions, setSessions] = useState<QaSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [llm, setLlm] = useState<LlmInfo | null>(null);
  const [healthReady, setHealthReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "ok" | "fail" } | null>(null);
  const [kbCount, setKbCount] = useState<number | null>(null);
  const [kbIndexVer, setKbIndexVer] = useState<string>("");
  const [lastEvidence, setLastEvidence] = useState<EvidenceRef[]>([]);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(true);
  const [recentList, setRecentList] = useState<RecentEntry[]>([]);
  const [attentionDismissed, setAttentionDismissed] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const pipelineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const quick = mode === "mvp" ? QUICK_MVP : QUICK_CHANGE;
  const tasks = mode === "mvp" ? TASKS_MVP : TASKS_CHANGE;

  const activeSession = useMemo(() => sessions.find((s) => s.id === activeId) ?? null, [sessions, activeId]);
  const messages = activeSession?.messages ?? [];

  const loadHealth = useCallback(() => {
    getJson<{ research_qa_llm?: LlmInfo }>("/system/health")
      .then((h) => setLlm(h.research_qa_llm ?? { enabled: false }))
      .catch(() => setLlm({ enabled: false }))
      .finally(() => setHealthReady(true));
  }, []);

  const loadKb = useCallback(() => {
    Promise.all([
      getJson<{ items: unknown[] }>("/kb/documents").catch(() => ({ items: [] })),
      getJson<{ index_ver?: string }>("/kb/index/status").catch(() => ({})),
    ]).then(([docs, st]) => {
      setKbCount((docs.items || []).length);
      setKbIndexVer(st.index_ver ?? "—");
    });
  }, []);

  useEffect(() => {
    loadHealth();
    loadKb();
  }, [loadHealth, loadKb]);

  useEffect(() => {
    setRecentList(loadRecent(mode));
    setAttentionDismissed(loadDismissed(mode));
  }, [mode]);

  useEffect(() => {
    const { sessions: ss, activeId: aid } = loadStore(mode);
    if (ss.length === 0) {
      const id = `sess_${mode}_${Date.now().toString(36)}`;
      const s: QaSession = { id, title: "新会话", messages: [], updatedAt: Date.now() };
      setSessions([s]);
      setActiveId(id);
      saveStore(mode, [s], id);
    } else {
      setSessions(ss);
      setActiveId(aid && ss.some((x) => x.id === aid) ? aid : ss[0].id);
    }
  }, [mode]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (pipelineTimerRef.current) clearInterval(pipelineTimerRef.current);
    };
  }, []);

  const persistSessions = useCallback(
    (next: QaSession[], aid: string | null) => {
      setSessions(next);
      if (aid !== null) setActiveId(aid);
      saveStore(mode, next, aid);
    },
    [mode]
  );

  function newSession() {
    const id = `sess_${mode}_${Date.now().toString(36)}`;
    const s: QaSession = { id, title: "新会话", messages: [], updatedAt: Date.now() };
    setSessions((prev) => {
      const next = [s, ...prev];
      saveStore(mode, next, id);
      return next;
    });
    setActiveId(id);
    setQ("");
    setLastEvidence([]);
  }

  function switchSession(id: string, opts?: { query?: string }) {
    setActiveId(id);
    setSessions((prev) => {
      saveStore(mode, prev, id);
      return prev;
    });
    setQ(opts?.query ?? "");
    setLastEvidence([]);
  }

  const updateSessionMessages = useCallback(
    (sessionId: string, updater: (m: Msg[]) => Msg[]) => {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId) return s;
          const nm = updater(s.messages);
          const firstUser = nm.find((x) => x.role === "user");
          const title =
            s.title === "新会话" && firstUser
              ? `${firstUser.content.slice(0, 22)}${firstUser.content.length > 22 ? "…" : ""}`
              : s.title;
          return { ...s, messages: nm, title, updatedAt: Date.now() };
        });
        saveStore(mode, next, activeId);
        return next;
      });
    },
    [activeId, mode]
  );

  function startPipelineAnim() {
    setPipelineStep(0);
    if (pipelineTimerRef.current) clearInterval(pipelineTimerRef.current);
    let i = 0;
    pipelineTimerRef.current = setInterval(() => {
      i += 1;
      setPipelineStep(Math.min(i, PIPELINE_LABELS.length - 1));
      if (i >= PIPELINE_LABELS.length - 1) {
        if (pipelineTimerRef.current) clearInterval(pipelineTimerRef.current);
      }
    }, 420);
  }

  function finishPipeline(ok: boolean) {
    if (pipelineTimerRef.current) {
      clearInterval(pipelineTimerRef.current);
      pipelineTimerRef.current = null;
    }
    setPipelineStep(ok ? PIPELINE_LABELS.length : -1);
  }

  const runAsk = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      const sid = activeId;
      if (!sid) return;

      setLoading(true);
      startPipelineAnim();
      updateSessionMessages(sid, (m) => [...m, { id: uid(), role: "user", content: trimmed }]);

      const headers: Record<string, string> = {};
      if (mode === "change") headers["X-Spec-Version"] = "ira-1.1.0";
      const body =
        mode === "change"
          ? { session_id: sid, query: trimmed, require_risk_label: true }
          : { session_id: sid, query: trimmed, spec_milestone: "mvp-v1" };

      try {
        const res = await postJson<{
          answer: string;
          trace_id: string;
          risk_level?: string;
          model?: { model_id?: string };
          evidence_refs?: EvidenceRef[];
        }>("/research/qa/ask", body, headers);
        const ans = res.answer + (res.risk_level ? `\n\n【风险标签】${res.risk_level}` : "");
        const ev = res.evidence_refs ?? [];
        setLastEvidence(ev);
        updateSessionMessages(sid, (m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            content: ans,
            trace: res.trace_id,
            risk: res.risk_level,
            model: res.model?.model_id,
          },
        ]);
        finishPipeline(true);
        setRecentList(mergeRecent(mode, trimmed, sid));
        setToast({ text: llm?.enabled ? "分析流水线已完成" : "已返回占位回答", type: "ok" });
        loadHealth();
        loadKb();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        updateSessionMessages(sid, (m) => [...m, { id: uid(), role: "assistant", content: `请求失败：${msg}`, isError: true }]);
        finishPipeline(false);
        setToast({ text: "请求失败", type: "fail" });
      } finally {
        setLoading(false);
      }
    },
    [activeId, loading, llm?.enabled, loadHealth, loadKb, mode, updateSessionMessages]
  );

  async function onUpload(f: File | null) {
    if (!f || !activeId) return;
    const fd = new FormData();
    fd.append("file", f);
    fd.append("session_id", activeId);
    try {
      await postFormData<{ doc_id: string; filename: string }>("/research/qa/upload", fd);
      setToast({ text: `已上传「${f.name}」`, type: "ok" });
      loadKb();
    } catch {
      setToast({ text: "上传失败", type: "fail" });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const extraTags = useMemo((): { kind: PageTagKind; label: string }[] => {
    const tags: { kind: PageTagKind; label: string }[] = [{ kind: "api", label: "对接 API" }];
    if (llm?.enabled) {
      tags.push({ kind: "liveLlm", label: `百炼 · ${llm.model ?? "通义"}` });
      tags.push({ kind: "demo", label: "知识库演示" });
    } else {
      tags.push({ kind: "mockWarn", label: "离线/Mock" });
    }
    return tags;
  }, [llm]);

  const headerNote =
    healthReady && llm?.enabled
      ? `已连接百炼。本页为机构常见「任务 + 会话 + 引用 + 流水线」布局；生成内容须过合规与投决流程。`
      : healthReady
        ? "未配置百炼时回答为占位。布局与生产侧工作台对齐，便于后续接向量检索与编排。"
        : "检测后端状态中…";

  const title = mode === "mvp" ? "研报问答①（MVP）" : "研报问答";

  const visibleAttention = useMemo(() => {
    const items = mode === "mvp" ? ATTENTION_MVP : ATTENTION_CHANGE;
    return items.filter((a) => !attentionDismissed.includes(a.id));
  }, [mode, attentionDismissed]);

  function dismissAttention(id: string) {
    setAttentionDismissed((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveDismissed(mode, next);
      return next;
    });
  }

  function applyRecent(entry: RecentEntry) {
    switchSession(entry.sessionId, { query: entry.text });
  }

  return (
    <PageShell title={title} extraTags={extraTags} note={headerNote}>
      {toast && (
        <div className="ira-toast-wrap" aria-live="polite">
          <div className={`ira-toast ${toast.type === "ok" ? "ira-toast--ok" : "ira-toast--fail"}`}>{toast.text}</div>
        </div>
      )}

      <div className="ira-rqa-page">
        {healthReady && !llm?.enabled && (
          <div className="ira-qa-mock-alert" role="alert">
            <strong>离线 / Mock</strong>：未配置 <code>DASHSCOPE_API_KEY</code> 时模型为占位；布局与流水线与生产一致。
          </div>
        )}

        <div className="ira-rqa-workspace">
          <aside className="ira-rqa-col ira-rqa-col--left">
            <div className="ira-rqa-panel">
              <button type="button" className="ira-rqa-help-toggle" onClick={() => setHelpOpen((v) => !v)}>
                {helpOpen ? "▼" : "▶"} 研报问答怎么用？
              </button>
              {helpOpen && (
                <div className="ira-rqa-help-body">
                  <p>
                    在基金公司/资管中，「研报问答」通常与<strong>任务（周报、临时议题、合规复核）</strong>、
                    <strong>材料库</strong>、<strong>引用留痕</strong>一起使用：认领任务 → 结合材料提问 →
                    系统走检索与生成流水线 → 结论进入例会或报告。左侧提供<strong>待关注</strong>（协同提醒）与
                    <strong>最近提问</strong>（本机成功记录），降低冷启动成本。各机构产品形态不同，
                    <strong>任务 + 材料 + 可追溯</strong>是共性。
                  </p>
                </div>
              )}
            </div>

            {visibleAttention.length > 0 && (
              <div className="ira-rqa-panel">
                <div className="ira-rqa-panel__head">
                  <h3>待关注</h3>
                  <span className="ira-rqa-badge">演示</span>
                </div>
                <p className="ira-rqa-panel__hint">协同侧常见「尚未处理」的提醒；可填入问题或标记已关注。</p>
                <ul className="ira-rqa-attention-list">
                  {visibleAttention.map((a) => (
                    <li key={a.id} className="ira-rqa-attention">
                      <div className="ira-rqa-attention__title">{a.title}</div>
                      <div className="ira-rqa-attention__hint">{a.hint}</div>
                      <div className="ira-rqa-attention__actions">
                        <button type="button" className="ira-btn ira-btn--ghost ira-btn--xs" onClick={() => setQ(a.preset)}>
                          填入问题
                        </button>
                        <button
                          type="button"
                          className="ira-btn ira-btn--xs"
                          onClick={() => {
                            setQ(a.preset);
                            void runAsk(a.preset);
                          }}
                          disabled={loading}
                        >
                          一键分析
                        </button>
                        <button type="button" className="ira-btn ira-btn--ghost ira-btn--xs" onClick={() => dismissAttention(a.id)}>
                          已关注
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="ira-rqa-panel">
              <div className="ira-rqa-panel__head">
                <h3>会话</h3>
                <button type="button" className="ira-btn ira-btn--ghost ira-btn--xs" onClick={newSession}>
                  + 新会话
                </button>
              </div>
              <ul className="ira-rqa-session-list">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`ira-rqa-session${s.id === activeId ? " ira-rqa-session--active" : ""}`}
                      onClick={() => switchSession(s.id)}
                    >
                      <span className="ira-rqa-session__title">{s.title}</span>
                      <span className="ira-rqa-session__meta">{new Date(s.updatedAt).toLocaleString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {recentList.length > 0 && (
              <div className="ira-rqa-panel">
                <div className="ira-rqa-panel__head">
                  <h3>最近提问</h3>
                </div>
                <p className="ira-rqa-panel__hint">本机记录的成功提问；点击切换到对应会话并填入问题。</p>
                <ul className="ira-rqa-recent-list">
                  {recentList.slice(0, 8).map((r) => (
                    <li key={`${r.ts}-${r.sessionId}-${r.text.slice(0, 24)}`}>
                      <button type="button" className="ira-rqa-recent" onClick={() => applyRecent(r)} title={r.text}>
                        <span className="ira-rqa-recent__text">
                          {r.text.length > 52 ? `${r.text.slice(0, 52)}…` : r.text}
                        </span>
                        <span className="ira-rqa-recent__meta">{new Date(r.ts).toLocaleString()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="ira-rqa-panel">
              <div className="ira-rqa-panel__head">
                <h3>待办分析任务</h3>
                <span className="ira-rqa-badge">演示</span>
              </div>
              <p className="ira-rqa-panel__hint">点击「填入」或「一键分析」；任务为模拟数据，用于还原协同流程。</p>
              <ul className="ira-rqa-task-list">
                {tasks.map((t) => (
                  <li key={t.id} className="ira-rqa-task">
                    <div className="ira-rqa-task__head">
                      <span className={`ira-rqa-prio ira-rqa-prio--${t.priority === "P0" ? "0" : "12"}`}>{t.priority}</span>
                      <span className="ira-rqa-task__due">{t.due}</span>
                    </div>
                    <div className="ira-rqa-task__title">{t.title}</div>
                    <div className="ira-rqa-task__group">{t.group}</div>
                    <div className="ira-rqa-task__actions">
                      <button type="button" className="ira-btn ira-btn--ghost ira-btn--xs" onClick={() => setQ(t.preset)}>
                        填入问题
                      </button>
                      <button
                        type="button"
                        className="ira-btn ira-btn--xs"
                        onClick={() => {
                          setQ(t.preset);
                          void runAsk(t.preset);
                        }}
                        disabled={loading}
                      >
                        一键分析
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="ira-rqa-col ira-rqa-col--center">
            <div className="ira-rqa-panel ira-rqa-panel--flush">
              <div className="ira-rqa-panel__head">
                <h3>分析流水线</h3>
                <span className="ira-muted" style={{ fontSize: "0.75rem" }}>
                  每次提问触发（演示进度；可对接真实编排与 trace）
                </span>
              </div>
              <ol className="ira-rqa-pipeline">
                {PIPELINE_LABELS.map((label, i) => (
                  <li
                    key={label}
                    className={`ira-rqa-pipeline__step${
                      loading && pipelineStep >= i ? " ira-rqa-pipeline__step--active" : ""
                    }${!loading && pipelineStep >= PIPELINE_LABELS.length ? " ira-rqa-pipeline__step--done" : ""}`}
                  >
                    <span className="ira-rqa-pipeline__idx">{i + 1}</span>
                    {label}
                  </li>
                ))}
              </ol>
            </div>

            <div className="ira-rqa-panel ira-rqa-panel--grow">
              <div className="ira-rqa-toolbar" style={{ marginBottom: "0.75rem" }}>
                <span className="ira-muted">快捷问法</span>
                <div className="ira-qa-suggest">
                  {quick.map((s) => (
                    <button key={s.short} type="button" className="ira-qa-chip" onClick={() => setQ(s.full)} title={s.full}>
                      {s.short}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ira-qa-chat ira-qa-chat--tall">
                {messages.length === 0 ? (
                  <p className="ira-muted" style={{ margin: 0, textAlign: "center", padding: "2rem 1rem" }}>
                    从左侧任务或快捷问法开始；支持多轮追问（当前会话内）。
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`ira-qa-row ira-qa-row--${m.role}`}>
                      <div
                        className={`ira-qa-bubble ira-qa-bubble--${
                          m.role === "user" ? "user" : m.isError ? "err" : "assistant"
                        }`}
                      >
                        {m.content}
                        {m.trace && (
                          <div className="ira-qa-meta">
                            trace: {m.trace}
                            {m.model ? ` · ${m.model}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="ira-rqa-compose-block">
                <textarea
                  className="ira-textarea ira-rqa-textarea"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="输入投研问题。Enter 发送，Shift+Enter 换行。"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void runAsk(q);
                    }
                  }}
                  disabled={loading}
                  rows={3}
                />
                <div className="ira-rqa-compose-actions">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    className="ira-rqa-file"
                    onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
                  />
                  <button type="button" className="ira-btn ira-btn--ghost" onClick={() => fileRef.current?.click()} disabled={loading}>
                    上传材料
                  </button>
                  <button
                    type="button"
                    className="ira-btn ira-btn--ghost"
                    onClick={() => {
                      if (activeId) updateSessionMessages(activeId, () => []);
                      setLastEvidence([]);
                    }}
                    disabled={loading}
                  >
                    清空对话
                  </button>
                  <button type="button" className="ira-btn" onClick={() => void runAsk(q)} disabled={loading || !q.trim()}>
                    {loading ? "分析中…" : "发送分析"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="ira-rqa-col ira-rqa-col--right">
            <div className="ira-rqa-panel">
              <h3>引用与材料</h3>
              <p className="ira-rqa-panel__hint">最近一次回答的 evidence_refs。</p>
              {lastEvidence.length === 0 ? (
                <p className="ira-muted" style={{ fontSize: "0.8rem", margin: 0 }}>
                  提问成功后将显示。
                </p>
              ) : (
                <ul className="ira-rqa-evidence">
                  {lastEvidence.map((ev) => (
                    <li key={ev.doc_id}>
                      <strong>{ev.ref ?? ev.doc_id}</strong>
                      <div className="ira-rqa-evidence__sub">
                        {ev.doc_id}
                        {ev.retrieval_score != null ? ` · score ${ev.retrieval_score}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ira-rqa-panel">
              <h3>知识库状态</h3>
              <dl className="ira-rqa-dl">
                <dt>索引版本</dt>
                <dd>{kbIndexVer || "—"}</dd>
                <dt>已登记文档</dt>
                <dd>{kbCount === null ? "加载中…" : `${kbCount} 条`}</dd>
              </dl>
            </div>

            {mode === "change" && (
              <div className="ira-rqa-panel ira-rqa-panel--accent">
                <h3>ira-1.1.0</h3>
                <p className="ira-rqa-panel__hint">请求含 X-Spec-Version 与风险标签字段。</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
