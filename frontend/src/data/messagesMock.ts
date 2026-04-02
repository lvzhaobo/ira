/** 推送页：演示统计（渠道仍以 API 为准） */

export const NOTIFY_KPIS = [
  { id: "today", label: "今日 dry-run", value: "—", sub: "刷新后取历史条数" },
  { id: "channels", label: "已配置渠道", value: "—", sub: "钉钉 · 飞书 · 邮件" },
  { id: "compliance", label: "合规扫描", value: "必经", sub: "命中规则则 400 拦截" },
];

export const NOTIFY_TEMPLATES = [
  { title: "研报摘要", body: "【摘要】{标的} 行业与估值要点已更新，详见工作台链接。" },
  { title: "风险提醒", body: "【提醒】{标的} 相关舆情与合规扫描结果待阅，请登录系统查看。" },
  { title: "晨会要点", body: "【晨会】宏观与行业速览已推送，附件为内部纪要索引。" },
];
