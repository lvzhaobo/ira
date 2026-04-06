/**
 * 舆情监控演示数据：模拟公募/资管机构多源聚合、分级预警与重仓关联等场景（非真实行情与外部源）。
 */

export type SentimentKpi = {
  id: string;
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  accent?: "neutral" | "risk" | "ok";
};

export type AlertLevel = "high" | "medium" | "low";

export type SentimentAlertRow = {
  id: string;
  level: AlertLevel;
  category: string;
  title: string;
  summary: string;
  source: string;
  channel: string;
  time: string;
  relatedCodes?: string[];
  tags?: string[];
};

export type StockSentimentRow = {
  code: string;
  name: string;
  score: number;
  change24h: number;
  buzz: number;
  positionTag: string;
  funds: string[];
  risk: "high" | "watch" | "normal";
};

export type SectorSentimentRow = {
  name: string;
  score: number;
  deltaW: number;
};

export type SourceMixRow = {
  name: string;
  pct: number;
  count: number;
};

export type HotTopicRow = {
  topic: string;
  heat: number;
  sentiment: "pos" | "neg" | "neu";
};

export type WatchMatrixRow = {
  keyword: string;
  scope: string;
  hits24h: number;
  negRatio: string;
  owner: string;
};

export type IngestionStats = {
  label: string;
  value: string;
  status: "ok" | "delay" | "mock";
};

export const SENTIMENT_KPIS: SentimentKpi[] = [
  {
    id: "vol",
    label: "24h 全网声量（条）",
    value: "12,847",
    sub: "已去重",
    delta: "+6.2%",
    trend: "up",
    accent: "neutral",
  },
  {
    id: "neg",
    label: "负面信息占比",
    value: "11.3%",
    sub: "含弱负面",
    delta: "-0.8pt",
    trend: "down",
    accent: "ok",
  },
  {
    id: "alert",
    label: "待处置预警",
    value: "7",
    sub: "高 2 · 中 3 · 低 2",
    accent: "risk",
  },
  {
    id: "cover",
    label: "覆盖 A 股标的",
    value: "186",
    sub: "含港股通 42",
    delta: "+3",
    trend: "up",
    accent: "neutral",
  },
  {
    id: "interactive",
    label: "互动平台待阅",
    value: "23",
    sub: "上证e互动 / 深证互动易",
    accent: "neutral",
  },
  {
    id: "compliance",
    label: "合规敏感命中",
    value: "4",
    sub: "已推送合规复核队列",
    accent: "risk",
  },
];

export const SENTIMENT_ALERTS: SentimentAlertRow[] = [
  {
    id: "a1",
    level: "high",
    category: "重仓标的",
    title: "某新能源龙头被媒体报道产能利用率争议",
    summary:
      "晚间财经媒体引用匿名供应商说法，提及排产与库存；股吧与雪球讨论热度上升，需核对公开披露与调研纪要一致性。",
    source: "财联社 · 深度",
    channel: "新闻网站",
    time: "今日 21:16",
    relatedCodes: ["300750"],
    tags: ["新能源", "供应链"],
  },
  {
    id: "a2",
    level: "high",
    category: "监管政策",
    title: "行业协会发布征求意见稿，涉及费率与销售渠道表述",
    summary: "文件涉及理财产品宣传用语，可能与近期产品材料更新相关，合规已订阅全文待评估影响面。",
    source: "协会官网",
    channel: "监管/自律",
    time: "今日 17:40",
    tags: ["政策", "合规"],
  },
  {
    id: "a3",
    level: "medium",
    category: "产品声誉",
    title: "社交媒体出现对「固收+」回撤讨论的集中转发",
    summary: "话题集中于近两周净值波动，情绪偏中性偏负；需区分持有人结构与市场整体β。",
    source: "微博 / 雪球",
    channel: "社交",
    time: "今日 15:02",
    tags: ["固收+", "声誉"],
  },
  {
    id: "a4",
    level: "medium",
    category: "行业景气",
    title: "半导体设备板块研报密集下调全年资本开支预期",
    summary: "3 家卖方在同日更新模型，关键词「资本开支」「稼动率」命中上升；与内部行业观点比对中。",
    source: "Wind 研报摘要",
    channel: "研报",
    time: "今日 11:28",
    relatedCodes: ["688012", "002371"],
    tags: ["半导体", "景气度"],
  },
  {
    id: "a5",
    level: "medium",
    category: "竞品动态",
    title: "同业新发科技主题 ETF 费率与募集上限引讨论",
    summary: "媒体报道与投资者问答区热度升高，需跟踪对存量产品申赎与渠道排期的潜在影响。",
    source: "上证e互动",
    channel: "互动平台",
    time: "昨日 19:55",
    tags: ["ETF", "渠道"],
  },
  {
    id: "a6",
    level: "low",
    category: "宏观舆情",
    title: "海外媒体对人民币汇率波动的解读分歧加大",
    summary: "对权益与固收资产定价影响偏间接，已纳入晨会宏观简报引用列表。",
    source: "Bloomberg 摘要",
    channel: "外媒",
    time: "昨日 08:10",
    tags: ["汇率", "宏观"],
  },
];

export const STOCK_SENTIMENT: StockSentimentRow[] = [
  {
    code: "300750",
    name: "宁德时代",
    score: 42,
    change24h: -8,
    buzz: 126,
    positionTag: "前十大重仓",
    funds: ["南方新能源主题", "南方产业升级混合"],
    risk: "watch",
  },
  {
    code: "600519",
    name: "贵州茅台",
    score: 68,
    change24h: 3,
    buzz: 89,
    positionTag: "核心池",
    funds: ["南方品质优选", "南方消费精选"],
    risk: "normal",
  },
  {
    code: "688012",
    name: "中微公司",
    score: 55,
    change24h: -5,
    buzz: 64,
    positionTag: "科技成长",
    funds: ["南方科技创新混合"],
    risk: "watch",
  },
  {
    code: "000858",
    name: "五粮液",
    score: 61,
    change24h: 1,
    buzz: 52,
    positionTag: "消费",
    funds: ["南方消费升级"],
    risk: "normal",
  },
  {
    code: "601318",
    name: "中国平安",
    score: 58,
    change24h: -2,
    buzz: 71,
    positionTag: "金融",
    funds: ["南方金融主题"],
    risk: "normal",
  },
  {
    code: "002371",
    name: "北方华创",
    score: 48,
    change24h: -12,
    buzz: 58,
    positionTag: "半导体设备",
    funds: ["南方信息创新混合"],
    risk: "high",
  },
];

export const SECTOR_SENTIMENT: SectorSentimentRow[] = [
  { name: "电力设备及新能源", score: 46, deltaW: -4 },
  { name: "电子 / 半导体", score: 52, deltaW: -3 },
  { name: "食品饮料", score: 64, deltaW: 1 },
  { name: "医药生物", score: 59, deltaW: 2 },
  { name: "非银金融", score: 56, deltaW: 0 },
  { name: "有色金属", score: 54, deltaW: -1 },
];

export const SOURCE_MIX: SourceMixRow[] = [
  { name: "新闻与财经终端", pct: 34, count: 4368 },
  { name: "交易所互动平台", pct: 22, count: 2826 },
  { name: "卖方研报摘要", pct: 18, count: 2312 },
  { name: "社交媒体 / 股吧", pct: 15, count: 1927 },
  { name: "监管与协会披露", pct: 11, count: 1414 },
];

export const HOT_TOPICS: HotTopicRow[] = [
  { topic: "新能源排产与库存", heat: 96, sentiment: "neg" },
  { topic: "半导体资本开支", heat: 88, sentiment: "neg" },
  { topic: "白酒渠道去库存", heat: 72, sentiment: "neu" },
  { topic: "固收+ 净值波动", heat: 69, sentiment: "neg" },
  { topic: "港股通资金流向", heat: 61, sentiment: "neu" },
  { topic: "ETF 费率改革预期", heat: 55, sentiment: "neu" },
];

export const WATCH_MATRIX: WatchMatrixRow[] = [
  { keyword: "基金经理离任", scope: "全市场", hits24h: 12, negRatio: "8%", owner: "合规" },
  { keyword: "巨额赎回", scope: "自有产品", hits24h: 3, negRatio: "33%", owner: "零售" },
  { keyword: "监管处罚", scope: "同业+监管", hits24h: 28, negRatio: "41%", owner: "合规" },
  { keyword: "重仓股名称", scope: "股票池 186", hits24h: 412, negRatio: "14%", owner: "权益" },
  { keyword: "费率 / 业绩比较基准", scope: "产品材料", hits24h: 19, negRatio: "5%", owner: "产品" },
];

export const INGESTION_PIPELINE: IngestionStats[] = [
  { label: "财联社专线", value: "正常", status: "ok" },
  { label: "互动易爬虫", value: "延迟 <15min", status: "delay" },
  { label: "Wind 研报摘要", value: "Mock", status: "mock" },
  { label: "社交情绪 NLP", value: "离线模型", status: "mock" },
];
