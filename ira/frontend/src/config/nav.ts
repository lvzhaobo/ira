/**
 * 左侧主导航：分区 + 项。requireMvpNav 为 true 时仅在 preferences.show_research_qa_mvp_nav 为 true 时显示（学习讨论用 MVP 页）。
 */
export type NavItem = {
  to: string;
  label: string;
  short: string;
  /** 需开启「显示研报问答①（MVP）」才出现在侧栏 */
  requireMvpNav?: boolean;
};

export type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "home",
    title: "总览",
    items: [{ to: "/workbench", label: "工作台", short: "工" }],
  },
  {
    id: "intelligence",
    title: "投研智能",
    items: [
      { to: "/research-qa-change", label: "研报问答", short: "研" },
      { to: "/research-qa", label: "研报问答①", short: "研①", requireMvpNav: true },
      { to: "/compliance", label: "合规扫描", short: "规" },
      { to: "/lineage", label: "数据血缘", short: "血缘" },
      { to: "/stock-analysis", label: "个股覆盖", short: "个股" },
      { to: "/multi-agent-stock", label: "多Agent", short: "多" },
    ],
  },
  {
    id: "tools",
    title: "市场与运营",
    items: [{ to: "/sentiment", label: "舆情", short: "舆" }],
  },
  {
    id: "knowledge",
    title: "知识与触达",
    items: [
      { to: "/knowledge", label: "知识库", short: "库" },
      { to: "/skills", label: "SKILL", short: "技" },
      { to: "/messages", label: "推送", short: "推" },
    ],
  },
  {
    id: "admin",
    title: "登记与系统",
    items: [
      { to: "/reports", label: "报告", short: "报" },
      { to: "/settings", label: "设置", short: "设" },
    ],
  },
];

export function filterNavItems(items: NavItem[], showMvpNav: boolean): NavItem[] {
  return items.filter((it) => !it.requireMvpNav || showMvpNav);
}
