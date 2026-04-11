---
name: scan-observability
description: "可观测性扫描。当用户说'扫描可观测性'、'检查日志覆盖'、'trace_id检查'、'observability scan'、'/scan-observability' 时使用本技能。| Scan code for observability gaps: missing logging, metrics, and distributed tracing coverage."
---

# Scan Observability — 可观测性扫描

> 一句话定义：让 **开发者/SRE** 在 **代码审查或故障排查前** 通过 **静态分析** 完成 **日志/指标/链路三支柱覆盖度检查**

---

## ① 触发条件（WHO）

当用户说以下内容时触发：

- "扫描可观测性"、"检查日志覆盖"
- "trace_id 检查"、"链路追踪检查"
- "observability scan"
- "/scan-observability"

---

## ② 什么时候用（WHEN）

### 应该使用

- 新增/修改 API 路由后，检查三支柱覆盖
- 生产事故后排查可观测性缺失
- 架构评审时评估运维就绪度

### 不应使用

- 纯前端静态页面（无后端交互）
- 原型/Demo 阶段（过早优化）
- 已有完善 APM 平台自动注入的项目

---

## ③ 执行步骤（WHAT）

```
1. 扫描目标：API 路由、服务入口、异常处理块
2. 检查日志（Logging）：关键路径是否有日志？格式是否结构化？
3. 检查指标（Metrics）：是否暴露请求量/延迟/错误率？
4. 检查链路（Tracing）：是否传播 trace_id/span_id？
5. 生成三支柱覆盖度报告
```

### 步骤 1：识别扫描目标

自动识别以下代码结构：
- Flask：`@app.route` / `@blueprint.route` 装饰器
- Express：`router.get/post/put/delete`
- 异常处理：`try/except` / `try/catch` 块
- 中间件 / 拦截器

### 步骤 2：日志（Logging）检查规则

| 规则 ID | 检查项 | 严重度 |
|---------|--------|--------|
| LOG_MISSING | API 处理函数无任何 log 调用 | HIGH |
| LOG_SWALLOW | catch 块捕获异常但无 log.error | HIGH |
| LOG_UNSTRUCTURED | 使用 print() 而非 logging/logger | MEDIUM |
| LOG_NO_CONTEXT | 日志缺少请求上下文（user_id/request_id） | LOW |

### 步骤 3：指标（Metrics）检查规则

| 规则 ID | 检查项 | 严重度 |
|---------|--------|--------|
| METRIC_NO_COUNTER | 无请求计数器 | MEDIUM |
| METRIC_NO_LATENCY | 无延迟直方图/摘要 | MEDIUM |
| METRIC_NO_ERROR | 无错误率指标 | MEDIUM |

### 步骤 4：链路（Tracing）检查规则

| 规则 ID | 检查项 | 严重度 |
|---------|--------|--------|
| TRACE_MISSING | API 响应体缺少 trace_id 字段 | HIGH |
| TRACE_NO_PROPAGATION | 跨服务调用未传递 trace_id | HIGH |
| TRACE_ERROR_NO_ID | 错误响应缺少 trace_id（故障时无法关联上下游） | HIGH |
| TRACE_NO_SPAN | 关键操作无 span 记录 | MEDIUM |

---

## ④ 具体实现（HOW）

本 SKILL 为纯静态分析，不调用外部 API。

**扫描方式**：
- 搜索 `logging.` / `logger.` / `log.` 调用频率
- 检查 error handler 是否有日志
- 搜索 `trace_id` / `span_id` / `request_id` 在响应体中的存在
- 统计 API endpoint 总数作为分母计算覆盖率

**适用语言**：Python (Flask/FastAPI)、JavaScript/TypeScript (Express/Koa)

---

## ⑤ 输出格式（FORMAT）

### 正常输出

```markdown
## 可观测性扫描报告

**扫描范围**：[文件/目录列表]

### 三支柱覆盖度

| 支柱 | 覆盖率 | 状态 |
|------|--------|------|
| Logging | 72% (13/18 endpoints) | ⚠️ |
| Metrics | 45% (8/18 endpoints) | ❌ |
| Tracing | 30% (5/18 endpoints) | ❌ |

### 关键发现

#### [HIGH] TRACE_ERROR_NO_ID — 错误响应缺 trace_id

- **文件**：`app/blueprints/research.py`
- **行号**：78
- **问题**：错误响应返回 `{"error": "..."}` 但无 trace_id
- **影响**：故障时无法关联上下游请求
- **建议**：在 error response 中添加 `"trace_id": request.trace_id`

#### [HIGH] LOG_SWALLOW — 异常被吞

- **文件**：`app/services/risk_engine.py`
- **行号**：45
- **问题**：`except Exception: pass` 吞掉异常无日志
- **建议**：添加 `logger.error(f"Risk calc failed: {e}", exc_info=True)`
```

### 无发现

```markdown
## 可观测性扫描报告

**结果**：三支柱覆盖率均达标 ✅
**Logging**: 95% | **Metrics**: 88% | **Tracing**: 90%
```

---

## ⑥ 约束与红线（GUARD）

### 硬性规则

- **不自动注入日志/指标代码**，仅报告缺失
- 覆盖率基于 API endpoint 数量计算
- 区分开发环境（可放宽）和生产环境（严格）

### 决策规则

1. 覆盖率 ≥80%：PASS；60~80%：WARNING；<60%：FAIL
2. 任何 HIGH 级别 finding 都应在合并前修复

---

## ⑦ 关联文档（REF）

- IRA 后端蓝图：`main-project/backend/app/blueprints/`（14 个模块）
- OpenAPI 规范：`main-project/backend/app/openapi_spec.py`

---

## 常见错误

### 错误 1：只检查 happy path 的日志

**现象**：正常请求有日志，异常请求一片空白
**原因**：只关注了主流程，忽略了 error handler
**正确做法**：重点检查 catch/except 块是否有 log.error

### 错误 2：认为 print() 等于日志

**现象**：用 print() 输出调试信息，生产环境看不到
**原因**：print 不走日志系统，无法集中收集和查询
**正确做法**：使用 logging 模块，配置结构化日志格式

### 错误 3：错误响应不返回 trace_id

**现象**：用户报错后运维无法关联请求链路
**原因**：只在成功响应中返回 trace_id，错误响应遗漏
**正确做法**：**所有响应**（包括 4xx/5xx）都必须包含 trace_id
