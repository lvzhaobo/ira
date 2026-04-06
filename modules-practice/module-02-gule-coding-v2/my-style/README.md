# my-style：新客户快速上手

本目录放**你的品牌与约束**，Glue Coding 流程里优先级高于 `reference/` 里的默认样式。AI 与人协作时应先读这里，再选参考 HTML 当骨架。

## 你需要做的三件事

1. **读根目录的 `AGENTS.md`**  
   了解「先抄 `reference/`、再按 `my-style/` 覆盖」的完整流程与检查清单。

2. **按需在本目录补充文件（可从下面模板起步）**  
   - `style-guide.md`：品牌色、字体、组件气质、禁忌（最推荐先写）  
   - `colors.css`：仅变量/色板，方便在生成页里 `@import` 或复制进 `:root`  
   - `components-spec.md`：按钮、卡片、导航等具体规则  
   - `requirements.md`：布局必须/禁止、可访问性、目标浏览器等  

   没有文件也可以先开工：此时以 `reference/` 为准；建议你至少新建 `style-guide.md` 写几条主色与字体，减少返工。

3. **向 AI 说明**  
   提需求时加一句：「已看 / 将遵守 `my-style/` 下的某某文件」，并指定交付物写到项目根目录的 **`output/`**（见 `AGENTS.md`），不要改 `reference/` 里的原文件。

## 和 reference 的关系（一句话）

`reference/` = 可复制的页面骨架与交互模式；`my-style/` = 你的视觉与产品约束。二者叠加才是你的成品。

## 更多信息

- 完整索引、各方向 HTML 列表：根目录 **`AGENTS.md`**
- 从复制到交付的 **Glue 示例**（端到端 + 迷你场景）：**`reference/README.md`**
