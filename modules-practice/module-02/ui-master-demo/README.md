# 五模块 UI 主视觉参考（静态 Demo）

单文件 **`index.html`**，用浏览器直接打开即可（或 `npx serve` 静态托管）。

**目的**：把各模块 **`specs/workshop/module-*/docs/`** 中 `06-功能规格说明` 里描述的 **典型界面区块** 做成一屏可看的「样板」，减少「Spec 写了但每个人想象不一致」的问题。

**说明**：

- 色板与 **M2 参考前端**（`modules-practice/module-02/m2-glue-reference/frontend`）一致：**深蓝主色 `#003d82` + 红色强调 `#c41230`**，作为全工作坊 **默认主视觉**（全模块共用 Shell，内页可在此基础上加模块色条区分）。
- 文案、字段名尽量贴近各模块 **`09` DTO**（如 `messageId`、`read`、`jobId`、`documentId`、`agentId`）。
- **不是** 像素级最终稿；实现时可换组件库，但建议 **保留色板与信息层级**。
