/**
 * 多 Agent 协作演示：编排拓扑、角色分工、消息总线与讨论预览（未调用 API 时展示）。
 */

export type PipelineStep = {
  id: string;
  label: string;
  sub?: string;
};

export type RosterAgent = {
  id: string;
  name: string;
  roleTag: string;
  responsibility: string;
  tools: string[];
};

export type BusMessage = {
  t: string;
  from: string;
  to: string;
  kind: string;
  body: string;
};

export type DiscussionItem = {
  utterance_id: string;
  round: number;
  speaker_id?: string;
  speaker_name: string;
  content: string;
  reply_to_utterance_id?: string | null;
  mentions?: string[];
};

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: "u", label: "用户 / 投研", sub: "触发标的分析" },
  { id: "bff", label: "BFF", sub: "鉴权 · trace" },
  { id: "orch", label: "编排 Agent", sub: "DAG · fan-out / merge" },
  { id: "workers", label: "并行子 Agent", sub: "行业 · 量化 · 合规" },
  { id: "merge", label: "汇总", sub: "merged_text" },
  { id: "gate", label: "合规闸门", sub: "规则集 · 免责声明" },
];

export const AGENT_ROSTER: RosterAgent[] = [
  {
    id: "orch",
    name: "编排 Agent",
    roleTag: "orchestration",
    responsibility: "解析意图、拆分任务、并行调度、收集结果、触发第二轮互评与合并。",
    tools: ["plan_and_route", "fan_out", "merge", "schedule_reply"],
  },
  {
    id: "industry",
    name: "行业研究 Agent",
    roleTag: "定性",
    responsibility: "产业链、竞争格局、景气度与政策口径；输出结构化要点供量化校准假设。",
    tools: ["report_retrieval", "sector_kb", "channel_check"],
  },
  {
    id: "quant",
    name: "量化估值 Agent",
    roleTag: "定量",
    responsibility: "估值区间、敏感性、财务一致性；可引用行业结论并标注假设依赖。",
    tools: ["factor_model", "consensus_pe", "scenario_table"],
  },
  {
    id: "risk",
    name: "风控合规 Agent",
    roleTag: "合规",
    responsibility: "禁荐股/保本/不当承诺扫描；规则版本留痕；阻断或要求改写后合并。",
    tools: ["ruleset_scan", "disclaimer_template", "audit_log"],
  },
];

/** 未运行 API 时的消息总线预览 */
export const STATIC_BUS: BusMessage[] = [
  {
    t: "（预览）",
    from: "BFF",
    to: "编排Agent",
    kind: "request",
    body: "start_pipeline(symbol, mode=parallel_then_merge) — 点击「运行协作」后替换为后端返回的完整 Handoff 序列",
  },
];

export const STATIC_DISCUSSION: DiscussionItem[] = [
  {
    utterance_id: "preview-1",
    round: 1,
    speaker_id: "industry",
    speaker_name: "行业研究 Agent",
    content:
      "（预览）标的所处行业存量竞争，龙头集中度延续；需跟踪批价与渠道库存，政策扰动来自消费税与渠道改革预期。",
    reply_to_utterance_id: null,
  },
  {
    utterance_id: "preview-2",
    round: 1,
    speaker_id: "quant",
    speaker_name: "量化估值 Agent",
    content: "（预览）当前估值处于近三年中性区间，ROE 平稳；关键假设含无重大减值与批价稳定。",
    reply_to_utterance_id: null,
  },
  {
    utterance_id: "preview-3",
    round: 1,
    speaker_id: "risk",
    speaker_name: "风控合规 Agent",
    content: "（预览）未命中 R-G01/R-G02 高风险话术；输出需带数据来源说明与「不构成投资建议」。",
    reply_to_utterance_id: null,
  },
  {
    utterance_id: "preview-4",
    round: 2,
    speaker_id: "quant",
    speaker_name: "量化估值 Agent",
    content: "（预览）补充：与行业观点一致，若批价走弱需同步下调盈利预测区间。",
    reply_to_utterance_id: "preview-1",
    mentions: ["industry"],
  },
];

export const STATIC_MERGED = `【汇总 · 预览】尚未调用后端
· 行业：竞争格局与渠道库存为短期关键变量。
· 量化：估值中性，盈利假设与批价挂钩。
· 合规：规则扫描通过；待运行后替换为 merged_text。
不构成投资建议。`;

export const HANDOFF_EDGES: { from: string; to: string; label: string }[] = [
  { from: "编排 Agent", to: "行业 / 量化 / 合规", label: "fan-out 并行" },
  { from: "行业研究 Agent", to: "量化估值 Agent", label: "第二轮互评（reply_to）" },
  { from: "各 Agent", to: "编排 Agent", label: "artifact 回传" },
  { from: "编排 Agent", to: "合规闸门", label: "merge 后扫描" },
];
