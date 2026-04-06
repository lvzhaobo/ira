/** 个股覆盖页展示用 Mock（名称、行业、要点等）；行情数值仍以 API /quote 为准（演示为固定样例）。 */

export type EquityProfile = {
  code: string;
  name: string;
  industry: string;
  board: string;
  /** 示意 */
  marketCap: string;
  chg20d: string;
  epsFY26: string;
  rating: string;
  analyst: string;
  catalysts: string[];
  risks: string[];
};

const PROFILES: EquityProfile[] = [
  {
    code: "600519.SH",
    name: "贵州茅台",
    industry: "食品饮料 · 白酒",
    board: "沪市主板",
    marketCap: "约 2.1 万亿（示意）",
    chg20d: "+1.2%",
    epsFY26: "69.8 元（一致预期 Mock）",
    rating: "买入（内部评级示意）",
    analyst: "张研 · 消费组",
    catalysts: [
      "批价与渠道库存为短期景气核心变量；旺季动销可验证需求韧性。",
      "分红政策与直营占比提升影响盈利质量 perception。",
    ],
    risks: [
      "消费税与渠道改革政策扰动；高端消费复苏不及预期。",
      "估值对无风险利率敏感，海外流动性外溢需跟踪。",
    ],
  },
  {
    code: "000858.SZ",
    name: "五粮液",
    industry: "食品饮料 · 白酒",
    board: "深市主板",
    marketCap: "约 5.8 千亿（示意）",
    chg20d: "-0.6%",
    epsFY26: "8.42 元（Mock）",
    rating: "增持（示意）",
    analyst: "张研 · 消费组",
    catalysts: ["普五量价策略与经典系列结构升级。", "区域渠道去库存进度决定业绩弹性。"],
    risks: ["批价波动与竞品分流；宏观经济对商务场景影响。"],
  },
  {
    code: "601318.SH",
    name: "中国平安",
    industry: "非银金融 · 保险",
    board: "沪市主板",
    marketCap: "约 9 千亿（示意）",
    chg20d: "+0.4%",
    epsFY26: "—",
    rating: "中性（示意）",
    analyst: "李研 · 金融组",
    catalysts: ["负债端复苏与综合金融协同。", "投资端收益率与权益敞口变化。"],
    risks: ["长端利率与资本市场波动；监管政策迭代。"],
  },
  {
    code: "300750.SZ",
    name: "宁德时代",
    industry: "电力设备 · 电池",
    board: "创业板",
    marketCap: "约 9 千亿（示意）",
    chg20d: "-3.8%",
    epsFY26: "11.2 元（Mock）",
    rating: "买入（示意）",
    analyst: "王研 · 新能源组",
    catalysts: ["全球动力电池份额与储能订单能见度。", "材料降本与产能利用率拐点。"],
    risks: ["价格战与海外贸易政策；上游资源价格波动。"],
  },
];

const DEFAULT_PROFILE: EquityProfile = {
  code: "",
  name: "未覆盖示例",
  industry: "—",
  board: "—",
  marketCap: "—",
  chg20d: "—",
  epsFY26: "—",
  rating: "—",
  analyst: "待指派",
  catalysts: ["请在左侧输入标的代码并生成覆盖备忘录，或从快捷标的选择。"],
  risks: ["演示环境无实时基本面；结论须以内部模型与合规流程为准。"],
};

export function resolveEquityProfile(symbol: string): EquityProfile {
  const s = symbol.trim().toUpperCase();
  const hit = PROFILES.find((p) => s.includes(p.code.split(".")[0]) || s === p.code.toUpperCase());
  if (hit) return { ...hit, code: hit.code };
  return { ...DEFAULT_PROFILE, code: s || DEFAULT_PROFILE.code };
}

/** 确定性 Mock：近 n 个「交易日」收盘序列，仅用于演示走势图（非真实行情）。 */
export function mockCloseSeries(symbol: string, n = 20): number[] {
  const sym = (symbol.trim().toUpperCase() || "DEMO") + "::series";
  let seed = 2166136261;
  for (let i = 0; i < sym.length; i++) {
    seed ^= sym.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  const base = 80 + (Math.abs(seed) % 120);
  const out: number[] = [];
  let y = base;
  for (let i = 0; i < n; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const jitter = (seed % 1000) / 1000 - 0.5;
    y = Math.max(1, y + jitter * 6);
    out.push(Math.round(y * 100) / 100);
  }
  return out;
}

export const EQUITY_QUICK_SYMBOLS = PROFILES.map((p) => p.code);
