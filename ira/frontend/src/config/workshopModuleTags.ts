/**
 * IRA 主项目内与 `modules-practice/module-0x` 的课堂对照标记（非独立实现）。
 * M2 的完整 Ingest/Glue BFF 在练习目录 `module-02/m2-glue-*`，ira 无 `/api/v1/ingest/*`。
 */

const MODULE_PATHS: Record<string, Set<string>> = {
  M1: new Set(["/research-qa-change", "/research-qa"]),
  M2: new Set(["/lineage", "/stock-analysis"]),
  M3: new Set(["/knowledge"]),
  M4: new Set(["/messages"]),
  M5: new Set(["/multi-agent-stock"]),
};

const HINTS: Record<string, string> = {
  "/research-qa-change": "主线 M1：Spec Coding 主入口（规格迭代与风险标签）。",
  "/research-qa": "M1 对照页：MVP 版本问答链路（可在设置中显示）。",
  "/lineage":
    "叙事对照 M2：展示 trace/披露血缘（管道下游可追溯）。多源采集与同步任务见 module-02 的 /api/v1/ingest/*。",
  "/stock-analysis":
    "叙事对照 M2：演示行情与草稿（外源数据消费侧 Mock）。VIN Mock 与 Ingest 运维台在 module-02。",
  "/knowledge": "主线 M3：知识库文档管理与问答证据引用。",
  "/messages": "主线 M4：多渠道推送，支持发送前合规校验与投递记录。",
  "/multi-agent-stock": "主线 M5：多Agent股票分析，CoPaw-first 编排并支持本地回退。",
};

/** 页头/侧栏展示的简短标记，例如「M2」 */
export function workshopModuleCode(pathname: string): string | undefined {
  for (const [code, paths] of Object.entries(MODULE_PATHS)) {
    if (paths.has(pathname)) return code;
  }
  return undefined;
}

export function workshopModuleTitleHint(pathname: string): string | undefined {
  return HINTS[pathname];
}
