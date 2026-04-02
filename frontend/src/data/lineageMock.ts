/**
 * 基金公司场景：投研结论血缘、监管披露字段溯源（演示 Mock）。
 * 与「技术 trace」并列：后者对接 /lineage/* API，用于审计 JSON。
 */

export type LineageNode = {
  id: string;
  label: string;
  sub?: string;
  system?: string;
};

export type LineageLane = {
  id: string;
  title: string;
  nodes: LineageNode[];
};

export type FieldLineageRow = {
  field: string;
  source: string;
  dataset: string;
  batchOrVersion: string;
  refreshed: string;
  owner: string;
};

export type ResearchScenario = {
  id: string;
  title: string;
  summary: string;
  product?: string;
  lanes: LineageLane[];
  fields: FieldLineageRow[];
  impacts: string[];
  complianceGate: string;
};

export const RESEARCH_SCENARIOS: ResearchScenario[] = [
  {
    id: "sector-weekly",
    title: "行业周报 · 白酒批价与渠道库存结论",
    product: "权益 · 消费组",
    summary:
      "对外段落中「龙头批价企稳、渠道库存去化」结论，需可追溯至 Wind 一致预期、公司公告与内部纪要；LLM 仅做结构化重组，不改变数值口径。",
    lanes: [
      {
        id: "L1",
        title: "外部数据源",
        nodes: [
          { id: "n1", label: "Wind 一致预期", sub: "盈利预测汇总", system: "Wind API" },
          { id: "n2", label: "上交所公告 PDF", sub: "量价与经营数据", system: "信息披露抓取" },
          { id: "n3", label: "渠道调研纪要", sub: "经销商访谈（内部）", system: "知识库 doc-xxx" },
        ],
      },
      {
        id: "L2",
        title: "数据加工与质控",
        nodes: [
          { id: "n4", label: "ODS 日批", sub: "字段对齐、货币单位", system: "DataWorks" },
          { id: "n5", label: "规则校验", sub: "缺失值 / 极值拦截", system: "质量规则 v2026.03" },
        ],
      },
      {
        id: "L3",
        title: "投研加工与模型",
        nodes: [
          { id: "n6", label: "分析师工作稿", sub: "定稿 v3", system: "投研工作台" },
          { id: "n7", label: "模板化摘要", sub: "段落级引用绑定", system: "研报助手（演示）" },
        ],
      },
      {
        id: "L4",
        title: "输出制品",
        nodes: [
          { id: "n8", label: "行业周报 §3.2", sub: "对客版", system: "报告库" },
          { id: "n9", label: "引用证据包", sub: "段落→片段 ID", system: "血缘注册表（Mock）" },
        ],
      },
      {
        id: "L5",
        title: "消费场景",
        nodes: [
          { id: "n10", label: "投委会材料", sub: "脱敏导出", system: "合规白名单" },
          { id: "n11", label: "机构客户路演", sub: "录音稿归档", system: "CRM 附件" },
        ],
      },
    ],
    fields: [
      {
        field: "结论段落 P3「批价企稳」",
        source: "Wind",
        dataset: "CONSENSUS_CN / 白酒龙头",
        batchOrVersion: "批次 2026-04-01",
        refreshed: "2026-04-01 08:00",
        owner: "数据团队",
      },
      {
        field: "同段「渠道库存」",
        source: "内部纪要",
        dataset: "kb / 渠道调研合集",
        batchOrVersion: "doc-min-etf-88",
        refreshed: "2026-03-30",
        owner: "行业研究员",
      },
      {
        field: "图表 F-2 估值带",
        source: "Wind + 内部模型",
        dataset: "估值模板 / pe_band_v4",
        batchOrVersion: "模型包 ira-1.1.0",
        refreshed: "2026-04-01",
        owner: "量化支持",
      },
    ],
    impacts: [
      "若 Wind 日终延迟 >4h，本节结论需标注「数据截至 T-1」并触发复核任务。",
      "内部纪要撤回时，引用片段自动标红，禁止对外再分发。",
    ],
    complianceGate: "对外版本经合规规则集扫描 + 免责声明挂载，留痕至披露流水号（演示）。",
  },
  {
    id: "stock-eps",
    title: "个股深度 · EPS 预测引用链",
    product: "权益 · 科技组",
    summary: "深度报告核心表格中 2026E EPS 与一致预期偏差说明，需链路至卖方汇总与模型假设页。",
    lanes: [
      {
        id: "L1",
        title: "外部数据源",
        nodes: [
          { id: "s1", label: "卖方一致预期", system: "Wind / 外部采购" },
          { id: "s2", label: "公司业绩预告", system: "交易所 PDF 解析" },
        ],
      },
      {
        id: "L2",
        title: "加工",
        nodes: [{ id: "s3", label: "财务模型底稿", sub: "Excel 锁定版本", system: "投研 SVN（示意）" }],
      },
      {
        id: "L3",
        title: "输出",
        nodes: [
          { id: "s4", label: "深度报告表 2-1", system: "报告库" },
          { id: "s5", label: "假设敏感性附录", system: "附录自动生成" },
        ],
      },
      {
        id: "L4",
        title: "消费",
        nodes: [{ id: "s6", label: "内部评级会签", system: "OA 流程" }],
      },
    ],
    fields: [
      {
        field: "表 2-1 · 2026E EPS",
        source: "内部模型",
        dataset: "model / 688012_v12.xlsx",
        batchOrVersion: "签出 2026-03-28",
        refreshed: "2026-03-28",
        owner: "覆盖研究员",
      },
      {
        field: "脚注「较一致预期」",
        source: "Wind",
        dataset: "CONSENSUS / 滚动 30 日",
        batchOrVersion: "快照 2026-03-27",
        refreshed: "2026-03-27 收盘后",
        owner: "数据团队",
      },
    ],
    impacts: ["一致预期源切换供应商时，需全量重算脚注并保留对比快照。"],
    complianceGate: "表格脚注含数据来源说明；禁出现保本及排名承诺用语。",
  },
];

export type DisclosureRow = {
  report: string;
  field: string;
  upstream: string;
  pipeline: string;
  status: "已核对" | "待复核" | "Mock";
  asOf: string;
};

export const DISCLOSURE_LINEAGE: DisclosureRow[] = [
  {
    report: "基金季报",
    field: "基金资产净值",
    upstream: "估值系统",
    pipeline: "日终估值 → 汇总表 T+1 06:00",
    status: "已核对",
    asOf: "2026-03-31",
  },
  {
    report: "基金季报",
    field: "基金份额合计",
    upstream: "TA 系统",
    pipeline: "登记过户日终 → 对账文件",
    status: "已核对",
    asOf: "2026-03-31",
  },
  {
    report: "基金季报",
    field: "前十大重仓股",
    upstream: "估值 + 行情中心",
    pipeline: "持仓币种折算 → 行情收盘价 T 日",
    status: "待复核",
    asOf: "2026-03-31",
  },
  {
    report: "招募说明书（更新）",
    field: "业绩比较基准构成",
    upstream: "指数公司 + 内部指数库",
    pipeline: "指数成分权重月度同步",
    status: "Mock",
    asOf: "2026-04-01",
  },
  {
    report: "招募说明书（更新）",
    field: "风险收益特征表述",
    upstream: "法律合规 + 历史净值序列",
    pipeline: "统计区间校验 + 话术模板",
    status: "已核对",
    asOf: "2026-04-01",
  },
];

export const LINEAGE_KPIS = [
  { id: "cov", label: "已注册结论血缘", value: "128", sub: "本季新增 14（Mock）" },
  { id: "sys", label: "上游系统节点", value: "23", sub: "含 TA/估值/Wind/知识库" },
  { id: "depth", label: "平均追溯深度", value: "4.2 层", sub: "数据源→加工→制品" },
];
