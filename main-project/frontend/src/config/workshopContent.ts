/**
 * 右侧 Workshop 侧栏：与《投研助手-Workshop-环节与教学法映射》§一～§四 对齐，
 * 便于课堂对照「阶段 / 练习目标 / API / 复刻路径」。
 */
export type WorkshopImplementationBlock = {
  title: string;
  body: string;
};

export type WorkshopPanelConfig = {
  title: string;
  summary: string;
  /** 与主导航一致的业务模块名 */
  moduleLabel: string;
  /** §三 侧栏序号与教学法焦点 */
  phase: {
    indexLabel: string;
    name: string;
    teachingFocus: string;
  };
  /** §一 总表中与本页强相关的主练环节（简写） */
  primaryPedagogy: string[];
  practiceGoals: string[];
  /** 主要 Flask 路径（前缀 /api/v1，与 OpenAPI 一致） */
  apis: string[];
  /** 如何复刻：Spec / Glue / Debug / 联调 等 */
  implementation: WorkshopImplementationBlock[];
  /** §四 Epic 快捷对照（可选） */
  epicHint?: string;
};

const DEFAULT_WORKSHOP: WorkshopPanelConfig = {
  title: "Workshop",
  summary: "本侧栏按路由展示教学法落点与接口；未匹配路由时显示默认说明。",
  moduleLabel: "未映射页面",
  phase: {
    indexLabel: "—",
    name: "未配置",
    teachingFocus: "请在对照文档「功能 × 环节」总表中查找相近模块，或在 workshopContent.ts 补充本路由。",
  },
  primaryPedagogy: ["对照《环节与教学法映射》§一"],
  practiceGoals: ["确认浏览器地址栏 pathname 是否已录入 MAP", "参考已配置页面的 implementation 块格式补全"],
  apis: ["GET /api/v1/system/settings", "GET /api/v1/system/health"],
  implementation: [
    {
      title: "配置侧栏",
      body: "编辑 `frontend/src/config/workshopContent.ts`，为当前 pathname 增加与邻页同结构的 `WorkshopPanelConfig`。",
    },
    {
      title: "Spec Coding",
      body: "新能力先改 `openapi.yaml` / 企业 Spec，再实现路由与 JSON Store。",
    },
  ],
};

const workbenchPanel: WorkshopPanelConfig = {
  title: "工作台 · Workshop",
  summary:
    "纵向分区：今日概览 KPI、能力入口网格、待办复核队列、最近活动（血缘）、系统与合规提示；对齐调研中「可追溯、合规、Mock/在线可区分」诉求，非三栏布局。",
  moduleLabel: "工作台",
  phase: {
    indexLabel: "⓪",
    name: "工作台",
    teachingFocus: "Git 合并演示、集成联调、Debug 入口；各 Epic 合流后的统一演示首页。",
  },
  primaryPedagogy: ["Git 分支协作（●）", "团队需求变更", "Debug", "Code Review"],
  practiceGoals: [
    "合并 feature 分支后验证 KPI / 待办 / 最近会话数据是否来自同一 DATA_DIR",
    "用健康检查区分百炼在线与离线 Mock",
    "排演从本页跳转到子模块的演示脚本",
  ],
  apis: [
    "GET /api/v1/dashboard/kpi",
    "GET /api/v1/dashboard/todos",
    "GET /api/v1/sessions/recent",
    "GET /api/v1/system/health",
  ],
  implementation: [
    {
      title: "Spec Coding",
      body: "dashboard、sessions 等字段与 OpenAPI 对齐；变更先改契约再改 `dashboard_bp` 与种子 JSON。",
    },
    {
      title: "Git / 团队联调",
      body: "认领 Epic 的同学在 `integration/workshop` 或约定分支合并；冲突优先对齐 openapi 与共享类型。",
    },
    {
      title: "Debug",
      body: "Network 面板查 /api/v1 前缀与 Vite 代理；trace_id 可链到血缘页核对 JSON Store。",
    },
  ],
  epicHint: "Epic 2 集成；亦是各 Epic 完成后的合流演示节点。",
};

const MAP: Record<string, WorkshopPanelConfig> = {
  "/": workbenchPanel,
  "/workbench": workbenchPanel,
  "/research-qa": {
    title: "研报问答①（MVP） · Workshop",
    summary: "简化问答链路；默认不在侧栏显示，可在「设置」打开「显示研报问答①」。",
    moduleLabel: "研报问答①（MVP）",
    phase: {
      indexLabel: "①",
      name: "研报问答（MVP）",
      teachingFocus: "Spec Coding 初版：先契约、再实现问答与引用链。",
    },
    primaryPedagogy: ["Spec Coding（●）", "Git", "测试", "Code Review", "Debug"],
    practiceGoals: [
      "跑通 POST /research/qa/ask 与 session 本地状态",
      "核对 evidence_refs、trace_id 与 openapi 响应模型",
      "对比 change 模式下的头部与风险字段差异",
    ],
    apis: ["POST /api/v1/research/qa/ask", "POST /api/v1/research/qa/upload", "GET /api/v1/system/health"],
    implementation: [
      {
        title: "Spec Coding",
        body: "对齐 MVP 请求体（spec_milestone 等）；改接口先改 OpenAPI 与 TC-QA。",
      },
      {
        title: "测试",
        body: "pytest 覆盖 JsonStore 与 ask  happy path；手工验收引用列表是否展示。",
      },
      {
        title: "Code Review",
        body: "关注 trace 是否丢失、提示词与合规话术是否进审计字段。",
      },
    ],
    epicHint: "Epic 1 / Epic 3 前置；与 ② 场景做回归对照。",
  },
  "/research-qa-change": {
    title: "研报问答 · Workshop",
    summary: "主入口：规格迭代场景（ira-1.1.0、风险标签等），功能较 MVP 更完整。",
    moduleLabel: "研报问答",
    phase: {
      indexLabel: "②",
      name: "规格迭代（需求变更）",
      teachingFocus: "在稳定契约上增量：X-Spec-Version、risk_level 等，并回归 MVP 行为。",
    },
    primaryPedagogy: ["Spec 需求变更（●）", "Git", "测试", "Code Review", "Debug"],
    practiceGoals: [
      "请求携带 X-Spec-Version: ira-1.1.0 与 require_risk_label 等变更字段",
      "写出 openapi diff 与增量 TC（T9-3）",
      "演示「改规格 → 前后端同时改 → 回归①」",
    ],
    apis: ["POST /api/v1/research/qa/ask（+ 头 X-Spec-Version）", "POST /api/v1/research/qa/upload", "GET /api/v1/kb/documents"],
    implementation: [
      {
        title: "Spec Coding · 变更",
        body: "分支上增量修改 openapi 与 ADR；禁止静默破坏已有字段语义。",
      },
      {
        title: "测试 / 回归",
        body: "对①用例全量跑一遍；新增用例只覆盖增量行为。",
      },
      {
        title: "Debug",
        body: "400/422 时对照 Spec 版本与请求体；日志中搜 trace_id。",
      },
    ],
    epicHint: "Epic 3；衔接 T3-1 / T9-3。",
  },
  "/compliance": {
    title: "合规与宣传审查 · Workshop",
    summary:
      "单栏分区：模块说明、KPI、场景速检、话术扫描、规则表、监管映射示意、审计流水；对接 /compliance/* 与血缘 trace。",
    moduleLabel: "合规与宣传审查",
    phase: {
      indexLabel: "③",
      name: "合规",
      teachingFocus: "Rules 与扫描行为契约化；Code Review 关卡 B 重点模块（易踩监管红线）。",
    },
    primaryPedagogy: ["Spec Coding（●）", "测试", "Code Review（●●）", "Debug"],
    practiceGoals: [
      "维护 rules.json 与 R-Gxx ID 在前后端一致",
      "每次 scan 生成 trace_id 并可从审计表跳转血缘",
      "走一遍「命中 → 拦截态 → blocks 记录」演示",
    ],
    apis: ["GET /api/v1/compliance/rules", "POST /api/v1/compliance/scan", "GET /api/v1/compliance/blocks/recent"],
    implementation: [
      {
        title: "Spec Coding",
        body: "扫描请求/响应与 openapi Compliance 段一致；规则版本号 ruleset_version 写入响应。",
      },
      {
        title: "测试",
        body: "pytest 覆盖规则命中与 blocks 追加；边界词与空文本。",
      },
      {
        title: "Code Review（关卡 B）",
        body: "合并到 demo/workshop 前建议合规角色或第二人 Approve（T5-2）。",
      },
    ],
    epicHint: "Epic 5；横切 trace 与 openapi。",
  },
  "/lineage": {
    title: "数据与结论血缘 · Workshop",
    summary:
      "【M2 对照】ira 侧重 trace/披露血缘（管道下游）；多源采集与 ingest 任务在 modules-practice/module-02。区分投研结论血缘、监管披露溯源与技术 trace；生产可接元数据平台与 OpenLineage。",
    moduleLabel: "数据血缘 · M2 对照",
    phase: {
      indexLabel: "④",
      name: "血缘",
      teachingFocus: "trace 字段子集 Spec 化；与 Debug、监管问询叙事绑定。",
    },
    primaryPedagogy: ["Spec Coding（●）", "多 Agent（叙事）", "Git", "测试", "Debug（●）"],
    practiceGoals: [
      "用 trace_id 拉取 GET /lineage/traces/{id} 并对照前端展示",
      "区分「结论血缘 Mock」与「技术 traces.json」两数据源",
      "练习从合规 scan、QA 返回中复制 trace 调试",
    ],
    apis: ["GET /api/v1/lineage/traces/{trace_id}", "GET /api/v1/lineage/search"],
    implementation: [
      {
        title: "Spec Coding",
        body: "trace 结构、分页与错误码写入 openapi；与 compliance/qa 返回字段对齐。",
      },
      {
        title: "Debug",
        body: "官方排障入口之一：404 trace 时检查 traces.json 与 DATA_DIR。",
      },
      {
        title: "Glue / M2",
        body: "完整 Glue BFF（/api/v1/ingest/*、VIN Mock）在 module-02；ira 仅消费 traces.json 等演示产物。",
      },
    ],
    epicHint: "Epic 1（trace）+ Epic 8 Debug 叙事。",
  },
  "/stock-analysis": {
    title: "个股覆盖 · Workshop",
    summary:
      "【M2 对照】演示行情与分析草稿（外源消费侧）；module-02 的 ira-vin-mocks / ingest 为上游管线。对标公募覆盖页：抬头、估值示意、备忘录与风险分栏。",
    moduleLabel: "个股覆盖 · M2 对照",
    phase: {
      indexLabel: "⑤",
      name: "个股",
      teachingFocus: "Glue Coding：行情 Mock、超时、as_of 口径；可接 MCP 工具但合规扫描仍走 HTTP。",
    },
    primaryPedagogy: ["Glue Coding（●）", "MCP/Skill（辅）", "测试", "Debug"],
    practiceGoals: [
      "调用 stock quote / analysis 接口理解 mock 与 tool_trace",
      "说明若接 Wind/同花顺时的降级策略",
      "备忘录与 trace 写回演示",
    ],
    apis: ["GET /api/v1/research/stock/quote", "POST /api/v1/research/stock/analysis"],
    implementation: [
      {
        title: "Glue Coding",
        body: "在 Flask 内封装 Provider；前端不合并多源口径，展示层标注 mock。",
      },
      {
        title: "MCP / Skill",
        body: "外部工具经 MCP 调 BFF 时，出参需带 tool_trace 与合规可审计字段。",
      },
      {
        title: "测试",
        body: "Mock 行情固定种子；集成测试校验 analysis 结构。",
      },
    ],
    epicHint: "Epic 4 / Epic 6 · Glue 叙事。",
  },
  "/multi-agent-stock": {
    title: "多 Agent · Workshop",
    summary:
      "典型投研编排：fan-out 并行 → artifact 回传 → reply_to 互评 → merge → 合规闸门。页面默认展示完整场景与消息总线，运行按钮对接后端脚本演示。",
    moduleLabel: "多 Agent",
    phase: {
      indexLabel: "⑧",
      name: "多 Agent",
      teachingFocus: "运行时编排 + Qoder Experts 人类分工叙事同构；合并冲突禁止静默覆盖。",
    },
    primaryPedagogy: ["多 Agent（●）", "Qoder Experts（●）", "测试", "Code Review", "重构"],
    practiceGoals: [
      "解读 discussion[]、reply_to 与 merge 节点",
      "跑通 POST …/multi-agent/run 并核对返回 trace",
      "排演固定脚本：标的 + 轮次 + 一条互评",
    ],
    apis: ["POST /api/v1/research/stock/multi-agent/run"],
    implementation: [
      {
        title: "Spec Coding",
        body: "run 请求体、discussion 结构与 openapi 严格一致；变更同步前端类型。",
      },
      {
        title: "Qoder Experts",
        body: "课堂可按行业/量化/合规角色分桌，再对照页面三卡片。",
      },
      {
        title: "Code Review（关卡 B）",
        body: "合并稿与合规闸门逻辑建议双人把关（T4-3）。",
      },
    ],
    epicHint: "Epic 4；任务 T4-3 / T4-4。",
  },
  "/sentiment": {
    title: "舆情监控 · Workshop",
    summary:
      "公募侧典型需求：多源聚合、分级预警、重仓关联、合规关键词矩阵与管线可观测性。页面主体为 Mock；生产可替换为采购数据源 + 内部 NLP + 权限审计。",
    moduleLabel: "舆情监控",
    phase: {
      indexLabel: "⑥",
      name: "舆情",
      teachingFocus: "Glue + ingest：RSS/爬虫/Mock 接入、告警列表与联调区。",
    },
    primaryPedagogy: ["Glue Coding（●）", "ingest", "Git", "Debug"],
    practiceGoals: [
      "走通 watchlist / alerts / ingest 最小闭环",
      "区分页面 Mock 大盘与底部真实 API 联调区",
      "记录外部源超时与降级策略",
    ],
    apis: [
      "GET /api/v1/sentiment/watchlist",
      "GET /api/v1/sentiment/alerts",
      "POST /api/v1/sentiment/ingest",
    ],
    implementation: [
      {
        title: "Glue Coding",
        body: "ingest 入参校验与写入 JSON Store；生产替换为队列 + Worker。",
      },
      {
        title: "团队联调",
        body: "舆情常独立 Epic（如 Epic6），合并前与工作台 KPI 文案对齐。",
      },
    ],
    epicHint: "Epic 6。",
  },
  "/knowledge": {
    title: "知识库 · Workshop",
    summary:
      "投研知识中台：集合/ACL、分块与索引管线、可检索清单；与上传与向量服务对接时可替换 Mock 指标。",
    moduleLabel: "知识库",
    phase: {
      indexLabel: "⑦",
      name: "知识库",
      teachingFocus: "Qoder Quest：入库 → 解析 → 索引 → 与 QA 引用联动的分步链条。",
    },
    primaryPedagogy: ["Qoder Quest（教学法 ●）", "Git", "Code Review"],
    practiceGoals: [
      "梳理 Quest 顺序：元数据 → 分块状态 → ask 引用",
      "对照 GET /kb/documents 与前端列表字段",
      "规划与 Epic3/4 的依赖（先文档后问答）",
    ],
    apis: ["GET /api/v1/kb/documents", "GET /api/v1/kb/index/status"],
    implementation: [
      {
        title: "Quest 拆条",
        body: "大任务拆成可排序子任务，每步有完成条件；不必与 CoPaw 产品内 Quest 混名。",
      },
      {
        title: "Spec Coding",
        body: "文档与索引状态模型进 openapi；权限字段预留。",
      },
    ],
    epicHint: "Epic 3～4；T9-1 种子数据。",
  },
  "/messages": {
    title: "推送 · Workshop",
    summary:
      "多通道（钉钉/飞书/邮件）与合规前置扫描、dry-run 审计；生产接 Webhook、飞书开放平台、SMTP。",
    moduleLabel: "消息推送",
    phase: {
      indexLabel: "⑩",
      name: "推送",
      teachingFocus: "Glue（渠道配置 + 发送）+ Code Review 关卡 B（误发风险）。",
    },
    primaryPedagogy: ["Glue Coding（●）", "测试", "Code Review（●●）", "Debug"],
    practiceGoals: [
      "PUT channels 与 POST push dry-run 演示",
      "说明为何推送前走合规 scan",
      "审计 history 与 trace 字段",
    ],
    apis: [
      "GET /api/v1/notify/channels",
      "PUT /api/v1/notify/channels",
      "POST /api/v1/notify/push",
      "GET /api/v1/notify/history",
    ],
    implementation: [
      {
        title: "Glue Coding",
        body: "渠道 JSON 与真实 Webhook/SMTP 适配器在 Flask 分层；前端只调 REST。",
      },
      {
        title: "Code Review（关卡 B）",
        body: "合并 demo 分支前强制第二人看推送与密钥相关 diff（T7-2）。",
      },
      {
        title: "测试",
        body: "push 集成测试使用 dry-run 断言不写外网。",
      },
    ],
    epicHint: "Epic 7。",
  },
  "/reports": {
    title: "报告与披露登记 · Workshop",
    summary:
      "登记簿全宽布局：KPI、筛选、明细表；报告名与「详情」打开抽屉；「推进环节」或当前环节徽章可 PATCH 下一环节；trace 链路至血缘。",
    moduleLabel: "报告登记",
    phase: {
      indexLabel: "⑪",
      name: "报告",
      teachingFocus: "团队需求变更：在已有登记簿上插字段/环节，练 Spec 补丁 + 回归。",
    },
    primaryPedagogy: ["Git（●）", "团队需求变更（●）", "Code Review"],
    practiceGoals: [
      "PATCH workflow_stage 并理解 JSON 草稿持久化",
      "写 1 页变更单 + openapi reports 段 diff",
      "演示与 OA/文档库对接时的字段映射表",
    ],
    apis: ["GET /api/v1/reports/drafts", "GET/PATCH /api/v1/reports/drafts/{draft_id}"],
    implementation: [
      {
        title: "团队需求变更",
        body: "非从零造模块；在 report_drafts.json 模型上增量，配套 TC 修订。",
      },
      {
        title: "Git / 联调",
        body: "报告模块常独立分支；合并时与工作台「报告 KPI」对齐。",
      },
    ],
    epicHint: "Epic 7 可并进；index 侧栏 ⑪ 叙事一致。",
  },
  "/settings": {
    title: "系统参数与运维 · Workshop",
    summary:
      "运行环境矩阵、LLM 状态、PUT 偏好（默认路由/侧栏/报告筛选）；Swagger 链接与合规提示；表单网格撑满主区。",
    moduleLabel: "设置",
    phase: {
      indexLabel: "⑨",
      name: "设置",
      teachingFocus: "Debug / 特性开关；健康检查与 openapi 入口聚合。",
    },
    primaryPedagogy: ["Debug（●）", "Glue（辅）"],
    practiceGoals: [
      "读 GET /system/settings 与 PUT /system/preferences",
      "用 Swagger 验证 JWT 占位与路径前缀",
      "扩展只读字段（构建号等）时的 openapi 同步",
    ],
    apis: ["GET /api/v1/system/settings", "PUT /api/v1/system/preferences", "GET /api/v1/system/health"],
    implementation: [
      {
        title: "Debug",
        body: "排障第一站：后端是否启动、规则集版本、百炼是否启用。",
      },
      {
        title: "Spec Coding（轻量）",
        body: "preferences 白名单字段在 system_bp 与前端类型双处维护。",
      },
    ],
    epicHint: "横切；Epic 8 叙事入口。",
  },
};

/**
 * 推荐：路由 → 本配置；与 React Router pathname 一致（含 / 与 /workbench）。
 */
export function resolveWorkshopContent(pathname: string): WorkshopPanelConfig {
  if (MAP[pathname]) return MAP[pathname];
  return DEFAULT_WORKSHOP;
}
