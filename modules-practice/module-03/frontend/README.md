# 最小前端联调演示

## 功能

本前端页面实现了 T-E 任务要求的最小联调功能：

1. **文档列表展示** - 调用 `GET /api/v1/kb/documents`
2. **文档上传** - 调用 `POST /api/v1/research/qa/upload`
3. **问答** - 调用 `POST /api/v1/research/qa/ask`

## 使用方法

### 1. 配置 BFF 基地址

打开页面后，在顶部配置栏输入 BFF 服务地址（例如：`http://localhost:8000`），点击"保存"。

配置会存储在浏览器 `localStorage` 中，键名为 `BFF_BASE_URL`。

### 2. 打开页面

直接用浏览器打开 `index.html` 即可，无需构建或启动开发服务器。

也可以使用任意 HTTP 服务器：

```bash
# 使用 Python
python -m http.server 3000

# 使用 Node.js (需安装 serve)
npx serve .

# 使用 PHP
php -S localhost:3000
```

然后访问 `http://localhost:3000`。

### 3. 使用流程

1. 上传文档（可选）
2. 刷新文档列表
3. 在问答区域输入问题并提问
4. 查看回答、证据引用和完整 JSON 响应

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `BFF_BASE_URL` | BFF 服务基地址 | `http://localhost:8000` |

> **注意**：本页面使用 localStorage 存储配置，不依赖服务端环境变量。

## API 契约

所有 API 调用严格遵循 `01-Spec` §3 定义的契约：

- 路径前缀：`/api/v1`
- JSON 字段名与 Spec 一致
- 错误处理：统一错误体格式

## 验收对照

本实现对照 `02-TC` 的以下 AC 项：

- AC-01: 文档列表展示
- AC-03: 上传功能
- AC-04: 上传后列表可见
- AC-05: 问答结构展示
- AC-06: 无证据拒答展示
