# reference 参考库说明

本目录是 Glue Coding 的**样式与页面骨架来源**：新需求应从这里选最接近的 HTML 复制到 **`output/`** 再改，不要直接覆盖这里的文件。

- **协作流程、检查清单、版权与溯源**：根目录 **`AGENTS.md`**
- **客户品牌与约束**：**`my-style/README.md`**
- **各文件一句介绍与场景分类**：`AGENTS.md` 中的「Reference 参考库索引」（以该节为权威列表，本文不重复维护完整清单）

## 子目录速览

| 目录 | 典型需求 |
|------|----------|
| `ai-town/` | 漫画风办公室、小镇、创意展示 |
| `solution-prototype/` | 管理后台、仪表盘、表格、侧栏导航 |
| `bi/` | KPI、图表、深色数据看板 |
| `report-html/` | 打印友好报告、提案、工作坊文档 |
| `visual/` | Canvas/SVG 动画、算法或概念演示 |

`solution-prototype/README.md` 为该原型子项目自带说明，可一并参考。

---

## 示例一：端到端（报告页 → 客户交付）

**场景**：需要一页「工作坊后续行动」类文档，要求章节清晰、可打印，并换成客户品牌色。

1. **读约束**  
   打开 `my-style/`：若有 `style-guide.md` / `colors.css`，记下主色、字体与禁忌；没有则本步跳过，沿用参考页默认样式。

2. **选骨架**  
   在 `report-html/` 中选与版式最接近的文件，例如 **`workshop-next-steps.html`**（步骤列表 + 章节导航 + 打印样式）。

3. **复制到产出目录**  
   将整文件复制为 **`output/acme-next-steps.html`**（文件名自定；多项目可用 `output/项目名/xxx.html`）。

4. **胶水式修改**（保持 DOM 结构与 class 命名习惯，先替换再微调）  
   - 改 `<title>`、主标题、各章节标题与正文占位内容  
   - 若有品牌色：在 `:root` 或现有 CSS 变量上改值，避免重命名变量导致漏改  
   - 保留原有交互（如目录跳转、展开）的逻辑，只改数据与文案

5. **溯源注释**（建议放在 `<html>` 后首段注释）  

   ```html
   <!-- Glue source: reference/report-html/workshop-next-steps.html | Generated: YYYY-MM-DD | Changes: 品牌色、文案、客户 Logo -->
   ```

6. **自检**  
   对照根目录 `AGENTS.md` 中的检查清单：未改坏 `reference/` 原件、第三方脚本版权说明仍在、打印预览正常。

**向 AI 下指令时可写**：「按 `AGENTS.md` 流程，以 `reference/report-html/workshop-next-steps.html` 为骨架，输出到 `output/acme-next-steps.html`，并遵守 `my-style/` 下已有文件。」

---

## 示例二：迷你场景（BI 看板）

**需求**：快速做一个深色 KPI + 图表原型给客户看。  
**做法**：复制 **`bi/qatar-bi-dashboard.html`**（或 `bestbuy-bi-dashboard.html`）到 **`output/prototype-kpi.html`**，只改卡片标题、假数据与 `:root` 主色；Chart.js 等 CDN 与版权注释保留。  
**若同时要企业后台壳子**：结构层可参考 **`solution-prototype/admin-dashboard.html`**，图表区用 `bi/` 中一截布局拼接（胶水 = 少改动的 DOM 合并 + 统一 CSS 变量）。

---

## 发现参考页的小技巧

- 先按上表锁定子目录，再在 `AGENTS.md` 索引里点名打开对应 `.html`。  
- 单文件很大时，优先搜 `:root`、`--`、`<style`、主要 `<section` 结构，再决定复制整页还是截取模块。
