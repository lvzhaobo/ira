# 部署与运行指南

> **版本**: v1.0  
> **日期**: 2026-04-04  
> **目标读者**: 开发者、运维人员

---

## 1. 快速开始

### 1.1 环境要求

**必需:**
- Python 3.10+
- 现代浏览器(Chrome/Firefox/Safari/Edge)

**可选:**
- Git (版本控制)
- VS Code (推荐编辑器)

### 1.2 安装依赖

```bash
# 进入项目目录
cd quest-20260403-v2

# 安装 Python 依赖
pip install fastapi uvicorn pydantic python-multipart
```

### 1.3 启动服务

**终端 1 - 启动后端:**
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**终端 2 - 启动前端:**
```bash
cd frontend
python -m http.server 3000
```

**访问:**
- 前端页面: http://localhost:3000
- API 文档: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/openapi.json

---

## 2. 配置说明

### 2.1 环境变量

创建 `.env` 文件(可选):

```bash
# 后端配置
PORT=8000
MODEL_NAME=qwen-max
DEBUG=true

# 前端配置(在浏览器中配置,见下方)
BFF_BASE_URL=http://localhost:8000
```

**加载方式:**
```python
# main.py 中读取
import os
PORT = int(os.getenv("PORT", "8000"))
MODEL_NAME = os.getenv("MODEL_NAME", "qwen-max")
```

### 2.2 前端配置

打开 http://localhost:3000 后:

1. 在页面顶部"BFF 基地址"输入框中输入后端地址
2. 默认值: `http://localhost:8000`
3. 点击"保存"按钮
4. 配置存储在浏览器 localStorage

---

## 3. 验证安装

### 3.1 测试后端 API

```bash
# 测试文档列表
curl http://localhost:8000/api/v1/kb/documents

# 预期输出:
{"items":[]}
```

### 3.2 测试前端页面

1. 打开 http://localhost:3000
2. 确认页面正常加载
3. 确认 BFF 基地址配置正确
4. 点击"刷新列表"按钮
5. 应显示"暂无文档"

---

## 4. 使用指南

### 4.1 上传文档

1. 点击"选择文件"按钮
2. 选择 PDF/TXT/MD/DOC/DOCX 文件
3. 点击"上传"按钮
4. 等待上传完成提示
5. 文档自动出现在列表中

### 4.2 查看文档列表

1. 点击"刷新列表"按钮
2. 查看所有已上传文档
3. 显示信息:
   - 文档 ID
   - 标题
   - 文件名
   - 大小
   - 状态
   - 入库时间

### 4.3 提问

1. 在问题输入框中输入问题
2. 点击"提问"按钮
3. 等待回答
4. 查看:
   - 回答内容
   - 证据引用(doc_id, 页码, 位置, 相关度)
   - 原始 JSON 响应

---

## 5. 故障排查

### 5.1 后端无法启动

**问题:** `ModuleNotFoundError: No module named 'fastapi'`

**解决:**
```bash
pip install fastapi uvicorn pydantic python-multipart
```

**问题:** `Port 8000 already in use`

**解决:**
```bash
# 修改端口
python -m uvicorn app.main:app --port 8001
```

### 5.2 前端无法连接后端

**问题:** `Failed to fetch` 或 `ERR_CONNECTION_REFUSED`

**检查:**
1. 后端是否正在运行?
2. BFF 基地址配置是否正确?
3. 浏览器控制台是否有 CORS 错误?

**解决:**
1. 确认后端在 http://localhost:8000 运行
2. 在前端页面重新配置 BFF 基地址
3. 检查后端 CORS 配置

### 5.3 上传失败

**问题:** `文件大小超过限制`

**解决:** 上传小于 50MB 的文件

**问题:** `不支持的文件类型`

**解决:** 仅上传 PDF/TXT/MD/DOC/DOCX 格式

### 5.4 问答无结果

**问题:** 返回拒答模板

**原因:** 知识库中没有文档

**解决:** 先上传文档,再提问

---

## 6. 开发模式

### 6.1 代码热重载

后端已启用 `--reload` 参数,修改代码后自动重启。

**注意:** 
- 仅监控 `.py` 文件
- 大量修改建议手动重启

### 6.2 调试技巧

**查看后端日志:**
```bash
# 终端 1 会显示所有请求日志
INFO:     127.0.0.1:xxxxx - "POST /api/v1/research/qa/ask HTTP/1.1" 200 OK
```

**查看前端控制台:**
```javascript
// 浏览器 F12 → Console
// 查看 API 调用日志
```

**查看网络请求:**
```
浏览器 F12 → Network
- 查看请求 URL
- 查看请求/响应体
- 查看状态码
```

### 6.3 API 测试工具

**Swagger UI:**
- 访问: http://localhost:8000/docs
- 功能: 交互式 API 测试
- 优点: 自动生成,实时同步

**Postman:**
- 导入: `openapi/kb-qa-contract.yaml`
- 功能: 高级 API 测试
- 优点: 支持自动化测试

---

## 7. 生产部署(参考)

### 7.1 Docker 部署

**Dockerfile:**
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY openapi/ ./openapi/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**构建和运行:**
```bash
docker build -t kb-qa-bff .
docker run -p 8000:8000 kb-qa-bff
```

### 7.2 Nginx 反向代理

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 7.3 环境变量配置

**生产环境 .env:**
```bash
PORT=8000
MODEL_NAME=qwen-max
DEBUG=false
UPLOAD_DIR=/data/uploads
MAX_FILE_SIZE=52428800  # 50MB
```

---

## 8. 监控与维护

### 8.1 日志查看

**后端日志:**
```bash
# 标准输出
tail -f /var/log/bff.log

# 结构化日志(如配置)
jq . /var/log/bff-json.log
```

**关键日志:**
```
INFO: Document uploaded: doc_id=doc-xxx, size=12345
ERROR: Failed to process document: doc_id=doc-yyy
```

### 8.2 健康检查

**端点:**
```bash
curl http://localhost:8000/api/v1/kb/index/status
```

**预期响应:**
```json
{
  "index_ver": "v1.0",
  "updated_at": "2026-04-04T10:00:00Z",
  "status": "ready"
}
```

### 8.3 数据备份

**上传文件备份:**
```bash
tar -czf uploads-backup.tar.gz app/uploads/
```

**元数据备份:**
- 当前为内存存储,重启后丢失
- 生产环境应使用数据库,定期备份

---

## 9. 常见问题 (FAQ)

### Q1: 如何重置所有数据?

**A:** 重启后端服务,内存数据清空。删除 `app/uploads/` 下的文件。

### Q2: 支持哪些文件格式?

**A:** PDF, TXT, MD, DOC, DOCX。其他格式返回 415 错误。

### Q3: 文件大小限制是多少?

**A:** 50MB。超大文件返回 413 错误。

### Q4: 如何修改端口?

**A:** 
```bash
# 方法1: 命令行参数
python -m uvicorn app.main:app --port 9000

# 方法2: 环境变量
export PORT=9000
python -m uvicorn app.main:app
```

### Q5: 支持并发请求吗?

**A:** FastAPI 原生支持异步,可处理并发请求。但 Workshop 版本使用内存存储,高并发可能有问题。

### Q6: 如何查看 API 文档?

**A:** 访问 http://localhost:8000/docs (Swagger UI)

### Q7: 前端页面可以独立部署吗?

**A:** 可以。将 `frontend/` 目录部署到任意静态文件服务器(Nginx, Apache, S3等),配置 BFF 基地址即可。

---

## 10. 技术支持

### 10.1 文档资源

- [Spec 文档](01-Spec-知识库与问答-CoPaw底座-v0.1.md)
- [技术设计](04-Design-技术设计方案.md)
- [API 规范](standards/api-design.md)
- [OpenAPI 契约](../openapi/kb-qa-contract.yaml)

### 10.2 问题反馈

如遇问题,请提供:
1. 错误信息(截图或文本)
2. 复现步骤
3. 环境信息(Python 版本、操作系统)
4. 相关日志

---

## 11. 变更历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-04 | 初始版本,包含完整部署指南 |
