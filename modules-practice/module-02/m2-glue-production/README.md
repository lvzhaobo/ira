# M2 Glue Coding · 生产代码

> **开发范式**：先抄后写（Spec Coding）
> 
> 本目录代码通过"抄+生成"方式创建，所有代码均带有【来源】注释，标明参考来源。

---

## 📂 目录结构

```
m2-glue-production/
├── providers/                  # 数据源适配器层
│   ├── __init__.py            # 包初始化
│   ├── base.py                # Provider 接口契约（抄自 reference）
│   └── mock_provider.py       # Mock Provider 实现（改造自 reference + ira-vin-mocks）
├── job_fsm.py                  # 任务状态机（抄自 reference）
├── api_routes.py               # Flask API 路由（按照 09-API规格 新生成）
├── app.py                      # Flask 应用工厂（参考 ira-vin-mocks）
├── test_m2_glue.py            # 测试用例（抄+扩展示例）
├── requirements.txt           # Python 依赖
├── .env.example               # 环境变量示例
└── migrations/
    └── 001_initial_schema.sql # 数据库迁移脚本（按照 10-数据模型 生成）
```

---

## 🚀 快速启动

### 前置条件

1. 启动 Mock 数据源（ira.vin）
   ```bash
   cd ../ira-vin-mocks
   pip install -r requirements.txt
   python -m flask --app app:create_app run --port 8099
   ```

2. 安装依赖
   ```bash
   cd m2-glue-production
   pip install -r requirements.txt
   ```

### 运行测试

```bash
# 运行所有测试
python -m pytest test_m2_glue.py -v

# 运行特定测试
python -m pytest test_m2_glue.py::test_fsm_happy_path -v
python -m pytest test_m2_glue.py::test_health_endpoint -v
```

### 启动 API 服务

```bash
# 设置环境变量
export IRA_VIN_MOCK_BASE=http://127.0.0.1:8099
export SINA_FEED_URL=${IRA_VIN_MOCK_BASE}/mock/v1/sina/finance/news/list.json
export EASTMONEY_FLASH_URL=${IRA_VIN_MOCK_BASE}/mock/v1/eastmoney/api/news/flash

# 启动 Flask
python -m flask --app app:create_app run --port 5000
```

### 测试 API

```bash
# 健康检查
curl http://127.0.0.1:5000/api/v1/ingest/health

# 数据源列表
curl http://127.0.0.1:5000/api/v1/ingest/sources

# 触发同步任务
curl -X POST http://127.0.0.1:5000/api/v1/ingest/jobs \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "source-sina-mock", "mode": "incremental"}'

# 任务列表
curl http://127.0.0.1:5000/api/v1/ingest/jobs
```

---

## 📋 代码来源说明

所有代码文件顶部均包含【来源】注释，说明：

- **抄自**：直接复制并保留原始逻辑的代码
- **改造自**：在原有基础上扩展/修改的代码
- **新增**：根据规格文档新生成的代码
- **参考**：借鉴结构/模式的代码
- **对接**：与规格文档/外部服务的对齐点

### 来源映射表

| 文件 | 主要来源 | 扩展内容 |
|------|---------|---------|
| `providers/base.py` | m2-glue-reference/providers/base.py | 添加 external_ref 字段 |
| `providers/mock_provider.py` | m2-glue-reference/providers/mock_provider.py | HTTP 请求 + ira.vin 对接 |
| `job_fsm.py` | m2-glue-reference/job_fsm.py | 完整抄写 + 注释 |
| `api_routes.py` | 09-API接口规格.md | 新生成（整合 Provider + FSM） |
| `app.py` | ira-vin-mocks/app.py | create_app 模式 |
| `test_m2_glue.py` | m2-glue-reference/test_reference.py | 扩展 API 集成测试 |
| `migrations/001_*.sql` | 10-数据模型与存储规格.md | 新生成 |

---

## 🎯 里程碑对照

| 阶段 | 状态 | 说明 |
|------|------|------|
| **S0** | ✅ 完成 | DB 迁移 + Mock Provider + 种子数据源 |
| **S1** | 🔄 待开发 | PostgreSQL 持久化 + 异步 Worker |
| **S2** | 📋 计划中 | GET jobs 详情 + 写 ingest_feed_items |
| **S3** | 📋 计划中 | 错误码 + 指标 + partial 状态 |
| **S4** | 📋 计划中 | 压测 + M1 联通验收 |

---

## 📖 规格文档索引

- **P0 契约**：
  - [09-API接口规格.md](../../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/09-API接口规格.md)
  - [10-数据模型与存储规格.md](../../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/10-数据模型与存储规格.md)
  - [06-功能规格说明.md](../../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/06-功能规格说明.md)

- **验收文档**：
  - [05-用户故事与验收标准.md](../../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/05-用户故事与验收标准.md)
  - [13-测试策略与质量门禁.md](../../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/13-测试策略与质量门禁.md)
  - [12-实施计划与里程碑.md](../../../specs/workshop/module-02-glue-multisource/docs/02-模块-GlueCoding-多源数据/12-实施计划与里程碑.md)

---

## ⚠️ 注意事项

1. **S0 阶段使用内存存储**，重启后数据丢失
2. **密钥管理**：生产环境必须通过 KMS/环境变量注入，禁止明文
3. **异步任务**：S0 为同步模拟，S1 应改为 Celery/线程池
4. **数据库**：S0 提供 SQL 迁移脚本，S1 应接入 PostgreSQL

---

## 🔗 相关资源

- **参考代码**：[../m2-glue-reference/](../m2-glue-reference/)
- **Mock 数据源**：[../ira-vin-mocks/](../ira-vin-mocks/)
- **Agent 开发指南**：[../../../specs/workshop/module-02-glue-multisource/Agents.md](../../../specs/workshop/module-02-glue-multisource/Agents.md)
