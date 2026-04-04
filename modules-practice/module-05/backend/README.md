# 多Agent基金投研平台 - 后端服务

基于Python Flask的多Agent基金投研分析平台后端服务。

## 技术栈

- **Python**: 3.11
- **Web框架**: Flask 3.0
- **ORM**: SQLAlchemy 2.0
- **数据库**: MySQL / SQLite
- **认证**: Flask-JWT-Extended
- **日志**: Loguru
- **测试**: pytest

## 项目结构

```
backend/
├── app/
│   ├── __init__.py          # Flask应用工厂
│   ├── config.py            # 配置文件
│   ├── extensions.py        # Flask扩展初始化
│   ├── commands.py          # CLI命令
│   ├── models/              # 数据模型
│   │   ├── fund.py          # 基金相关模型
│   │   └── analysis.py      # 分析相关模型
│   ├── routes/              # API路由
│   │   ├── fund_routes.py   # 基金接口
│   │   ├── analysis_routes.py # 分析接口
│   │   └── agent_routes.py  # Agent接口
│   ├── agents/              # Agent实现
│   │   ├── base.py          # Agent基类
│   │   ├── coordinator.py   # 协调Agent
│   │   ├── performance.py   # 业绩分析Agent
│   │   ├── risk.py          # 风险评估Agent
│   │   ├── portfolio.py     # 持仓分析Agent
│   │   ├── manager.py       # 基金经理Agent
│   │   └── market.py        # 市场环境Agent
│   ├── services/            # 业务服务层
│   │   ├── fund_service.py
│   │   ├── analysis_service.py
│   │   └── report_service.py
│   └── utils/               # 工具函数
├── tests/                   # 测试文件
├── requirements.txt         # 依赖包
├── .env.example            # 环境变量示例
└── run.py                   # 启动文件
```

## 快速开始

### 1. 环境准备

确保已安装Python 3.11或更高版本。

```bash
python --version
```

### 2. 安装依赖

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑.env文件，配置数据库连接等参数
```

### 4. 初始化数据库

```bash
# 使用SQLite（开发环境默认）
flask init-db

# 或使用MySQL（需先在.env中配置）
# 创建数据库
CREATE DATABASE fund_research CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# 然后执行
flask init-db
```

### 5. 启动服务

```bash
# 开发模式
python run.py

# 或使用flask命令
flask run
```

服务将在 `http://localhost:5000` 启动。

## API接口

### 基金相关接口

- `GET /api/fund/search` - 搜索基金
- `GET /api/fund/<fund_code>` - 获取基金详情
- `GET /api/fund/<fund_code>/nav` - 获取基金净值历史
- `GET /api/fund/<fund_code>/holdings` - 获取基金持仓
- `GET /api/fund/managers` - 获取基金经理列表

### 分析相关接口

- `POST /api/analysis/start` - 启动分析任务
- `GET /api/analysis/<task_id>` - 查询分析进度
- `GET /api/analysis/tasks` - 获取分析任务列表
- `GET /api/analysis/<task_id>/results` - 获取分析结果
- `POST /api/analysis/<task_id>/cancel` - 取消分析任务

### Agent相关接口

- `POST /api/agent/chat` - Agent对话
- `GET /api/agent/types` - 获取Agent类型列表

## 数据库模型

### 基金相关表

- `funds` - 基金基本信息
- `fund_nav` - 基金净值
- `fund_holdings` - 基金持仓
- `fund_managers` - 基金经理

### 分析相关表

- `analysis_tasks` - 分析任务
- `analysis_results` - 分析结果
- `reports` - 报告

## Agent架构

平台采用多Agent协作架构：

1. **协调Agent (Coordinator)**: 负责任务分配和结果整合
2. **业绩分析Agent (Performance)**: 分析基金业绩表现
3. **风险评估Agent (Risk)**: 评估基金风险水平
4. **持仓分析Agent (Portfolio)**: 分析基金持仓结构
5. **基金经理Agent (Manager)**: 分析基金经理能力
6. **市场环境Agent (Market)**: 分析市场环境

## 开发指南

### 运行测试

```bash
# 运行所有测试
pytest

# 运行测试并生成覆盖率报告
pytest --cov=app tests/
```

### 代码规范

- 遵循PEP 8编码规范
- 使用类型提示
- 编写文档字符串
- 保持函数单一职责

### 数据库迁移

```bash
# 生成迁移脚本
flask db migrate -m "描述"

# 应用迁移
flask db upgrade

# 回滚迁移
flask db downgrade
```

## 配置说明

主要配置项在 `.env` 文件中：

```env
# 数据库配置
SQLALCHEMY_DATABASE_URI=mysql+pymysql://root:password@localhost:3306/fund_research

# JWT配置
JWT_SECRET_KEY=your-secret-key

# Agent配置
AGENT_TIMEOUT=300
AGENT_MAX_RETRIES=3
```

## 部署

### 生产环境部署

推荐使用Gunicorn或uWSGI：

```bash
# 使用Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Docker部署

```bash
# 构建镜像
docker build -t fund-research-backend .

# 运行容器
docker run -p 5000:5000 --env-file .env fund-research-backend
```

## 日志

日志文件位于 `logs/app.log`，使用loguru进行日志管理，支持：

- 日志轮转（10MB）
- 日志保留（30天）
- 分级日志（DEBUG/INFO/WARNING/ERROR）

## 常见问题

### 1. 数据库连接失败

检查 `.env` 中的数据库配置是否正确，确保MySQL服务已启动。

### 2. 导入错误

确保已激活虚拟环境并安装了所有依赖。

### 3. 端口冲突

修改 `.env` 中的 `PORT` 配置或使用其他端口启动：

```bash
python run.py --port 5001
```

## 许可证

MIT License

## 联系方式

如有问题，请联系开发团队。
