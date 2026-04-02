import { useEffect, useMemo, useState } from "react";
import { getJson, postJson } from "../api/client";
import PageShell from "../components/PageShell";

type SkillTemplate = {
  id: string;
  name: string;
  description?: string;
  scene: string[];
  goal: string;
  ioContract: string;
  prompt: string;
  source?: "project" | "personal" | "builtin";
  path?: string;
  frontmatter?: Record<string, unknown>;
  validationErrors?: string[];
};

type SkillRunResult = {
  skillId: string;
  output: string;
  score: number;
  reason: string;
  traceId?: string;
  modelId?: string;
  endpoint: string;
  durationMs: number;
  blocked?: boolean;
  hitCount?: number;
  rawMeta?: string;
  scoreBreakdown: string;
  requestPreview: string;
  responsePreview: string;
};

const SCENES = [
  "研报问答",
  "个股覆盖",
  "合规扫描",
  "报告定稿",
  "消息推送",
  "报告摘要",
] as const;

const DEFAULT_INPUT =
  "公司一季度收入同比增长18%，管理层预计全年利润率稳中有升。我们认为该公司未来三年将持续跑赢行业。材料未附完整数据来源，且披露中未说明是否存在利益冲突。请整理给销售团队。";

const BUILTIN_SKILLS: SkillTemplate[] = [
  {
    id: "equity-research",
    name: "行业研究增强",
    description: "Generate institution-grade equity research outputs.",
    scene: ["研报问答", "个股覆盖"],
    goal: "把自由文本转为投研可复核结构化结论，强化假设与风险表达。",
    ioContract: "输入：研究素材文本；输出：结论/假设/估值敏感性/风险 四段结构。",
    prompt:
      "你是卖方研究助理。输出必须包含：核心结论、关键假设、估值敏感性、风险提示，并给出可追溯依据。",
  },
  {
    id: "compliance-guard",
    name: "合规审校增强",
    description: "Review compliance-sensitive expressions and disclosure gaps.",
    scene: ["合规扫描", "报告定稿"],
    goal: "提前发现披露和措辞风险，给出可执行整改建议。",
    ioContract: "输入：待发布文本；输出：风险等级、命中规则、整改建议。",
    prompt:
      "你是合规审校助手。优先识别：绝对化表述、未披露利益冲突、来源不明数据、可能误导性结论，并按严重级别分层。",
  },
  {
    id: "meeting-brief",
    name: "路演纪要增强",
    description: "Convert long text into concise actionable brief.",
    scene: ["消息推送", "报告摘要"],
    goal: "将长文本压缩为可分发、可执行的销售支持摘要。",
    ioContract: "输入：会议/报告原文；输出：5条行动型要点。",
    prompt:
      "你是机构销售支持助手。请将输入压缩为 5 条可执行要点，补充行动建议和责任角色，不要输出空泛结论。",
  },
];

type QaAskResponse = {
  trace_id: string;
  answer: string;
  model?: { model_id?: string; prompt_version?: string; temperature?: number; usage?: unknown };
  evidence_refs?: Array<{ doc_id?: string; ref?: string }>;
};

type ComplianceScanResponse = {
  trace_id: string;
  blocked: boolean;
  hits: Array<{ rule_id?: string; message?: string }>;
  ruleset_version?: string;
};

type HealthResponse = {
  research_qa_llm?: { enabled?: boolean; provider?: string | null; model?: string | null };
};

type SkillCatalogResponse = {
  protocol: string;
  count: number;
  scanned_dirs: string[];
  items: Array<{
    id: string;
    name: string;
    description: string;
    source: "project" | "personal";
    path: string;
    frontmatter: Record<string, unknown>;
    content: string;
    validation_errors: string[];
  }>;
};

export default function Skills() {
  const [skills, setSkills] = useState<SkillTemplate[]>(BUILTIN_SKILLS);
  const [selected, setSelected] = useState(BUILTIN_SKILLS[0].id);
  const [enabled, setEnabled] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [scene, setScene] = useState<(typeof SCENES)[number]>("研报问答");
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [results, setResults] = useState<SkillRunResult[]>([]);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState("");
  const [llmStatus, setLlmStatus] = useState("未知");
  const [skillProtocol, setSkillProtocol] = useState("builtin");
  const [skillLoadMsg, setSkillLoadMsg] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    getJson<SkillCatalogResponse>("/skills/catalog")
      .then((res) => {
        if (!res.items?.length) {
          setSkillLoadMsg("未发现 .claude/skills 下的 SKILL.md，当前使用内置模板。");
          return;
        }
        const loaded: SkillTemplate[] = res.items.map((it) => ({
          id: it.id,
          name: it.name,
          description: it.description,
          scene: [],
          goal: "来自 Anthropic SKILL.md 文件定义",
          ioContract: "按 SKILL.md 指令执行",
          prompt: it.content,
          source: it.source,
          path: it.path,
          frontmatter: it.frontmatter,
          validationErrors: it.validation_errors,
        }));
        setSkills(loaded);
        setSelected(loaded[0].id);
        setSkillProtocol(res.protocol || "anthropic-agent-skills");
        setSkillLoadMsg(`已加载 ${loaded.length} 个 SKILL 文件。`);
      })
      .catch(() => {
        setSkillLoadMsg("加载 SKILL 文件失败，当前使用内置模板。");
      });
  }, []);

  const current = useMemo(() => skills.find((s) => s.id === selected) ?? skills[0], [selected, skills]);
  const mergedPrompt = useMemo(() => {
    if (!enabled) return "当前未启用 SKILL 注入。";
    return [current.prompt, customPrompt.trim()].filter(Boolean).join("\n\n补充约束：\n");
  }, [current.prompt, customPrompt, enabled]);

  const recommendedSkillId = useMemo(() => {
    if (!results.length) return "";
    return [...results].sort((a, b) => b.score - a.score)[0]?.skillId ?? "";
  }, [results]);

  function calcScore(skill: SkillTemplate, output: string): number {
    const sceneHit = skill.scene.includes(scene) ? 70 : 20;
    const outputScore = Math.min(output.length / 10, 20);
    return Math.round(sceneHit + outputScore + (enabled ? 10 : 0));
  }

  function calcScoreBreakdown(skill: SkillTemplate, output: string, extra = 0): string {
    const sceneHit = skill.scene.includes(scene) ? 70 : 20;
    const outputScore = Math.round(Math.min(output.length / 10, 20));
    const injectionScore = enabled ? 10 : 0;
    const total = sceneHit + outputScore + injectionScore + extra;
    return `场景匹配 ${sceneHit} + 输出信息量 ${outputScore} + 注入启用 ${injectionScore}${extra ? ` + 规则增益 ${extra}` : ""} = ${total}`;
  }

  function buildSkillQuery(skill: SkillTemplate): string {
    return [
      skill.prompt,
      `当前场景：${scene}`,
      "请严格按该 SKILL 目标输出，不要忽略格式约束。",
      "",
      "【输入材料】",
      inputText.trim(),
    ].join("\n");
  }

  function explainRecommendation(row: SkillRunResult): string {
    const sceneMatch = skills.find((s) => s.id === row.skillId)?.scene.includes(scene);
    const scenePart = sceneMatch ? "场景匹配度高" : "场景匹配度一般";
    const qualityPart = row.output.length > 120 ? "输出信息量充足" : "输出较短";
    const compliancePart =
      row.skillId === "compliance-guard" && typeof row.hitCount === "number"
        ? `规则命中 ${row.hitCount} 条`
        : "未执行额外规则校验";
    return `${scenePart}；${qualityPart}；${compliancePart}。`;
  }

  async function runOneSkill(skill: SkillTemplate): Promise<SkillRunResult> {
    const started = Date.now();
    const complianceLike = /compliance|合规/.test(`${skill.id} ${skill.name} ${skill.description ?? ""}`.toLowerCase());
    const endpoint = complianceLike ? "/compliance/scan + /research/qa/ask" : "/research/qa/ask";
    if (complianceLike) {
      const scanReq = { text: inputText.trim(), context_trace_id: "skills-page" };
      const qaReq = { session_id: "skills-page", query: buildSkillQuery(skill), require_risk_label: true };
      const [scan, qa] = await Promise.all([
        postJson<ComplianceScanResponse>("/compliance/scan", scanReq),
        postJson<QaAskResponse>(
          "/research/qa/ask",
          qaReq,
          { "X-Spec-Version": "ira-1.1.0" }
        ),
      ]);
      const advisory = [
        `【合规扫描】${scan.blocked ? "存在命中，建议先整改" : "未命中高风险规则"}`,
        `命中数：${scan.hits.length}`,
        scan.hits.map((h, i) => `${i + 1}. [${h.rule_id ?? "RULE"}] ${h.message ?? "命中规则"}`).join("\n"),
        "",
        "【LLM审校建议】",
        qa.answer,
      ]
        .filter(Boolean)
        .join("\n");
      const output = enabled ? advisory : "当前未启用 SKILL 注入。";
      const extra = scan.blocked ? 10 : 0;
      const base: SkillRunResult = {
        skillId: skill.id,
        output,
        score: calcScore(skill, output) + extra,
        reason: "",
        traceId: `${scan.trace_id} / ${qa.trace_id}`,
        modelId: qa.model?.model_id ?? "unknown",
        endpoint,
        durationMs: Date.now() - started,
        blocked: scan.blocked,
        hitCount: scan.hits.length,
        rawMeta: `ruleset=${scan.ruleset_version ?? "unknown"}; prompt=${qa.model?.prompt_version ?? "unknown"}`,
        scoreBreakdown: calcScoreBreakdown(skill, output, extra),
        requestPreview: JSON.stringify(
          {
            endpoint: "/compliance/scan",
            body: scanReq,
            endpoint2: "/research/qa/ask",
            headers2: { "X-Spec-Version": "ira-1.1.0" },
            body2: { ...qaReq, query: `${qaReq.query.slice(0, 260)}...` },
          },
          null,
          2
        ),
        responsePreview: JSON.stringify(
          {
            scan: { trace_id: scan.trace_id, blocked: scan.blocked, hit_count: scan.hits.length },
            qa: { trace_id: qa.trace_id, model_id: qa.model?.model_id, answer_preview: qa.answer.slice(0, 220) },
          },
          null,
          2
        ),
      };
      return { ...base, reason: explainRecommendation(base) };
    }

    const qaReq = { session_id: "skills-page", query: buildSkillQuery(skill), require_risk_label: true };
    const qa = await postJson<QaAskResponse>(
      "/research/qa/ask",
      qaReq,
      { "X-Spec-Version": "ira-1.1.0" }
    );
    const output = enabled ? qa.answer : "当前未启用 SKILL 注入。";
    const base: SkillRunResult = {
      skillId: skill.id,
      output,
      score: calcScore(skill, output),
      reason: "",
      traceId: qa.trace_id,
      modelId: qa.model?.model_id ?? "unknown",
      endpoint,
      durationMs: Date.now() - started,
      rawMeta: `prompt=${qa.model?.prompt_version ?? "unknown"}; evidence=${qa.evidence_refs?.length ?? 0}`,
      scoreBreakdown: calcScoreBreakdown(skill, output),
      requestPreview: JSON.stringify(
        {
          endpoint: "/research/qa/ask",
          headers: { "X-Spec-Version": "ira-1.1.0" },
          body: { ...qaReq, query: `${qaReq.query.slice(0, 260)}...` },
        },
        null,
        2
      ),
      responsePreview: JSON.stringify(
        {
          trace_id: qa.trace_id,
          model_id: qa.model?.model_id,
          prompt_version: qa.model?.prompt_version,
          evidence_count: qa.evidence_refs?.length ?? 0,
          answer_preview: qa.answer.slice(0, 260),
        },
        null,
        2
      ),
    };
    return { ...base, reason: explainRecommendation(base) };
  }

  async function runAllSkills() {
    setRunning(true);
    setRunMsg("");
    try {
      const h = await getJson<HealthResponse>("/system/health");
      const llmOn = Boolean(h.research_qa_llm?.enabled);
      setLlmStatus(llmOn ? `已启用（${h.research_qa_llm?.provider ?? "provider"} / ${h.research_qa_llm?.model ?? "model"}）` : "未启用（将返回离线占位答复）");
      const next = await Promise.all(skills.map((skill) => runOneSkill(skill)));
      setResults(next);
      setRunMsg("已完成真实执行。结果来自后端 API，含 trace_id/model/规则命中等证据。");
    } catch (e) {
      setRunMsg(`执行失败：${e instanceof Error ? e.message : "未知错误"}`);
      setResults([]);
    } finally {
      setRunning(false);
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(mergedPrompt);
      setCopied("已复制注入提示词，可粘贴到模型系统提示或 Agent 配置。");
    } catch {
      setCopied("复制失败，请手动复制下方文本。");
    }
  }

  return (
    <PageShell title="SKILL 能力注入">
      <div className="ira-stack">
        <div className="ira-card">
          <p className="ira-muted" style={{ marginTop: 0 }}>
            页面支持展示 SKILL 内容、选择后预览，并可真实执行内置 3 个 SKILL。执行后会基于当前场景自动推荐更合适的 SKILL。
          </p>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1fr)" }}>
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span>选择 SKILL 模板</span>
                <select className="ira-input" value={selected} onChange={(e) => setSelected(e.target.value)}>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>当前业务场景</span>
                <select className="ira-input" value={scene} onChange={(e) => setScene(e.target.value as (typeof SCENES)[number])}>
                  {SCENES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ira-kv">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                <span>启用 SKILL 注入</span>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span>自定义补充约束（可选）</span>
                <textarea
                  className="ira-input"
                  rows={4}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="例如：回答必须给出数据来源字段；结论最多 120 字。"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span>统一输入（用于跑通多个 SKILL）</span>
                <textarea className="ira-input" rows={5} value={inputText} onChange={(e) => setInputText(e.target.value)} />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="ira-btn ira-btn--xs" disabled={running} onClick={() => void runAllSkills()}>
                  {running ? "执行中…" : "真实执行 3 个 SKILL"}
                </button>
              </div>
              <p className="ira-muted" style={{ margin: 0 }}>
                LLM 状态：{llmStatus}
              </p>
              {runMsg && <p className="ira-muted" style={{ margin: 0 }}>{runMsg}</p>}
              {skillLoadMsg && <p className="ira-muted" style={{ margin: 0 }}>{skillLoadMsg}</p>}
            </div>

            <div className="ira-card" style={{ margin: 0 }}>
              <h3 style={{ marginTop: 0 }}>当前 SKILL 即时预览</h3>
              <p className="ira-muted">协议：{skillProtocol}</p>
              <p className="ira-muted">名称：{current.name}</p>
              <p className="ira-muted">描述：{current.description || "—"}</p>
              <p className="ira-muted">适配场景：{current.scene.length ? current.scene.join(" / ") : "由运行时按描述自动匹配"}</p>
              <p className="ira-muted">目标：{current.goal}</p>
              <p className="ira-muted">I/O 约定：{current.ioContract}</p>
              <p className="ira-muted" style={{ marginBottom: 8 }}>
                类型：{current.source ? `Anthropic SKILL 文件（${current.source}）` : "内置模板"}
              </p>
              {current.path && <p className="ira-muted">文件路径：{current.path}</p>}
              {current.validationErrors?.length ? (
                <p className="ira-muted">协议校验：{current.validationErrors.join("；")}</p>
              ) : (
                <p className="ira-muted">协议校验：通过（name/description 已校验）</p>
              )}
              {current.frontmatter && (
                <details style={{ marginBottom: 10 }}>
                  <summary>Frontmatter（Anthropic 协议字段）</summary>
                  <pre className="ira-pre" style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                    {JSON.stringify(current.frontmatter, null, 2)}
                  </pre>
                </details>
              )}
              <pre className="ira-pre" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {current.prompt}
              </pre>
            </div>
          </div>
        </div>

        <div className="ira-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h3 style={{ margin: 0 }}>注入预览</h3>
            <button type="button" className="ira-btn ira-btn--xs" onClick={() => void copyPrompt()}>
              复制提示词
            </button>
          </div>
          <pre className="ira-pre" style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
            {mergedPrompt}
          </pre>
          {copied && <p className="ira-muted" style={{ marginBottom: 0 }}>{copied}</p>}
        </div>

        <div className="ira-card">
          <h3 style={{ marginTop: 0 }}>执行结果与自动推荐</h3>
          {!results.length ? (
            <p className="ira-muted">点击“真实执行 3 个 SKILL”后查看对比结果。</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {results.map((r) => {
                const skill = skills.find((s) => s.id === r.skillId);
                const recommended = r.skillId === recommendedSkillId;
                return (
                  <div key={r.skillId} className="ira-card" style={{ margin: 0 }}>
                    <p className="ira-muted" style={{ marginTop: 0 }}>
                      {skill?.name} · 评分 {r.score}
                      {recommended ? " · 推荐" : ""}
                    </p>
                    <p className="ira-muted">推荐解释：{r.reason}</p>
                    <p className="ira-muted">
                      执行证据：`{r.endpoint}` · trace `{r.traceId ?? "—"}` · model `{r.modelId ?? "—"}` · {r.durationMs}ms
                    </p>
                    <p className="ira-muted">评分拆解：{r.scoreBreakdown}</p>
                    {r.rawMeta && <p className="ira-muted">元数据：{r.rawMeta}</p>}
                    <pre className="ira-pre" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                      {r.output}
                    </pre>
                    <details style={{ marginTop: 10 }}>
                      <summary>执行明细（请求/响应摘要）</summary>
                      <p className="ira-muted" style={{ margin: "8px 0 6px" }}>请求摘要</p>
                      <pre className="ira-pre" style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>
                        {r.requestPreview}
                      </pre>
                      <p className="ira-muted" style={{ margin: "8px 0 6px" }}>响应摘要</p>
                      <pre className="ira-pre" style={{ whiteSpace: "pre-wrap", marginTop: 0, marginBottom: 0 }}>
                        {r.responsePreview}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
