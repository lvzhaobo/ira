# ira.vin 模拟数据平台（外部行情/资讯 + M3/M5 能力 Mock）

部署到 **ira.vin**（或任意 HTTPS 域名）后，由 **M2 适配器**、**M3 向量/LLM 旁路**、**M5 模型旁路** 通过环境变量指向本服务。

## 与「Glue 样例门禁 CI」的关系

- **Glue 样例门禁 CI** = GitHub Actions 工作流 **`.github/workflows/ci.yml`** 里跑的自动化检查：当前包含  
  - `samples/m2-glue-reference` 的 **`pytest`**（本地状态机 + Mock Provider）；  
  - `samples/ira-vin-mocks` 的 **`pytest`**（本服务冒烟）。  
- 目的：合并 PR 前确认 **参考实现仍可运行**，不是生产门禁的全部；主应用上线后应再增加 Ruff、ESLint、全量集成测等。

## 快速本地启动

```bash
cd samples/ira-vin-mocks
pip install -r requirements.txt
python -m flask --app app:create_app run --port 8099
```

健康检查：<http://127.0.0.1:8099/health>

### 仿门户页面（浏览器打开，与 Mock API 同源 `fetch`）

部署到 **ira.vin** 根域时，可直接分享给学员：

| 页面 | URL 路径 | 对接的 JSON |
|------|-----------|-------------|
| **门户总览** | `/` | —（入口卡片） |
| **模拟门户财经资讯** | `/mock/page/sina/finance` | `GET /mock/v1/sina/finance/news/list.json` |
| **模拟快讯流** | `/mock/page/eastmoney/flash` | `GET /mock/v1/eastmoney/api/news/flash` |
| **模拟终端行情** | `/mock/page/wind/terminal` | `GET /mock/v1/wind/market/snapshot?windCode=…` |

页面为 **MOCK 财经 / MOCK 快讯 / MOCK TERMINAL** 等中性命名，**不**使用商业站点商标；样式仅作教学「看起来像」一类门户/终端。

若服务挂在子路径（如 `/mock-service/`），需在反向代理配置 `SCRIPT_NAME` 或改写模板内 `fetch` 前缀（见 `SPEC.md` 附录）。

## 环境变量（部署）

| 变量 | 说明 |
|------|------|
| `IRA_VIN_MOCK_BASE` | 客户端配置的 Base，如 `https://api.ira.vin`（**不含**末尾路径）；M2 适配器拼接 `/mock/v1/...`。 |
| `FLASK_DEBUG` | 生产请 `0`。 |

## 路由一览

见 **`SPEC.md`**（含新浪/东财/Wind **风格**字段说明与归一化建议）。

## 合规声明

本仓库响应体为 **虚构结构与演示数据**，不抓取、不转发真实商业站点；仅 **形似** 常见 JSON 形态，供工作坊对接与契约测试。生产使用须取得数据源正式授权。
