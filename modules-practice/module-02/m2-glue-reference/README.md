# M2 Glue Coding — Mock 参考实现（Reference）

本目录 **不是** 生产代码，而是工作坊用的 **形状对齐** 骨架，便于 CoPaw / 人工编码时对照：

- 正式契约（见 `specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/`）：**`09-API接口规格.md`**、**`10-数据模型与存储规格.md`**、**`06-功能规格说明.md`**。
- 此处仅包含：**Provider 接口**、**Mock 源**、**同步任务状态机**（与 `09` 中 `SyncJob.status` 一致）。

## 用法

### Python（契约参考 + 单测）

```bash
cd modules-practice/module-02/m2-glue-reference
pip install -r requirements.txt
python -m pytest -q
```

### React 运维台（参考 UI）

深蓝主色 + 红色强调，**不含任何机构客户名称**；页面与 M2 `06` 运维台叙事一致，默认不请求后端。

```bash
cd modules-practice/module-02/m2-glue-reference/frontend
npm install
npm run dev
```

浏览器默认 <http://127.0.0.1:5180>。生产静态资源：`npm run build`，产物在 `frontend/dist/`。

实现真实 BFF 时：删除或替换 `providers/mock_provider.py`，保留「适配器 + 归一化 + Job FSM + 写库」分层思路即可。
