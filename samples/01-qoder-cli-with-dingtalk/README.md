# 钉钉机器人 + Qoder CLI 桥接服务

> 通过钉钉消息远程控制ECS上的Qoder CLI,实现移动化运维和自动化任务管理

## 📋 目录

- [功能特性](#功能特性)
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [详细部署](#详细部署)
- [使用指南](#使用指南)
- [API文档](#api文档)
- [安全配置](#安全配置)
- [故障排查](#故障排查)
- [常见问题](#常见问题)

---

## 功能特性

✅ **自然语言交互** - 通过钉钉发送中文指令即可执行复杂任务  
✅ **智能任务管理** - 自动跟踪任务状态,支持查询和取消  
✅ **安全认证** - 钉钉签名验证 + 用户白名单双重保护  
✅ **完整日志** - Winston日志系统,支持日志轮转  
✅ **进程管理** - PM2守护,自动重启,开机自启  
✅ **状态监控** - 健康检查端点,实时查看服务状态  
✅ **格式化输出** - 自动将Qoder CLI输出格式化为钉钉Markdown  

---

## 系统架构

```
┌─────────────┐
│  钉钉客户端  │
└──────┬──────┘
       │ HTTP POST (Webhook)
       ▼
┌─────────────────────┐
│   Nginx (可选)      │
│   - HTTPS终止       │
│   - 反向代理        │
│   - IP白名单        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Express Server     │
│  - 签名验证         │
│  - 权限检查         │
│  - 消息解析         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Qoder Executor     │
│  - 命令执行         │
│  - 超时控制         │
│  - 输出捕获         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Qoder CLI         │
│   - 自然语言理解    │
│   - Bash工具调用    │
│   - 文件操作        │
└─────────────────────┘
```

---

## 快速开始

### 前置条件

- Node.js >= 16.0.0
- Qoder CLI (已安装并配置Token)
- 钉钉群和自定义机器人
- Linux服务器(ECS推荐)

### 5分钟快速部署

```bash
# 1. 克隆或下载项目
cd /opt
git clone <repository-url> dingtalk-qoder-bridge
cd dingtalk-qoder-bridge

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
nano .env  # 编辑配置文件

# 4. 启动服务
npm start

# 或使用PM2后台运行
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

### 配置钉钉机器人

1. 打开钉钉群 → 群设置 → 智能群助手 → 添加机器人
2. 选择"自定义(通过Webhook接入自定义服务)"
3. 设置机器人名称: `Qoder CLI Bot`
4. 安全设置选择**"加签"**,记录密钥
5. 保存后获取Webhook地址
6. 将Webhook和密钥填入`.env`文件

### 测试

在钉钉群中发送:
```
/help
```

预期收到帮助信息,说明部署成功!

---

## 详细部署

### 方式一: 使用部署脚本(推荐)

```bash
# 以root权限运行
chmod +x deploy.sh
sudo ./deploy.sh
```

脚本会自动:
- 检查并安装Node.js
- 创建应用目录
- 安装依赖
- 配置PM2
- 设置开机自启

### 方式二: 手动部署

#### 1. 安装Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
```

#### 2. 安装Qoder CLI

```bash
npm install -g @qoder-ai/qodercli

# 验证
qodercli --version
```

#### 3. 配置环境变量

```bash
cd /opt/dingtalk-qoder-bridge
cp .env.example .env
nano .env
```

必填配置:
```env
DINGTALK_SECRET=SECxxxxxx
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxxxxx
QODER_PERSONAL_ACCESS_TOKEN=your_qoder_token
```

#### 4. 启动服务

**开发环境**:
```bash
npm run dev  # 使用nodemon,自动重启
```

**生产环境**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 开机自启
```

#### 5. 配置Nginx(推荐)

```bash
# 复制配置模板
cp nginx.conf.example /etc/nginx/sites-available/dingtalk-qoder

# 编辑配置,修改域名/IP
nano /etc/nginx/sites-available/dingtalk-qoder

# 启用站点
ln -s /etc/nginx/sites-available/dingtalk-qoder /etc/nginx/sites-enabled/

# 测试并重载
nginx -t
systemctl reload nginx
```

#### 6. 配置防火墙

```bash
# 如果使用Nginx,只开放80/443
ufw allow 80/tcp
ufw allow 443/tcp

# 如果直接访问,开放8080
ufw allow 8080/tcp

# 建议限制访问来源
ufw allow from <钉钉服务器IP> to any port 8080
```

### 方式三: Systemd服务

```bash
# 复制service文件
cp dingtalk-qoder.service /etc/systemd/system/

# 编辑工作目录
nano /etc/systemd/system/dingtalk-qoder.service

# 启动服务
systemctl daemon-reload
systemctl start dingtalk-qoder
systemctl enable dingtalk-qoder

# 查看状态
systemctl status dingtalk-qoder
```

---

## 使用指南

### 基本指令

#### 1. 执行Qoder CLI任务

```
/qoder <你的指令>
```

**示例**:
```
/qoder 查看当前系统CPU使用率
/qoder 列出占用内存最多的10个进程
/qoder 检查磁盘空间使用情况
/qoder 查找大于100MB的文件
/qoder 重启/opt/app下的node应用
```

#### 2. 查看服务状态

```
/status
```

返回:
- Qoder CLI版本
- Node.js版本
- 系统信息(CPU、内存、运行时间)
- 活跃任务数

#### 3. 查看任务列表

```
/tasks
```

返回正在执行的任务列表。

#### 4. 取消任务

```
/cancel <任务ID>
```

**示例**:
```
/cancel task-1712304000000-abc123
```

#### 5. 查看帮助

```
/help
```

### 常用场景

#### 📊 系统监控

```
/qoder 查询系统CPU、内存、磁盘使用情况的详细报告
/qoder 显示过去1小时的系统负载趋势
/qoder 列出所有运行时间超过7天的进程
```

#### 🔍 故障排查

```
/qoder 检查端口8080是否被占用,如果被占用显示是哪个进程
/qoder 查看最近100条系统日志中的错误信息
/qoder 检查/var/log下的日志文件大小,找出超过1GB的文件
```

#### 📁 文件管理

```
/qoder 在/opt/app目录下查找包含"error"关键字的日志文件
/qoder 列出/etc/nginx/conf.d/目录下所有配置文件
/qoder 统计当前目录下各子目录的大小
```

#### 🌐 网络诊断

```
/qoder 测试到api.example.com的网络连通性和延迟
/qoder 显示当前系统的所有监听端口和对应进程
/qoder 检查防火墙规则,列出所有允许的入站连接
```

#### 🔧 应用管理

```
/qoder 检查/opt/app下的node应用是否正常运行,如果没有则启动它
/qoder 查看pm2管理的所有应用状态
/qoder 清理超过7天的应用日志文件
```

### 高级用法

#### 多步骤任务

```
/qoder 完成以下任务:
1. 检查系统磁盘空间
2. 清理/tmp目录下超过3天的文件
3. 清理后再次检查磁盘空间
4. 生成清理报告
```

#### 定时任务(结合crontab)

在服务器上配置crontab,通过curl触发:

```bash
# 每天凌晨2点执行系统检查
0 2 * * * curl -X POST "http://localhost:8080/webhook" \
  -H "Content-Type: application/json" \
  -d '{"text":{"content":"/qoder 执行每日系统健康检查"}}'
```

---

## API文档

### Webhook端点

**POST** `/webhook`

接收钉钉消息并处理。

**请求头**:
```
Content-Type: application/json
```

**查询参数**:
- `timestamp` - 时间戳(钉钉提供)
- `sign` - 签名(钉钉提供)

**请求体**:
```json
{
  "msgtype": "text",
  "text": {
    "content": "/qoder 查看系统状态"
  },
  "senderId": "user123"
}
```

**响应**:
```
200 OK
ok
```

### 健康检查

**GET** `/health`

检查服务是否正常运行。

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-05T14:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### 服务状态

**GET** `/status`

获取Qoder CLI和系统状态。

**响应**:
```json
{
  "qoderInstalled": true,
  "qoderVersion": "0.1.38",
  "nodeVersion": "v18.19.0",
  "systemInfo": {
    "platform": "linux",
    "arch": "x64",
    "cpus": 4,
    "totalMemory": "8GB",
    "freeMemory": "4GB",
    "uptime": "24小时"
  },
  "activeTasks": 2,
  "timestamp": "2026-04-05T14:30:00.000Z"
}
```

### 任务列表

**GET** `/tasks`

获取正在执行的任务列表。

**响应**:
```json
[
  {
    "id": "task-1712304000000-abc123",
    "prompt": "查看系统CPU使用率",
    "startTime": "2026-04-05 14:30:00",
    "duration": "30秒"
  }
]
```

---

## 安全配置

### 1. 钉钉签名验证

已在代码中实现,确保`.env`中配置了`DINGTALK_SECRET`。

### 2. 用户白名单

在`.env`中配置允许使用机器人的用户:

```env
ALLOWED_DINGTALK_USERS=user123,user456,user789
```

获取用户ID方法:
- 钉钉管理后台 → 成员管理 → 查看成员详情

### 3. Nginx IP白名单

```nginx
location /webhook {
    allow 140.205.0.0/16;  # 钉钉服务器IP段
    allow 123.45.67.89;    # 你的办公IP
    deny all;
    
    proxy_pass http://127.0.0.1:8080;
}
```

### 4. HTTPS配置

```bash
# 使用Let's Encrypt免费证书
apt-get install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### 5. 定期更新凭证

建议每3个月:
- 更新钉钉机器人密钥
- 更新Qoder Personal Access Token
- 更新阿里云AccessKey

---

## 故障排查

### 服务无法启动

```bash
# 检查Node.js版本
node --version  # 需要 >= 16.0.0

# 检查端口占用
netstat -tlnp | grep 8080

# 查看详细错误
pm2 logs dingtalk-qoder --lines 100
```

### Qoder CLI执行失败

```bash
# 检查Qoder CLI是否安装
qodercli --version

# 检查Token配置
echo $QODER_PERSONAL_ACCESS_TOKEN

# 手动测试Qoder CLI
qodercli -p "你好"
```

### 钉钉收不到消息

```bash
# 检查Webhook配置
curl -X POST "你的Webhook地址" \
  -H "Content-Type: application/json" \
  -d '{"msgtype":"text","text":{"content":"测试"}}'

# 检查防火墙规则
ufw status

# 检查Nginx日志
tail -f /var/log/nginx/dingtalk-qoder-access.log
tail -f /var/log/nginx/dingtalk-qoder-error.log
```

### 任务执行超时

调整`.env`中的超时配置:

```env
# 增加到10分钟
QODER_TIMEOUT=600000
MAX_QODER_TURNS=20
```

### 查看完整日志

```bash
# PM2日志
pm2 logs dingtalk-qoder

# 应用日志
tail -f /opt/dingtalk-qoder-bridge/logs/combined.log
tail -f /opt/dingtalk-qoder-bridge/logs/error.log
```

---

## 常见问题

### Q1: 支持哪些Qoder CLI功能?

A: 理论上支持所有Qoder CLI功能,包括:
- 文件读写和编辑
- Bash命令执行
- 代码生成和审查
- Git操作
- MCP Server集成

### Q2: 如何保证安全性?

A: 多层安全防护:
1. 钉钉签名验证
2. 用户白名单
3. Nginx IP白名单(可选)
4. HTTPS加密(推荐)
5. Qoder CLI权限策略

### Q3: 输出太长被截断怎么办?

A: 钉钉消息限制20000字符。解决方案:
- 查看详细日志: `pm2 logs dingtalk-qoder`
- 查看完整输出文件: `/opt/dingtalk-qoder-bridge/logs/`
- 在指令中要求精简输出

### Q4: 可以并发执行多个任务吗?

A: 可以,在`.env`中配置:
```env
MAX_CONCURRENT_TASKS=5
```

### Q5: 如何在多台ECS上使用?

A: 每台ECS独立部署,或使用统一的控制服务器分发任务到各ECS。

### Q6: 支持钉钉群以外的场景吗?

A: 当前版本仅支持钉钉群机器人,后续可扩展:
- 钉钉企业内部机器人
- 企业微信
- 飞书
- 自定义Webhook

---

## 项目结构

```
dingtalk-qoder-bridge/
├── src/
│   ├── server.js                  # 主服务器
│   ├── utils/
│   │   └── logger.js              # 日志工具
│   └── modules/
│       ├── qoderExecutor.js       # Qoder CLI执行器
│       ├── messageFormatter.js    # 消息格式化
│       └── taskManager.js         # 任务管理
├── logs/                          # 日志目录
├── .env.example                   # 环境变量示例
├── .env                           # 环境变量(不提交)
├── package.json                   # 依赖配置
├── ecosystem.config.js            # PM2配置
├── nginx.conf.example             # Nginx配置示例
├── dingtalk-qoder.service         # Systemd服务配置
├── deploy.sh                      # 部署脚本
└── README.md                      # 本文档
```

---

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request!

## 支持

如有问题,请:
1. 查看[故障排查](#故障排查)章节
2. 查看[常见问题](#常见问题)
3. 提交Issue
4. 联系项目维护者

---

**最后更新**: 2026-04-05  
**版本**: 1.0.0
