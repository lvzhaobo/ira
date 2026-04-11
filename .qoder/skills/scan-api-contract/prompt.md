---
name: scan-api-contract
description: "API契约扫描。当用户说'扫描API契约'、'检查接口一致性'、'Spec和代码对不对得上'、'api contract scan'、'/scan-api-contract' 时使用本技能。| Scan for API contract drift between Spec documents (OpenAPI/09-API) and actual route implementations."
---

# Scan API Contract — API 契约一致性扫描

> 一句话定义：让 **开发者** 在 **API 变更后** 通过 **Spec 文档与实现代码对比** 完成 **契约漂移检测与一致性报告**

---

## ① 触发条件（WHO）

当用户说以下内容时触发：

- "扫描 API 契约"、"检查接口一致性"
- "Spec 和代码对不对得上"
- "api contract scan"、"契约漂移检查"
- "/scan-api-contract"

---

## ② 什么时候用（WHEN）

### 应该使用

- 修改了 API 路由或请求/响应结构后
- PR 包含 openapi_spec 或 blueprint 变更
- Spec Coding 的 Trace 阶段验证一致性
- 上线前最终检查

### 不应使用

- Spec 文档尚未冻结（还在草稿阶段）
- 纯内部工具 API（无外部消费者）
- GraphQL / gRPC 项目（需不同扫描逻辑）

---

## ③ 执行步骤（WHAT）

```
1. 读取 Spec 文档（09-API 接口契约 或 openapi_spec）
2. 扫描实现代码（路由定义、参数、响应结构）
3. 逐项对比：路径、方法、参数名/类型、响应字段、状态码
4. 检测漂移：Spec有但代码没实现 / 代码有但Spec没定义
5. 生成一致性报告
```

### 步骤 1：读取 Spec 契约

优先级：
1. `openapi_spec.py` / `openapi.yaml` / `openapi.json`
2. `09-API-接口规格.md`（Spec Coding 体系）
3. 用户指定的契约文件

提取每个 endpoint 的：
- HTTP 方法 + 路径
- 请求参数（名称、类型、是否必填）
- 响应字段（名称、类型）
- 状态码（200/400/404/500）

### 步骤 2：扫描实现代码

**Flask 项目**：
- 搜索 `@blueprint.route` / `@app.route` 装饰器
- 解析 `request.json` / `request.args` 获取实际参数
- 解析 `jsonify()` / `return {}` 获取实际响应字段

**Express 项目**：
- 搜索 `router.get/post/put/delete`
- 解析 `req.body` / `req.query` / `req.params`
- 解析 `res.json()` / `res.send()`

### 步骤 3：对比规则

| 规则 ID | 检查项 | 严重度 |
|---------|--------|--------|
| PATH_MISMATCH | Spec 路径和代码路由不一致 | HIGH |
| METHOD_MISMATCH | Spec 定义 POST 但代码实现为 GET | HIGH |
| PARAM_MISSING | Spec 定义了参数但代码未接收 | HIGH |
| PARAM_TYPE_MISMATCH | Spec 定义 number 但代码接收 string | HIGH |
| RESPONSE_FIELD_MISSING | Spec 定义了响应字段但代码未返回 | MEDIUM |
| UNDOCUMENTED_ENDPOINT | 代码有路由但 Spec 未定义 | MEDIUM |
| UNIMPLEMENTED_ENDPOINT | Spec 定义了但代码未实现 | HIGH |
| STATUS_CODE_MISSING | Spec 定义了错误状态码但代码未处理 | MEDIUM |

### 步骤 4：漂移分类

```
Spec-Only（Spec有、代码没有）→ 未实现   → 严重度 HIGH
Code-Only（代码有、Spec没有）→ 未文档化  → 严重度 MEDIUM
Both-Mismatch（都有但不一致）→ 漂移      → 严重度 HIGH
```

---

## ④ 具体实现（HOW）

本 SKILL 为静态分析型，不调用外部 API。

**分析流程**：
1. 解析 OpenAPI spec → 提取 endpoint 列表
2. 解析 Flask/Express 路由 → 提取实际 endpoint 列表
3. 双向 diff 生成 findings

**Spec 视为 source of truth**（默认），用户可通过参数切换为"以代码为准"。

---

## ⑤ 输出格式（FORMAT）

### 正常输出

```markdown
## API 契约一致性报告

**Spec 来源**：`main-project/backend/app/openapi_spec.py`
**代码来源**：`main-project/backend/app/blueprints/`

### 一致性概览

| 指标 | 值 |
|------|-----|
| Spec 定义 endpoints | 14 |
| 代码实现 endpoints | 16 |
| 一致 | 11 |
| 漂移 | 3 |
| 未实现（Spec-Only） | 0 |
| 未文档化（Code-Only） | 2 |
| **一致率** | **78.6%** |

### 漂移详情

#### [HIGH] PARAM_TYPE_MISMATCH

- **Endpoint**：`POST /api/v1/risk-assessment`
- **Spec 定义**：参数 `volatility` 类型为 `number`
- **代码实际**：接收为 `string`，未做类型转换
- **建议**：添加参数类型校验或更新 Spec 定义

#### [MEDIUM] UNDOCUMENTED_ENDPOINT

- **Endpoint**：`GET /api/v1/health`
- **问题**：代码已实现但 Spec 中未定义
- **建议**：补充到 OpenAPI spec 中
```

### 全部一致

```markdown
## API 契约一致性报告

**结果**：所有 endpoints 一致 ✅
**一致率**：100% (14/14)
```

---

## ⑥ 约束与红线（GUARD）

### 硬性规则

- **不修改 Spec 或代码**，仅报告漂移
- 默认以 **Spec 为 source of truth**
- 仅支持 RESTful API，GraphQL/gRPC 需不同扫描器

### 决策规则

1. 一致率 ≥90%：PASS；70~90%：WARNING；<70%：FAIL
2. 任何 UNIMPLEMENTED_ENDPOINT（Spec有代码没有）视为阻塞性问题
3. UNDOCUMENTED_ENDPOINT 不阻塞合并，但应在下一迭代补文档

---

## ⑦ 关联文档（REF）

- OpenAPI 规范：`main-project/backend/app/openapi_spec.py`
- API 蓝图：`main-project/backend/app/blueprints/`（14 个模块）
- 09-API 模板：Spec Coding 体系中的 `09-API-接口规格`

---

## 常见错误

### 错误 1：只检查路径不检查参数

**现象**：路径一致但参数类型不匹配，运行时报错
**原因**：对比粒度太粗，只看 URL 不看 request body
**正确做法**：逐字段对比参数名、类型、是否必填

### 错误 2：忽略错误响应的契约

**现象**：正常响应一致，但 400/500 响应格式和 Spec 不同
**原因**：只测了 happy path 的响应
**正确做法**：所有状态码的响应结构都要对比

### 错误 3：Code-Only endpoint 不当回事

**现象**：代码新增了 API 但 Spec 没更新，前端集成时才发现不一致
**原因**：认为"代码能跑就行"，不更新文档
**正确做法**：每次新增路由 MUST 同步更新 Spec 文档
