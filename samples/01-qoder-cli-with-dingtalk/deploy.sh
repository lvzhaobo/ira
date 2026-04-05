#!/bin/bash

# 钉钉-Qoder桥接服务部署脚本
# 用途: 在ECS上一键部署应用

set -e

echo "========================================="
echo "钉钉-Qoder桥接服务 部署脚本"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否以root运行
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}请以root权限运行此脚本${NC}"
  exit 1
fi

# 配置变量
APP_DIR="/opt/dingtalk-qoder-bridge"
NODE_VERSION="18.x"

echo -e "${GREEN}步骤 1/7: 检查系统环境...${NC}"

# 检查Node.js
if command -v node &> /dev/null; then
  echo "✓ Node.js已安装: $(node --version)"
else
  echo -e "${YELLOW}Node.js未安装,开始安装...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | bash -
  apt-get install -y nodejs
  echo "✓ Node.js安装完成: $(node --version)"
fi

# 检查npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}npm未安装${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}步骤 2/7: 创建应用目录...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
echo "✓ 应用目录已创建: $APP_DIR"

echo ""
echo -e "${GREEN}步骤 3/7: 复制应用文件...${NC}"
# 假设脚本在应用目录中运行
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cp -r $SCRIPT_DIR/src $APP_DIR/
cp $SCRIPT_DIR/package.json $APP_DIR/
cp $SCRIPT_DIR/.env.example $APP_DIR/.env
cp $SCRIPT_DIR/ecosystem.config.js $APP_DIR/
echo "✓ 应用文件已复制"

echo ""
echo -e "${GREEN}步骤 4/7: 安装依赖...${NC}"
cd $APP_DIR
npm install --production
echo "✓ 依赖安装完成"

echo ""
echo -e "${GREEN}步骤 5/7: 检查Qoder CLI...${NC}"
if command -v qodercli &> /dev/null; then
  echo "✓ Qoder CLI已安装: $(qodercli --version)"
else
  echo -e "${YELLOW}Qoder CLI未安装${NC}"
  echo "请手动安装: npm install -g @qoder-ai/qodercli"
  echo "然后配置环境变量: QODER_PERSONAL_ACCESS_TOKEN"
fi

echo ""
echo -e "${GREEN}步骤 6/7: 配置环境变量...${NC}"
echo "请编辑配置文件: $APP_DIR/.env"
echo ""
echo "必须配置以下变量:"
echo "  - DINGTALK_SECRET: 钉钉机器人密钥"
echo "  - DINGTALK_WEBHOOK: 钉钉机器人Webhook地址"
echo "  - QODER_PERSONAL_ACCESS_TOKEN: Qoder访问令牌"
echo ""
read -p "是否现在编辑配置文件? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  nano $APP_DIR/.env
fi

echo ""
echo -e "${GREEN}步骤 7/7: 安装PM2并启动服务...${NC}"

# 检查PM2
if ! command -v pm2 &> /dev/null; then
  echo "安装PM2..."
  npm install -g pm2
fi

# 启动服务
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "========================================="
echo -e "${GREEN}✓ 部署完成!${NC}"
echo "========================================="
echo ""
echo "服务信息:"
echo "  应用目录: $APP_DIR"
echo "  日志目录: $APP_DIR/logs"
echo "  配置文件: $APP_DIR/.env"
echo ""
echo "管理命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs dingtalk-qoder"
echo "  重启服务: pm2 restart dingtalk-qoder"
echo "  停止服务: pm2 stop dingtalk-qoder"
echo ""
echo "下一步:"
echo "  1. 配置钉钉机器人Webhook地址为: http://你的ECS_IP:8080/webhook"
echo "  2. 在钉钉群中测试: 发送 /help"
echo "  3. 查看日志确保服务正常运行"
echo ""
echo "安全建议:"
echo "  - 配置Nginx反向代理和HTTPS"
echo "  - 设置防火墙规则,仅允许钉钉服务器IP访问"
echo "  - 定期更新AccessKey和Token"
echo ""
