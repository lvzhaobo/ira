# 04-mcp-ira-tools — IRA MCP Server 示例

> 把 IRA 后端已有 API 封装为 MCP 工具，供 Qoder IDE / CoPaw 等 MCP Client 调用。

## MCP 工具列表

| 工具 | 封装的 API | 场景 |
|------|-----------|------|
| `ira_stock_quote` | `GET /research/stock/quote` | 开发调试时快速查行情 |
| `ira_compliance_scan` | `POST /compliance/scan` | 文案/报告提交前合规检查 |

## 快速开始

### 1. 启动 IRA 后端（前置条件）

```powershell
cd main-project/backend
pip install -r requirements.txt
$env:IRA_DATA_DIR = "$(Resolve-Path ..\data)\"
python -m flask --app wsgi run --port 5000
```

### 2. 安装 MCP 依赖

```bash
cd samples/04-mcp-ira-tools
pip install -r requirements.txt
```

### 3. 配置 Qoder MCP

在 `.qoder/settings.json` 的 `mcpServers` 中添加：

```json
{
  "ira-tools": {
    "command": "python",
    "args": ["<绝对路径>/samples/04-mcp-ira-tools/server.py"],
    "env": {
      "IRA_API_BASE": "http://localhost:5000/api/v1"
    }
  }
}
```

### 4. 验证

在 Qoder 对话框中试试：
- "帮我查下 `600519.SH` 的行情"
- "检查这段文案是否合规：建议全仓买入，稳赚不赔"

## 扩展练习

可参考 IRA 已有 API 封装更多工具：

| API | 可封装为 | 难度 |
|-----|---------|------|
| `POST /research/stock/analysis` | 个股分析草稿生成 | 中 |
| `GET /compliance/rules` | 合规规则查询 | 低 |
| `GET /compliance/blocks/recent` | 最近违规记录 | 低 |

---

> ⚠️ 所有数据为示例/模拟，不构成投资建议。
