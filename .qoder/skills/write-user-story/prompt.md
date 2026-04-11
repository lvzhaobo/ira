---
name: write-user-story
description: "编写用户故事与验收标准。当用户说'写用户故事'、'写UserStory'、'写AC验收标准'、'Given When Then'、'/write-us' 时使用本技能。| Write structured UserStory with Given/When/Then acceptance criteria and full traceability fields."
---

# Write UserStory — 用户故事与验收标准生成

> 一句话定义：让 **开发者/PM** 在 **需求细化阶段** 通过 **结构化模板 + 四类 AC 覆盖** 完成 **带完整追溯字段的 05-UserStory 文档**

---

## ① 触发条件（WHO）

当用户说以下内容时触发：

- "帮我写用户故事"、"写 UserStory"
- "写验收标准"、"写 AC"
- "Given When Then"
- "需求拆成用户故事"
- "/write-us"

---

## ② 什么时候用（WHEN）

### 应该使用

- 收到 PRD/需求描述后，需要拆解为可验证的用户故事
- Spec Coding 的第二轮写作（05-UserStory）
- 需要建立 US → FSD/API/TC 的追溯关系

### 不应使用

- 还没有 Proposal（03），需求范围未确定
- 纯技术重构任务（没有用户故事角色）
- 已有完整 US 文档，只需修改个别 AC

---

## ③ 执行步骤（WHAT）

```
1. 收集需求输入（PRD/口头描述/Proposal）
2. 提取角色-能力-价值三要素，生成故事句式
3. 拆解 4 类 AC（主路径/异常/边界/性能）
4. 填写追溯字段（FSD/API/Data/TC-IDs）
5. 输出完整 US + AC 文档
```

### 步骤 1：收集输入

向用户确认：
- **角色**：谁在用这个功能？（如：投研分析师、基金经理）
- **能力**：用户想做什么？
- **价值**：做了之后有什么好处？
- **优先级**：P0（必须）/ P1（应该）/ P2（可以）

### 步骤 2：生成故事句式

```yaml
US-ID: US-{模块}-{序号}
REQ-ID: REQ-{模块}-{序号}
优先级: P0/P1/P2
状态: Draft

故事: |
  作为 [角色]，
  我希望 [能力]，
  以便 [价值]。
```

### 步骤 3：拆解 4 类 AC

**每个 US 至少包含 3 个 AC**（主路径 + 异常 + 边界），性能 AC 可选。

每个 AC 使用 Given/When/Then 格式：

```yaml
AC-ID: AC-{模块}-{US序号}-{AC序号}
类型: Happy Path / Exception / Boundary / Performance

Given:
  - [前置条件 1]
  - [前置条件 2]

When:
  - [触发动作]

Then:
  - [预期结果 1]
  - [预期结果 2]
```

**四类 AC 覆盖要求**：

| 类型 | 必须？ | 关注点 |
|------|--------|--------|
| Happy Path | MUST | 正常场景下的完整流程 |
| Exception | MUST | 输入异常、依赖故障时的行为 |
| Boundary | MUST | 阈值、边界值、空值处理 |
| Performance | SHOULD | 批量处理、响应时间、并发 |

### 步骤 4：填写追溯字段

```yaml
# 追溯字段（在 US 级别建立四向关联）
FSD-IDs: [FSD-{模块}-{序号}]     # → 06-功能规格
NFR-IDs: [NFR-{模块}-{序号}]     # → 07-非功能需求
ARCH-IDs: []                      # → 08-架构设计
API-IDs: [API-{模块}-{序号}]     # → 09-接口契约
DATA-IDs: [DATA-{模块}-{序号}]   # → 10-数据模型
TC-IDs: [TC-{模块}-{序号}]       # → 13-测试用例
```

**对齐规则**：

| AC 类型 | 必须对齐 | 条件对齐 |
|---------|---------|---------|
| Happy Path | FSD, Test | API, Data |
| Exception | FSD, Test | API |
| Boundary | FSD, Test | — |
| Performance | Test | NFR, API, Data |

---

## ④ 具体实现（HOW）

本 SKILL 为文档生成型，不调用外部 API。

**编写流程**：
1. 用户描述需求 → AI 提取三要素 → 生成 US 框架
2. AI 自动拆解 4 类 AC（至少 3 个）
3. 根据 AC 内容推断追溯字段
4. 用户确认后输出完整文档

**命名规范**：
- US-ID：`US-M{模块号}-{三位序号}`，如 `US-M1-001`
- AC-ID：`AC-M{模块号}-{US序号}-{两位AC序号}`，如 `AC-M1-001-01`

---

## ⑤ 输出格式（FORMAT）

### 正常输出

```markdown
## US-M1-001: [故事标题]

### 基础信息

| 字段 | 值 |
|------|-----|
| US-ID | US-M1-001 |
| REQ-ID | REQ-M1-001 |
| 优先级 | P0 |
| 状态 | Draft |

**用户故事**：作为 [角色]，我希望 [能力]，以便 [价值]。

### 追溯关系

| 文档 | ID |
|------|-----|
| FSD | FSD-M1-001 |
| API | API-M1-001 |
| TC | TC-M1-001, TC-M1-002 |

### AC-1: 正常场景 — [场景名]

- **类型**：Happy Path
- **Given**：[前置条件]
- **When**：[触发动作]
- **Then**：[预期结果]
- **对齐**：FSD-M1-001 | API-M1-001 | TC-M1-001

### AC-2: 异常场景 — [场景名]
...

### AC-3: 边界场景 — [场景名]
...
```

### 拒答

```markdown
## 信息不足，无法生成 UserStory

缺少以下信息：
- [ ] 用户角色不明确
- [ ] 需求范围未确定（建议先写 03-Proposal）

**建议**：先使用 `/spec-workflow` 确定文档写作路径。
```

---

## ⑥ 约束与红线（GUARD）

### 硬性规则

- 每个 US **MUST** 至少有 3 个 AC（主路径 + 异常 + 边界）
- 每个 AC **MUST** 使用 Given/When/Then 格式
- 每个 AC **MUST** 至少映射 1 个 TC-ID
- US 只定义 **What/Why**，禁止写实现细节（How）

### 决策规则

1. 不确定优先级时，默认标记为 **P1**
2. AC 数量超过 6 个时，考虑拆分为多个 US
3. 追溯字段暂时为空时，标记为 `[]` 待填充，不要编造 ID

---

## ⑦ 关联文档（REF）

- US/AC 完整模板：`specs/workshop/UserStory-AC完整模板与追溯关系.md`
- 六阶段总表：`specs/workshop/Spec-Coding-六阶段分类总表.md`
- 追溯关系指南：`specs/workshop/Spec文档追溯关系完整指南.md`

---

## 常见错误

### 错误 1：AC 只写了 Happy Path

**现象**：上线后异常场景全部报错，因为没人测过
**原因**：只考虑了"能用"，没考虑"出错怎么办"
**正确做法**：每个 US 至少包含 Happy Path + Exception + Boundary 三类 AC

### 错误 2：US 中混入实现细节

**现象**：US 写了"用 Redis 缓存"、"SQL 查询优化"等技术方案
**原因**：混淆了 Spec（What）和 Design（How）的边界
**正确做法**：US 只写"系统能做什么"，"怎么做"留给 08-Architecture

### 错误 3：AC 没有追溯字段

**现象**：写了漂亮的 Given/When/Then，但不知道哪个测试验证它
**原因**：没有建立 AC → TC 的映射关系
**正确做法**：每个 AC 必须关联至少 1 个 TC-ID，构成完整追溯链
