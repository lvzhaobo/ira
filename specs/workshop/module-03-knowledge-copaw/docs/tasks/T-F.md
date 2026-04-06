# Task T-F：CoPaw Skill — `ira_research_ask`

| 属性 | 值 |
|------|-----|
| **依赖** | T-D（BFF ask 可用） |
| **Spec** | `01-Spec` §5.1 |
| **TC** | AC-07 |

---

## 相关文件

| 文件 | 操作 | 说明 |
|------|------|------|
| CoPaw Skill 配置 | 新建 | `ira_research_ask` Skill 定义 |
| `specs/workshop/module-03-knowledge-copaw/openapi/kb-qa-contract.yaml` | 只读 | 参考 API Schema（相对仓库根） |

---

## 遵循规范

- [API 设计规范](../standards/api-design.md) §2 请求规范

---

## 完成条件

- [ ] Skill 将用户问题转为 `POST {BFF_BASE_URL}/api/v1/research/qa/ask`（路径以实际 openapi 为准）。  
- [ ] 展示 `answer` 与 `evidence_refs`；密钥来自环境变量。  
- [ ] 仅 HTTP 调 BFF，不绕过合规与 BFF 规则。

---

## Quest 输入模板

```
【Task】T-F：在 CoPaw 中配置 Skill ira_research_ask

【必须遵守】《03-任务地图与Qoder-Quest执行指南》§3；《01-Spec》§5.1。

【前置】T-D 已完成；BFF 可公网/内网访问。

【目标】Skill：读取用户 query → HTTP POST 问答接口 → 格式化输出结果。

【非目标】不实现 CoPaw 内核修改；不将密钥写入 Skill 仓库。

【验收】02-TC：AC-07；演示录屏或截图。
```
