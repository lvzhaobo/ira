/**
 * 左侧主导航：分区 + 项。requireMvpNav 为 true 时仅在 preferences.show_research_qa_mvp_nav 为 true 时显示（学习讨论用 MVP 页）。
 */
export type NavItem = {
  to: string;
  label: string;
  short: string;
  /** 需开启「显示研报问答①（MVP）」才出现在侧栏 */
  requireMvpNav?: boolean;
  /** 非 Workshop 五大主线能力：侧栏与页头标为「扩展」 */
  secondary?: boolean;
  /** 与 `modules-practice/module-0x` 对照，侧栏展示短标（如 M2） */
  workshopModule?: string;
};

export type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview",
    title: "总览",
    items: [{ to: "/workbench", label: "工作台", short: "工" }],
  },
  {
    id: "core",
    title: "主线模块（M1~M5）",
    items: [
      { to: "/research-qa-change", label: "研报问答", short: "研", workshopModule: "M1" },
      { to: "/stock-analysis", label: "个股覆盖", short: "个股", workshopModule: "M2" },
      { to: "/knowledge", label: "知识库", short: "库", workshopModule: "M3" },
      { to: "/messages", label: "消息推送", short: "推", workshopModule: "M4" },
      { to: "/multi-agent-stock", label: "多Agent", short: "多", workshopModule: "M5" },
    ],
  },
  {
    id: "extended",
    title: "扩展与演示",
    items: [
      {
        to: "/research-qa",
        label: "研报问答①",
        short: "研①",
        requireMvpNav: true,
        secondary: true,
      },
      { to: "/lineage", label: "数据血缘", short: "血缘", secondary: true, workshopModule: "M2" },
      { to: "/skills", label: "SKILL", short: "技", secondary: true },
      { to: "/compliance", label: "合规扫描", short: "规", secondary: true },
      { to: "/sentiment", label: "舆情分析", short: "舆", secondary: true },
      { to: "/reports", label: "报告", short: "报", secondary: true },
      { to: "/settings", label: "设置", short: "设", secondary: true },
    ],
  },
];

const SECONDARY_PATHS = new Set(
  NAV_SECTIONS.flatMap((s) => s.items).filter((i) => i.secondary).map((i) => i.to),
);

/** 是否属于「扩展与演示」路由（页头打标用） */
export function isSecondaryNavPath(pathname: string): boolean {
  return SECONDARY_PATHS.has(pathname);
}

export function filterNavItems(items: NavItem[], showMvpNav: boolean): NavItem[] {
  return items.filter((it) => !it.requireMvpNav || showMvpNav);
}
