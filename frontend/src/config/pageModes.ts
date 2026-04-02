/** 各路由数据状态：在页面顶部以标签展示 */
export type PageTagKind = "api" | "demo" | "placeholder" | "live" | "mockWarn" | "liveLlm";

export type PageMode = {
  tags: PageTagKind[];
  note?: string;
};

/** pathname → 标签（与 React Router 一致，含 / 与 /workbench） */
export const PAGE_MODES: Record<string, PageMode> = {
  "/": {
    tags: ["api", "demo"],
    note: "投研工作台：KPI/待办/最近活动 + 能力入口；数据为演示 JSON，非生产行情与工单",
  },
  "/workbench": {
    tags: ["api", "demo"],
    note: "同上",
  },
  "/research-qa": {
    tags: ["api", "demo"],
    note: "MVP 学习页；侧栏默认隐藏，设置中可打开「显示研报问答①」",
  },
  "/research-qa-change": {
    tags: ["api", "demo"],
    note: "主「研报问答」入口：ira-1.1.0、风险标签等；模型状态见页内提示",
  },
  "/compliance": {
    tags: ["api", "demo", "mockWarn"],
    note: "单栏：规则/扫描/映射/审计流水；非生产合规引擎",
  },
  "/lineage": {
    tags: ["api", "demo", "mockWarn"],
    note: "主视图为公募结论/披露血缘 Mock；「技术审计」页签对接 traces.json",
  },
  "/stock-analysis": {
    tags: ["api", "demo", "mockWarn"],
    note: "覆盖页布局；行情/要点部分为 Mock，备忘录与 trace 对接后端演示接口",
  },
  "/multi-agent-stock": {
    tags: ["api", "demo", "mockWarn"],
    note: "页面含编排拓扑、消息总线与互评预览；运行后与本地 mock 脚本对齐，非真实多模型",
  },
  "/sentiment": {
    tags: ["api", "demo", "mockWarn"],
    note: "看板主体为机构场景 Mock；底部联调区对接本地舆情 API，非外部实时源",
  },
  "/knowledge": {
    tags: ["api", "demo", "mockWarn"],
    note: "文档来自 data/kb_documents.json；集合与管线部分为 Workshop 示意",
  },
  "/messages": {
    tags: ["api", "demo", "mockWarn"],
    note: "钉钉/飞书/邮件渠道配置见 JSON；发送为 dry-run，邮件可带 subject",
  },
  "/reports": {
    tags: ["api", "demo"],
    note: "投研报告登记簿：环节与合规状态为演示字段，可 PATCH 写回 JSON",
  },
  "/settings": {
    tags: ["api", "demo"],
    note: "系统参数与偏好（GET /system/settings · PUT /system/preferences）；Swagger UI 见 /api/docs",
  },
};

const LABELS: Record<PageTagKind, string> = {
  api: "对接 API",
  demo: "演示数据",
  placeholder: "占位",
  live: "生产数据源",
  mockWarn: "离线/Mock",
  liveLlm: "百炼在线",
};

export function resolvePageMode(pathname: string): PageMode {
  return PAGE_MODES[pathname] ?? { tags: ["api", "demo"], note: "未单独配置" };
}

export function tagLabel(kind: PageTagKind): string {
  return LABELS[kind];
}
