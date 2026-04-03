# UI组件库

<cite>
**本文引用的文件**
- [ThemeToggleButton/index.tsx](file://console/src/components/ThemeToggleButton/index.tsx)
- [ThemeToggleButton/index.module.less](file://console/src/components/ThemeToggleButton/index.module.less)
- [ThemeContext.tsx](file://console/src/contexts/ThemeContext.tsx)
- [LanguageSwitcher.tsx](file://console/src/components/LanguageSwitcher.tsx)
- [Header.tsx](file://console/src/layouts/Header.tsx)
- [MarkdownCopy/MarkdownCopy.tsx](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx)
- [MarkdownCopy/index.module.less](file://console/src/components/MarkdownCopy/index.module.less)
- [markdown.ts](file://console/src/utils/markdown.ts)
- [i18n.ts](file://console/src/i18n.ts)
- [AgentSelector/index.tsx](file://console/src/components/AgentSelector/index.tsx)
- [AgentSelector/index.module.less](file://console/src/components/AgentSelector/index.module.less)
- [layouts/constants.ts](file://console/src/layouts/constants.ts)
- [locales/en.json](file://console/src/locales/en.json)
- [locales/zh.json](file://console/src/locales/zh.json)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考量](#性能考量)
8. [故障排查指南](#故障排查指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介
本文件为 CoPaw 控制台前端 UI 组件库的权威文档，聚焦于可复用 UI 组件的设计原则、接口与使用模式。重点覆盖以下组件：
- 主题切换按钮（ThemeToggleButton）
- 语言切换器（LanguageSwitcher）
- 页面头部（Header）
- Markdown 复制组件（MarkdownCopy）

文档将从架构、数据流、处理逻辑、集成点、错误处理与性能优化等维度进行系统化阐述，并提供无障碍访问、响应式设计与样式定制建议，以及使用示例与最佳实践。

## 项目结构
UI 组件主要位于 console/src/components 与 console/src/layouts 下，配合上下文、国际化与样式模块共同构成完整的组件生态。关键目录与职责如下：
- console/src/components：通用 UI 组件（如 ThemeToggleButton、LanguageSwitcher、MarkdownCopy、AgentSelector）
- console/src/contexts：应用级上下文（如 ThemeContext）
- console/src/layouts：布局组件（如 Header）
- console/src/utils：工具函数（如 markdown 去除 YAML frontmatter）
- console/src/locales 与 console/src/i18n.ts：国际化资源与初始化
- console/src/styles：全局样式覆盖（如表单与布局）

```mermaid
graph TB
subgraph "组件层"
TT["ThemeToggleButton"]
LS["LanguageSwitcher"]
MC["MarkdownCopy"]
AS["AgentSelector"]
HD["Header"]
end
subgraph "上下文与国际化"
TC["ThemeContext"]
I18N["i18n 初始化"]
LOCA["locales/*.json"]
end
subgraph "工具与样式"
MDU["markdown 工具"]
STY1["ThemeToggleButton 样式"]
STY2["MarkdownCopy 样式"]
STY3["AgentSelector 样式"]
end
TT --> TC
HD --> TT
HD --> LS
HD --> AS
MC --> MDU
I18N --> LOCA
I18N --> HD
I18N --> TT
I18N --> LS
I18N --> MC
TT -.样式.-> STY1
MC -.样式.-> STY2
AS -.样式.-> STY3
```

图表来源
- [ThemeToggleButton/index.tsx:11-28](file://console/src/components/ThemeToggleButton/index.tsx#L11-L28)
- [ThemeContext.tsx:51-100](file://console/src/contexts/ThemeContext.tsx#L51-L100)
- [LanguageSwitcher.tsx:6-58](file://console/src/components/LanguageSwitcher.tsx#L6-L58)
- [Header.tsx:28-90](file://console/src/layouts/Header.tsx#L28-L90)
- [MarkdownCopy/MarkdownCopy.tsx:43-194](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L43-L194)
- [markdown.ts:8-9](file://console/src/utils/markdown.ts#L8-L9)
- [i18n.ts:22-29](file://console/src/i18n.ts#L22-L29)

章节来源
- [ThemeToggleButton/index.tsx:11-28](file://console/src/components/ThemeToggleButton/index.tsx#L11-L28)
- [ThemeContext.tsx:51-100](file://console/src/contexts/ThemeContext.tsx#L51-L100)
- [LanguageSwitcher.tsx:6-58](file://console/src/components/LanguageSwitcher.tsx#L6-L58)
- [Header.tsx:28-90](file://console/src/layouts/Header.tsx#L28-L90)
- [MarkdownCopy/MarkdownCopy.tsx:43-194](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L43-L194)
- [markdown.ts:8-9](file://console/src/utils/markdown.ts#L8-L9)
- [i18n.ts:22-29](file://console/src/i18n.ts#L22-L29)

## 核心组件
本节概述四大组件的设计目标、职责边界与典型使用场景：
- 主题切换按钮：在明/暗主题之间切换，支持系统跟随模式，提供无障碍标签与提示气泡。
- 语言切换器：提供多语言切换入口，持久化用户选择，展示当前语言标签。
- 页面头部：承载导航、外部链接、语言与主题切换入口，统一风格与交互。
- Markdown 复制组件：支持 Markdown 预览与文本编辑双态，一键复制，可配置控件与样式。

章节来源
- [ThemeToggleButton/index.tsx:7-28](file://console/src/components/ThemeToggleButton/index.tsx#L7-L28)
- [LanguageSwitcher.tsx:6-58](file://console/src/components/LanguageSwitcher.tsx#L6-L58)
- [Header.tsx:28-90](file://console/src/layouts/Header.tsx#L28-L90)
- [MarkdownCopy/MarkdownCopy.tsx:10-53](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L10-L53)

## 架构总览
组件间协作关系与数据流向如下：

```mermaid
sequenceDiagram
participant U as "用户"
participant H as "Header"
participant T as "ThemeToggleButton"
participant Ctx as "ThemeContext"
participant L as "LanguageSwitcher"
participant M as "MarkdownCopy"
U->>H : 打开页面
H->>T : 渲染主题切换按钮
H->>L : 渲染语言切换器
H->>M : 渲染 Markdown 区域可选
U->>T : 点击切换
T->>Ctx : toggleTheme()
Ctx-->>T : 更新 isDark 与 themeMode
T-->>U : 视觉反馈类名/图标/提示
U->>L : 选择语言
L->>L : changeLanguage(lang)
L->>L : localStorage.setItem("language", lang)
L-->>U : 切换界面语言
U->>M : 切换预览/编辑态
M-->>U : 切换渲染模式
U->>M : 点击复制
M-->>U : 复制成功/失败提示
```

图表来源
- [Header.tsx:28-90](file://console/src/layouts/Header.tsx#L28-L90)
- [ThemeToggleButton/index.tsx:11-28](file://console/src/components/ThemeToggleButton/index.tsx#L11-L28)
- [ThemeContext.tsx:79-91](file://console/src/contexts/ThemeContext.tsx#L79-L91)
- [LanguageSwitcher.tsx:11-14](file://console/src/components/LanguageSwitcher.tsx#L11-L14)
- [MarkdownCopy/MarkdownCopy.tsx:75-109](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L75-L109)

## 详细组件分析

### 主题切换按钮（ThemeToggleButton）
- 设计原则
  - 以最小交互承载明/暗主题切换，支持“系统跟随”模式。
  - 通过 Tooltip 提供可读性更强的标题文案，结合 aria-label 提升无障碍体验。
  - 使用 CSS 类名动态切换暗色模式，避免硬编码颜色。
- 关键接口
  - 无外部 props，内部通过 ThemeContext 获取 isDark 与 toggleTheme。
  - 国际化文案来自 t()，标题与按钮文本随语言切换。
- 数据流
  - 用户点击 -> 调用 toggleTheme -> 更新 ThemeContext -> 影响 <html> 类名 -> 应用全局样式。
- 样式定制
  - 可通过覆盖 .toggleBtn 与 :global(.dark-mode) .toggleBtn 实现品牌色与悬停效果。
- 无障碍与响应式
  - aria-label 与 Tooltip 提升可访问性；按钮尺寸与间距适配移动端。
- 性能与优化
  - 使用 memo 化与受控状态，避免不必要的重渲染；切换逻辑为常量时间。

```mermaid
flowchart TD
Start(["点击按钮"]) --> Toggle["调用 toggleTheme()"]
Toggle --> UpdateCtx["更新 ThemeContext<br/>themeMode/isDark"]
UpdateCtx --> ApplyClass["为 <html> 添加/移除 'dark-mode'"]
ApplyClass --> Render["组件与全局样式重绘"]
Render --> End(["完成"])
```

图表来源
- [ThemeToggleButton/index.tsx:11-28](file://console/src/components/ThemeToggleButton/index.tsx#L11-L28)
- [ThemeContext.tsx:57-65](file://console/src/contexts/ThemeContext.tsx#L57-L65)
- [ThemeContext.tsx:79-91](file://console/src/contexts/ThemeContext.tsx#L79-L91)

章节来源
- [ThemeToggleButton/index.tsx:7-28](file://console/src/components/ThemeToggleButton/index.tsx#L7-L28)
- [ThemeToggleButton/index.module.less:1-37](file://console/src/components/ThemeToggleButton/index.module.less#L1-L37)
- [ThemeContext.tsx:51-100](file://console/src/contexts/ThemeContext.tsx#L51-L100)

### 语言切换器（LanguageSwitcher）
- 设计原则
  - 下拉菜单展示多语言选项，当前语言高亮，支持本地持久化。
  - 通过 localStorage 记录用户选择，刷新后保持一致。
- 关键接口
  - changeLanguage(lang)：更新 i18n 语言与本地存储。
  - items：菜单项数组，包含语言键与点击回调。
- 数据流
  - 用户选择 -> changeLanguage -> i18n.changeLanguage -> localStorage 更新 -> 组件重渲染。
- 样式定制
  - 可通过 antd/自定义样式覆盖按钮与下拉项外观。
- 无障碍与响应式
  - 使用全局图标与文本标签，适配不同屏幕尺寸。
- 性能与优化
  - 语言切换为 O(1) 操作，菜单项静态配置，渲染成本低。

```mermaid
sequenceDiagram
participant U as "用户"
participant LS as "LanguageSwitcher"
participant I18N as "i18n"
participant Store as "localStorage"
U->>LS : 点击语言项
LS->>I18N : changeLanguage(lang)
I18N-->>LS : 切换语言
LS->>Store : setItem("language", lang)
LS-->>U : 界面语言更新
```

图表来源
- [LanguageSwitcher.tsx:11-14](file://console/src/components/LanguageSwitcher.tsx#L11-L14)
- [i18n.ts:24-24](file://console/src/i18n.ts#L24-L24)

章节来源
- [LanguageSwitcher.tsx:6-58](file://console/src/components/LanguageSwitcher.tsx#L6-L58)
- [i18n.ts:22-29](file://console/src/i18n.ts#L22-L29)

### 页面头部（Header）
- 设计原则
  - 集成导航、外部链接、语言与主题切换，统一风格与交互。
  - 支持在桌面端显示多按钮，移动端可通过侧边栏或折叠策略优化。
- 关键接口
  - selectedKey：决定标题文案映射。
  - handleNavClick：打开外部链接，优先使用 pywebview API，否则新开窗口。
- 数据流
  - 从 constants.ts 解析 URL 与文案，结合 i18n 与 Tooltip 展示。
- 样式定制
  - 可通过全局样式覆盖 Header 容器与按钮组布局。
- 无障碍与响应式
  - Tooltip 与图标结合，确保可理解性；按钮间距与对齐适配响应式断点。
- 性能与优化
  - 仅在 selectedKey 变更时更新标题；外部链接打开为轻量操作。

```mermaid
sequenceDiagram
participant U as "用户"
participant HD as "Header"
participant C as "constants"
participant I18N as "i18n"
participant WV as "pywebview.api"
U->>HD : 点击外部链接按钮
HD->>C : getDocsUrl()/getFaqUrl()/getReleaseNotesUrl()
HD->>I18N : i18n.language
HD->>WV : open_external_link(url)?
alt 存在 API
WV-->>U : 打开外部链接
else
U->>U : window.open(url, "_blank")
end
```

图表来源
- [Header.tsx:31-40](file://console/src/layouts/Header.tsx#L31-L40)
- [layouts/constants.ts:62-69](file://console/src/layouts/constants.ts#L62-L69)
- [layouts/constants.ts:59-60](file://console/src/layouts/constants.ts#L59-L60)

章节来源
- [Header.tsx:28-90](file://console/src/layouts/Header.tsx#L28-L90)
- [layouts/constants.ts:59-70](file://console/src/layouts/constants.ts#L59-L70)

### Markdown 复制组件（MarkdownCopy）
- 设计原则
  - 双态呈现：Markdown 预览与文本编辑，支持一键复制，可配置控件与样式。
  - 自动去除 YAML frontmatter，提升渲染质量。
- 关键接口
  - 属性：
    - content：原始内容
    - showMarkdown：初始是否显示 Markdown
    - onShowMarkdownChange：预览态变更回调
    - copyButtonProps/markdownViewerProps/textareaProps：控件与容器样式透传
    - showControls/editable/onContentChange：控制条与编辑态开关
  - 方法：
    - copyToClipboard：复制内容至剪贴板（兼容非安全上下文）
    - handleContentChange：编辑态内容变更
    - handleShowMarkdownChange：切换预览态
- 数据流
  - 输入 content -> 去除 frontmatter -> 预览渲染或文本编辑 -> 复制到剪贴板 -> 成功/失败提示。
- 样式定制
  - 通过 markdownViewerProps/style 与 textareaProps/style 自定义容器尺寸与背景。
- 无障碍与响应式
  - 文本区域支持只读与禁用；复制按钮提供 loading 状态；预览容器具备滚动与边框。
- 性能与优化
  - 使用 useMemo 去除 frontmatter，避免重复计算；编辑态与预览态切换为 O(1)。

```mermaid
flowchart TD
In(["输入 content"]) --> Strip["stripFrontmatter(content)"]
Strip --> Decide{"editable 且未禁用?"}
Decide --> |是| Edit["编辑态: textarea 显示 editContent"]
Decide --> |否| Preview{"localShowMarkdown?"}
Preview --> |是| MD["XMarkdown 渲染"]
Preview --> |否| TA["TextArea 渲染"]
Edit --> Copy["点击复制"]
MD --> Copy
TA --> Copy
Copy --> Clip{"navigator.clipboard 可用?"}
Clip --> |是| Write["writeText(content)"]
Clip --> |否| Fallback["创建临时 textarea 并 execCommand('copy')"]
Write --> Notify["message.success/ error"]
Fallback --> Notify
Notify --> Out(["完成"])
```

图表来源
- [MarkdownCopy/MarkdownCopy.tsx:58-61](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L58-L61)
- [MarkdownCopy/MarkdownCopy.tsx:75-109](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L75-L109)
- [markdown.ts:8-9](file://console/src/utils/markdown.ts#L8-L9)

章节来源
- [MarkdownCopy/MarkdownCopy.tsx:10-53](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L10-L53)
- [MarkdownCopy/MarkdownCopy.tsx:58-73](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L58-L73)
- [MarkdownCopy/MarkdownCopy.tsx:75-117](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L75-L117)
- [MarkdownCopy/MarkdownCopy.tsx:150-194](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L150-L194)
- [MarkdownCopy/index.module.less:1-62](file://console/src/components/MarkdownCopy/index.module.less#L1-L62)
- [markdown.ts:8-9](file://console/src/utils/markdown.ts#L8-L9)

### 组件间关系与依赖
- Header 作为容器组件，组合 ThemeToggleButton、LanguageSwitcher 与 AgentSelector。
- ThemeToggleButton 依赖 ThemeContext 提供主题状态与切换方法。
- MarkdownCopy 依赖 markdown 工具函数与国际化文案。
- 语言切换器与国际化资源配合，实现多语言切换。

```mermaid
classDiagram
class ThemeToggleButton {
+无外部props
+依赖 ThemeContext
+依赖 Tooltip/Button
}
class ThemeContext {
+themeMode : "light|dark|system"
+isDark : boolean
+setThemeMode(mode)
+toggleTheme()
}
class LanguageSwitcher {
+changeLanguage(lang)
+依赖 i18n
}
class MarkdownCopy {
+content : string
+showMarkdown : boolean
+copyToClipboard()
+依赖 stripFrontmatter
}
class Header {
+selectedKey : string
+handleNavClick(url)
}
ThemeToggleButton --> ThemeContext : "useTheme()"
Header --> ThemeToggleButton : "组合"
Header --> LanguageSwitcher : "组合"
Header --> AgentSelector : "组合"
MarkdownCopy --> stripFrontmatter : "使用"
```

图表来源
- [ThemeToggleButton/index.tsx:11-28](file://console/src/components/ThemeToggleButton/index.tsx#L11-L28)
- [ThemeContext.tsx:15-30](file://console/src/contexts/ThemeContext.tsx#L15-L30)
- [LanguageSwitcher.tsx:6-58](file://console/src/components/LanguageSwitcher.tsx#L6-L58)
- [MarkdownCopy/MarkdownCopy.tsx:43-194](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L43-L194)
- [Header.tsx:28-90](file://console/src/layouts/Header.tsx#L28-L90)

章节来源
- [ThemeToggleButton/index.tsx:11-28](file://console/src/components/ThemeToggleButton/index.tsx#L11-L28)
- [ThemeContext.tsx:15-30](file://console/src/contexts/ThemeContext.tsx#L15-L30)
- [LanguageSwitcher.tsx:6-58](file://console/src/components/LanguageSwitcher.tsx#L6-L58)
- [MarkdownCopy/MarkdownCopy.tsx:43-194](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L43-L194)
- [Header.tsx:28-90](file://console/src/layouts/Header.tsx#L28-L90)

## 依赖关系分析
- 组件依赖
  - ThemeToggleButton 依赖 ThemeContext 与 antd 图标。
  - LanguageSwitcher 依赖 react-i18next 与 antd 组件。
  - MarkdownCopy 依赖 @agentscope-ai/design、@ant-design/x-markdown、react-i18next 与自定义工具。
  - Header 依赖 Header 布局、antd 组件与 constants。
- 外部依赖
  - i18n：多语言资源与初始化。
  - localStorage：主题与语言偏好持久化。
- 潜在循环依赖
  - 组件间为单向依赖，无循环引入风险。

```mermaid
graph LR
TT["ThemeToggleButton"] --> TC["ThemeContext"]
LS["LanguageSwitcher"] --> I18N["i18n"]
MC["MarkdownCopy"] --> MDU["markdown 工具"]
HD["Header"] --> TT
HD --> LS
HD --> AS["AgentSelector"]
I18N --> LOCA["locales/*.json"]
```

图表来源
- [ThemeToggleButton/index.tsx:1-5](file://console/src/components/ThemeToggleButton/index.tsx#L1-L5)
- [ThemeContext.tsx:1-8](file://console/src/contexts/ThemeContext.tsx#L1-L8)
- [LanguageSwitcher.tsx:1-4](file://console/src/components/LanguageSwitcher.tsx#L1-L4)
- [MarkdownCopy/MarkdownCopy.tsx:1-8](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L1-L8)
- [Header.tsx:1-13](file://console/src/layouts/Header.tsx#L1-L13)
- [i18n.ts:1-6](file://console/src/i18n.ts#L1-L6)

章节来源
- [ThemeToggleButton/index.tsx:1-5](file://console/src/components/ThemeToggleButton/index.tsx#L1-L5)
- [ThemeContext.tsx:1-8](file://console/src/contexts/ThemeContext.tsx#L1-L8)
- [LanguageSwitcher.tsx:1-4](file://console/src/components/LanguageSwitcher.tsx#L1-L4)
- [MarkdownCopy/MarkdownCopy.tsx:1-8](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L1-L8)
- [Header.tsx:1-13](file://console/src/layouts/Header.tsx#L1-L13)
- [i18n.ts:1-6](file://console/src/i18n.ts#L1-L6)

## 性能考量
- 渲染优化
  - MarkdownCopy 使用 useMemo 去除 frontmatter，避免重复渲染。
  - ThemeToggleButton 与 LanguageSwitcher 为纯展示组件，渲染成本低。
- 状态管理
  - ThemeContext 使用 useState 与 useCallback，减少子组件重渲染。
- I/O 与异步
  - 复制操作在主线程执行，非阻塞；失败时提供错误提示。
- 资源加载
  - 国际化资源在应用启动时一次性初始化，后续切换语言为内存操作。

## 故障排查指南
- 主题切换无效
  - 检查 <html> 是否存在 dark-mode 类名；确认 ThemeContext 的 setThemeMode 是否被调用。
  - 章节来源
    - [ThemeContext.tsx:57-65](file://console/src/contexts/ThemeContext.tsx#L57-L65)
    - [ThemeContext.tsx:79-87](file://console/src/contexts/ThemeContext.tsx#L79-L87)
- 语言切换未生效
  - 确认 localStorage 中 language 键值；检查 i18n.changeLanguage 是否被调用。
  - 章节来源
    - [LanguageSwitcher.tsx:11-14](file://console/src/components/LanguageSwitcher.tsx#L11-L14)
    - [i18n.ts:24-24](file://console/src/i18n.ts#L24-L24)
- Markdown 复制失败
  - 非安全上下文使用 execCommand；检查浏览器权限与 HTTPS 环境。
  - 章节来源
    - [MarkdownCopy/MarkdownCopy.tsx:87-102](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L87-L102)
- 外部链接无法打开
  - 检查 pywebview.api 是否可用；否则回退 window.open。
  - 章节来源
    - [Header.tsx:33-39](file://console/src/layouts/Header.tsx#L33-L39)

## 结论
CoPaw UI 组件库以简洁、可复用为核心设计目标，通过上下文与国际化解耦主题与语言逻辑，借助工具函数与样式模块实现灵活定制。四大组件在易用性、可访问性与性能方面均具备良好表现，适合在多场景下快速集成与扩展。

## 附录

### 组件属性与事件清单
- 主题切换按钮（ThemeToggleButton）
  - 无外部属性
  - 依赖：ThemeContext（isDark、toggleTheme）、Tooltip、Button、图标
- 语言切换器（LanguageSwitcher）
  - 无外部属性
  - 依赖：i18n、Dropdown、Button、图标
- 页面头部（Header）
  - 属性：selectedKey
  - 依赖：constants、i18n、Tooltip、Button、图标
- Markdown 复制组件（MarkdownCopy）
  - 属性：content、showMarkdown、onShowMarkdownChange、copyButtonProps、markdownViewerProps、textareaProps、showControls、editable、onContentChange
  - 依赖：stripFrontmatter、XMarkdown、Input.TextArea、Button、message、Switch、i18n

章节来源
- [ThemeToggleButton/index.tsx:11-28](file://console/src/components/ThemeToggleButton/index.tsx#L11-L28)
- [LanguageSwitcher.tsx:6-58](file://console/src/components/LanguageSwitcher.tsx#L6-L58)
- [Header.tsx:24-26](file://console/src/layouts/Header.tsx#L24-L26)
- [MarkdownCopy/MarkdownCopy.tsx:10-41](file://console/src/components/MarkdownCopy/MarkdownCopy.tsx#L10-L41)

### 最佳实践
- 主题与语言
  - 使用 ThemeContext 管理主题状态，避免在组件内直接操作 DOM。
  - 语言切换后同步更新 localStorage，保证刷新后一致性。
- Markdown 复制
  - 在需要展示高质量 Markdown 时启用预览；在需要编辑时切换到文本编辑态。
  - 为复制按钮提供 loading 状态与成功/失败提示。
- 无障碍与响应式
  - 为按钮提供 aria-label 与 Tooltip；确保在小屏设备上按钮间距与可点击区域充足。
- 样式定制
  - 通过模块化样式与全局覆盖相结合，实现品牌化定制；避免内联样式的滥用。