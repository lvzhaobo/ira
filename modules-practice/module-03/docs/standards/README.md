# 开发规范索引

> 本文档列出本项目所有开发规范,供各 Task 引用。

---

## 规范列表

| 规范文档 | 适用范围 | 主要内容 |
|---------|---------|---------|
| [API 设计规范](api-design.md) | 所有 API 设计 | RESTful 原则、请求/响应格式、错误处理、安全规范 |
| [后端开发规范](backend-coding.md) | Python/FastAPI 后端代码 | 项目结构、代码风格、FastAPI 最佳实践、测试规范 |
| [前端开发规范](frontend-coding.md) | HTML/CSS/JavaScript 前端代码 | HTML 语义化、CSS 命名、JS 规范、API 调用、UI 组件 |

---

## 如何在 Task 中引用

在 Task 文档的"遵循规范"章节中引用:

```markdown
## 遵循规范

- [API 设计规范](../standards/api-design.md) §3.4 业务拒答处理
- [后端开发规范](../standards/backend-coding.md) §3 FastAPI 最佳实践
```

---

## 规范更新流程

1. 修改规范文档
2. 更新本文档的版本号
3. 通知相关 Task 负责人
4. 在 Code Review 中检查是否符合新规范

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-04 | 初始版本,包含 API/后端/前端三类规范 |
