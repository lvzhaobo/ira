# 多Agent基金投研平台 - 前端

基于 React 18 + TypeScript + Vite + Ant Design + Zustand 构建的基金投研分析平台前端应用。

## 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite 5
- **UI组件库**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **HTTP客户端**: Axios
- **图表**: @ant-design/plots
- **工具库**: ahooks, dayjs

## 项目结构

```
frontend/
├── public/                    # 静态资源
├── src/
│   ├── components/           # 组件
│   │   └── Layout/          # 布局组件
│   ├── pages/               # 页面
│   │   ├── Home/            # 首页 - 基金搜索
│   │   ├── FundDetail/      # 基金详情页
│   │   ├── Analysis/        # 分析页面 - Agent对话
│   │   └── History/         # 历史记录页
│   ├── services/            # API服务层
│   │   ├── api.ts          # Axios实例配置
│   │   ├── fundService.ts  # 基金相关API
│   │   ├── analysisService.ts  # 分析相关API
│   │   └── reportService.ts    # 报告相关API
│   ├── stores/              # Zustand状态管理
│   │   ├── fundStore.ts    # 基金状态
│   │   └── analysisStore.ts # 分析状态
│   ├── hooks/               # 自定义Hooks
│   │   └── usePolling.ts   # 轮询Hook
│   ├── utils/               # 工具函数
│   │   ├── format.ts       # 格式化工具
│   │   └── constants.ts    # 常量配置
│   ├── types/               # TypeScript类型定义
│   │   ├── fund.ts         # 基金相关类型
│   │   ├── analysis.ts     # 分析相关类型
│   │   └── api.ts          # API相关类型
│   ├── styles/              # 样式文件
│   │   └── global.css      # 全局样式
│   ├── App.tsx              # 应用入口
│   └── main.tsx             # 渲染入口
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 环境变量

在项目根目录创建 `.env` 文件：

```env
# 后端 API 地址
VITE_API_BASE_URL=http://localhost:5000/api

# 应用配置
VITE_APP_NAME=多Agent基金投研平台
VITE_APP_VERSION=1.0.0
```

## 功能模块

### 1. 基金搜索 (Home)
- 支持基金代码/名称搜索
- 显示搜索结果列表
- 基金类型标签展示

### 2. 基金详情 (FundDetail)
- 基金基本信息展示
- 最新净值、日增长率
- 基金经理、公司规模
- 快捷操作入口

### 3. 智能分析 (Analysis)
- 多Agent协同分析
- 实时进度展示
- Agent对话记录时间线
- 分析进度条

### 4. 历史记录 (History)
- 分析任务列表
- 状态筛选
- 查看详情/删除记录

## API服务

所有API服务位于 `src/services/` 目录：

- **api.ts**: Axios实例配置，请求/响应拦截器
- **fundService.ts**: 基金搜索、详情、净值、持仓等API
- **analysisService.ts**: 分析任务创建、查询、取消等API
- **reportService.ts**: 报告相关API

## 状态管理

使用Zustand进行状态管理，store位于 `src/stores/` 目录：

- **fundStore.ts**: 基金搜索状态、当前基金信息
- **analysisStore.ts**: 分析任务状态、Agent消息、历史记录

## 开发规范

### 命名规范
- 组件文件: PascalCase (e.g., `FundDetail.tsx`)
- 变量/函数: camelCase (e.g., `handleClick`)
- 常量: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- 类型接口: PascalCase (e.g., `FundInfo`)

### 组件开发
- 使用函数组件 + TypeScript
- 使用React.FC类型标注
- Props接口命名为 `ComponentNameProps`

### 类型安全
- 禁止使用any类型（除非必要）
- 所有API响应都要有类型定义
- 使用TypeScript严格模式

## 代理配置

开发环境下，Vite配置了API代理：

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

所有 `/api` 开头的请求会代理到后端服务器。

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## License

MIT
