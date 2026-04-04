# 快速开始指南

## Windows环境快速启动

### 方法一：使用初始化脚本（推荐）

1. 双击运行 `init.bat` 文件
2. 等待依赖安装完成
3. 编辑生成的 `.env` 文件（可选，默认使用SQLite）
4. 运行以下命令初始化数据库：
   ```bash
   venv\Scripts\activate
   flask init-db
   ```
5. 启动服务：
   ```bash
   python run.py
   ```

### 方法二：手动安装

```bash
# 1. 创建虚拟环境
python -m venv venv

# 2. 激活虚拟环境
venv\Scripts\activate

# 3. 安装依赖
pip install -r requirements.txt

# 4. 创建必要目录
mkdir logs uploads instance

# 5. 复制环境变量文件
copy .env.example .env

# 6. 初始化数据库
flask init-db

# 7. 启动服务
python run.py
```

## 验证安装

启动服务后，打开浏览器访问：

- 首页: http://localhost:5000
- 健康检查: http://localhost:5000/health

## 测试API

### 使用curl测试

```bash
# 搜索基金
curl http://localhost:5000/api/fund/search

# 获取Agent类型
curl http://localhost:5000/api/agent/types

# 启动分析任务
curl -X POST http://localhost:5000/api/analysis/start ^
  -H "Content-Type: application/json" ^
  -d "{\"fund_code\":\"000001\",\"task_type\":\"comprehensive\"}"
```

### 使用Python测试

```python
import requests

# 搜索基金
response = requests.get('http://localhost:5000/api/fund/search')
print(response.json())

# 获取Agent类型
response = requests.get('http://localhost:5000/api/agent/types')
print(response.json())
```

## 运行测试

```bash
# 激活虚拟环境
venv\Scripts\activate

# 运行测试
pytest tests/ -v

# 运行测试并查看覆盖率
pytest --cov=app tests/ -v
```

## 常见问题

### 1. pip安装失败

如果使用pip安装依赖失败，可以尝试使用国内镜像：

```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 2. 数据库连接失败

默认配置使用SQLite，无需额外配置。如果使用MySQL，请：

1. 安装MySQL
2. 创建数据库: `CREATE DATABASE fund_research CHARACTER SET utf8mb4;`
3. 编辑 `.env` 文件，配置MySQL连接字符串

### 3. 端口被占用

修改启动命令使用其他端口：

```python
# 在run.py中修改
app.run(host='0.0.0.0', port=5001, debug=True)
```

## 下一步

1. 查看 `README.md` 了解完整文档
2. 查看 `app/routes/` 了解API接口
3. 查看 `app/agents/` 了解Agent架构
4. 运行测试了解系统功能

## 开发建议

1. **使用VSCode**：推荐安装Python扩展
2. **启用调试模式**：默认已启用
3. **查看日志**：logs/app.log 或控制台输出
4. **数据库工具**：推荐使用DBeaver或Navicat

## 获取帮助

如遇到问题：

1. 查看日志输出
2. 检查 `.env` 配置
3. 确认依赖已正确安装
4. 查看README.md的常见问题部分
