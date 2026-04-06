# M1 · 投研助手基础版（练习代码）

Workshop **Module 01** 的 **可运行小全栈**（简化版投研对话），与主项目 **`ira/`** 可对照「同一命题、不同体量」。

## 规格真源

契约与长篇规格在仓库 **`specs/workshop/module-01-investment-assistant/docs/`**，入口：

- **[规格包 README](../../specs/workshop/module-01-investment-assistant/README.md)**

## 本地运行（摘要）

```powershell
# 后端（示例）
cd backend
pip install -r requirements.txt
# 按目录内入口启动 Flask（以实际 app 为准）

# 前端（示例）
cd frontend
npm install
npm run dev
```

具体端口与脚本以各子目录代码为准。

## 与主项目 `ira/`「研报问答」的关系

| 维度 | `ira/` 研报问答 | 本目录 M1 |
|------|-----------------|-----------|
| 功能完整度 | **更全**：知识库引用块、`X-Spec-Version`、风险标签、上传、trace 写血缘等 | **更简**：单会话问答 + JSON 存储，便于读懂最小链路 |
| 「真实」程度 | 同等依赖百炼密钥；契约与 OpenAPI 对齐，偏机构演示 | 同一百炼调用方式（OpenAI 兼容）；可选 **CoPaw HTTP 桥接**（与 ira 相同环境变量） |
| 未配置密钥 | 占位回复 + 明确「离线演示」文案 | **已对齐**：相同风格的降级说明 |

**环境变量（与 ira 对齐）**

- `DASHSCOPE_API_KEY`：百炼（推荐，与 ira 一致）
- `BAILIAN_API_KEY`：历史别名，二选一即可
- `IRA_BAILIAN_MODEL` / `IRA_BAILIAN_BASE_URL`：可选
- `IRA_COPAW_QA_ASK_URL` 或 `IRA_COPAW_BASE_URL`：可选 CoPaw 桥接（配置后优先走 CoPaw，再百炼，再演示）

前端顶栏会显示 **百炼在线 / 离线演示 / CoPaw 桥接** 状态；接口 `GET /api/v1/agent/capabilities` 可供联调。

## 说明

数据均为 **演示/模拟**，不构成投资建议。
