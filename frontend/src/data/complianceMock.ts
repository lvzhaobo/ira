/**
 * 合规页：公募/资管常见「模块」说明、监管映射示意、场景速检与免责片段（Workshop Mock）。
 */

export type ModuleHint = { id: string; title: string; desc: string };

/** 机构侧合规门户/审查台常见能力拆分（本页用单栏分区对应） */
export const COMPLIANCE_MODULE_HINTS: ModuleHint[] = [
  {
    id: "governance",
    title: "规则与版本治理",
    desc: "规则集版本号、生效范围、变更记录与谁有权发布；对外扫描须绑定当时生效版本。",
  },
  {
    id: "scan",
    title: "事中检测入口",
    desc: "宣传话术、推送稿、问答输出、路演材料等统一过检；可对接 NLP/关键词/模板多重策略。",
  },
  {
    id: "result",
    title: "命中解释与处置",
    desc: "规则 ID、严重级别、命中片段、是否拦截外发；建议附改写要点或标准替代表述。",
  },
  {
    id: "audit",
    title: "审计留痕",
    desc: "trace_id、操作者、时间、上下文（如关联研报/会话）；满足内控与监管问询。",
  },
  {
    id: "queue",
    title: "复核队列（可选）",
    desc: "高风险命中进入法务/合规复核；本演示用「审计流水」表简化展示。",
  },
  {
    id: "mapping",
    title: "监管口径映射",
    desc: "内部规则与法规条文、自律规则要点的对照表，便于培训与对外解释。",
  },
];

export type RegulatoryMapRow = {
  ruleId: string;
  reference: string;
  note: string;
};

export const REGULATORY_MAP: RegulatoryMapRow[] = [
  {
    ruleId: "R-G02",
    reference: "宣传推介材料 · 禁止收益承诺与误导（示意对齐《公开募集证券投资基金宣传推介材料管理暂行规定》精神）",
    note: "命中词如保本、无风险、稳赚等",
  },
  {
    ruleId: "R-G01",
    reference: "适当性与投顾边界 · 禁止变相一对一投资指令（示意）",
    note: "清仓、全仓、建议买入等指向性表述",
  },
  {
    ruleId: "R-D01",
    reference: "信息披露与可验证性",
    note: "需标注数据来源、截至时间",
  },
];

export type QuickScenario = {
  id: string;
  label: string;
  hint: string;
  preset: string;
};

export const QUICK_SCENARIOS: QuickScenario[] = [
  {
    id: "promise",
    label: "收益承诺用语",
    hint: "易触发 R-G02",
    preset: "本产品年化收益稳定，基本无风险，适合全仓配置。",
  },
  {
    id: "ops",
    label: "投资操作指令",
    hint: "易触发 R-G01",
    preset: "建议您明天开盘清仓白酒，全部加仓新能源龙头。",
  },
  {
    id: "neutral",
    label: "中性内部纪要",
    hint: "通常通过（仍建议人工复核）",
    preset: "本纪要为内部讨论记录，数据来源于 Wind 截至本周五收盘，不代表对外观点。",
  },
];

export const DISCLAIMER_SNIPPETS = [
  "基金有风险，投资需谨慎。过往业绩不预示未来表现。",
  "本材料仅供合格投资者参考，不构成投资建议或收益承诺。",
  "本产品不保证本金与收益，投资者应认真阅读基金合同、招募说明书等法律文件。",
];
