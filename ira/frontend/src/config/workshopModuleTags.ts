/**
 * IRA 主项目内与 `modules-practice/module-0x` 的课堂对照标记（非独立实现）。
 * M2 的完整 Ingest/Glue BFF 在练习目录 `module-02/m2-glue-*`，ira 无 `/api/v1/ingest/*`。
 */

const M2_PATHS = new Set(["/lineage", "/stock-analysis"]);

const HINTS: Record<string, string> = {
  "/lineage":
    "叙事对照 M2：展示 trace/披露血缘（管道下游可追溯）。多源采集与同步任务见 module-02 的 /api/v1/ingest/*。",
  "/stock-analysis":
    "叙事对照 M2：演示行情与草稿（外源数据消费侧 Mock）。VIN Mock 与 Ingest 运维台在 module-02。",
};

/** 页头/侧栏展示的简短标记，例如「M2」 */
export function workshopModuleCode(pathname: string): string | undefined {
  if (M2_PATHS.has(pathname)) return "M2";
  return undefined;
}

export function workshopModuleTitleHint(pathname: string): string | undefined {
  return HINTS[pathname];
}
