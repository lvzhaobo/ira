/**
 * 钉钉机器人 + Qoder CLI 桥接服务
 * 
 * 功能:
 * 1. 接收钉钉机器人消息
 * 2. 解析指令并调用Qoder CLI
 * 3. 返回执行结果到钉钉
 * 
 * 作者: Workshop Team
 * 版本: 1.0.0
 */

require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const logger = require('./utils/logger');
const qoderExecutor = require('./modules/qoderExecutor');
const messageFormatter = require('./modules/messageFormatter');
const taskManager = require('./modules/taskManager');
const dingtalkApi = require('./modules/dingtalkApi');

const app = express();
app.use(express.json());

// 配置
const CONFIG = {
  port: process.env.PORT || 8080,
  dingtalkSecret: process.env.DINGTALK_SECRET,
  dingtalkWebhook: process.env.DINGTALK_WEBHOOK,
  allowedUsers: process.env.ALLOWED_DINGTALK_USERS ? process.env.ALLOWED_DINGTALK_USERS.split(',') : [],
  notifyOnComplete: process.env.NOTIFY_ON_COMPLETE === 'true',
  notifyOnError: process.env.NOTIFY_ON_ERROR === 'true'
};

// 验证钉钉签名
function verifyDingTalkSignature(timestamp, sign) {
  if (!CONFIG.dingtalkSecret) {
    logger.warn('未配置钉钉签名密钥,跳过签名验证');
    return true;
  }

  const stringToSign = `${timestamp}\n${CONFIG.dingtalkSecret}`;
  const hmac = crypto.createHmac('sha256', CONFIG.dingtalkSecret)
    .update(stringToSign)
    .digest('base64');
  
  return encodeURIComponent(hmac) === sign;
}

// 检查用户权限
function checkUserPermission(senderId) {
  if (CONFIG.allowedUsers.length === 0) {
    return true; // 未配置白名单,允许所有用户
  }
  return CONFIG.allowedUsers.includes(senderId);
}

// 发送钉钉消息
// 支持两种方式:
// 1. 企业内部应用机器人 (推荐) - 使用 DINGTALK_APP_KEY/DINGTALK_APP_SECRET
// 2. 自定义Webhook机器人 - 使用 DINGTALK_WEBHOOK/DINGTALK_SECRET
async function sendDingTalkMessage(content, msgType = 'text', options = {}) {
  const { atAll = false, originalMessage = null } = options;

  try {
    // 方式1: 企业内部应用机器人
    if (dingtalkApi.isConfigured()) {
      if (originalMessage) {
        // 有原始消息，回复到对应的会话
        return await dingtalkApi.sendMessage(originalMessage, content, msgType);
      } else {
        // 没有原始消息，只能发送到配置的默认用户（如果配置了的话）
        logger.warn('企业内部应用模式需要原始消息来确定回复目标');
        return { success: false, error: 'No target specified' };
      }
    }
    
    // 方式2: 自定义Webhook机器人
    if (CONFIG.dingtalkWebhook) {
      let messageBody;
      
      if (msgType === 'text') {
        messageBody = {
          msgtype: 'text',
          text: { content },
          at: { isAtAll: atAll }
        };
      } else if (msgType === 'markdown') {
        messageBody = {
          msgtype: 'markdown',
          markdown: {
            title: 'Qoder CLI执行结果',
            text: content
          },
          at: { isAtAll: atAll }
        };
      }

      const response = await axios.post(CONFIG.dingtalkWebhook, messageBody, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.errcode !== 0) {
        logger.error('发送钉钉消息失败:', response.data);
      }

      return response.data;
    }
    
    logger.error('未配置钉钉消息发送方式，请配置企业内部应用(DINGTALK_APP_KEY/DINGTALK_APP_SECRET)或自定义Webhook(DINGTALK_WEBHOOK)');
    return { success: false, error: 'No dingtalk config' };
  } catch (error) {
    logger.error('发送钉钉消息异常:', error.message);
    // 不抛出异常，返回错误信息
    return { success: false, error: error.message };
  }
}

// 解析钉钉消息
// 支持两种消息格式:
// 1. Stream模式: message.text.content
// 2. HTTP模式: message.content
function parseDingTalkMessage(message) {
  // 尝试多种可能的消息内容字段
  const text = message.text?.content?.trim()
    || message.content?.trim()
    || message.text
    || '';

  logger.debug('解析消息内容:', { text, messageKeys: Object.keys(message) });

  // 支持的指令格式
  const commands = {
    '/qoder': 'qoder',
    '/status': 'status',
    '/help': 'help',
    '/tasks': 'tasks',
    '/cancel': 'cancel'
  };

  // 匹配指令
  for (const [prefix, command] of Object.entries(commands)) {
    if (text.startsWith(prefix)) {
      const params = text.substring(prefix.length).trim();
      return { command, params, rawText: text };
    }
  }

  // 不是指令,返回普通消息
  return { command: null, params: null, rawText: text };
}

// 处理Qoder CLI指令
async function handleQoderCommand(params, senderId) {
  if (!params || params.length === 0) {
    return {
      success: false,
      message: '❌ 请提供要执行的指令\n\n示例:\n/qoder 查看当前系统CPU使用率\n/qoder 列出所有运行中的进程'
    };
  }

  logger.info(`用户 ${senderId} 请求执行Qoder CLI: ${params}`);

  try {
    // 执行Qoder CLI
    const result = await qoderExecutor.execute(params, {
      maxTurns: parseInt(process.env.MAX_QODER_TURNS) || 15,
      timeout: parseInt(process.env.QODER_TIMEOUT) || 300000,
      workdir: process.env.QODER_WORKDIR || process.cwd()
    });

    logger.info(`Qoder CLI执行完成,任务ID: ${result.taskId}`);

    return {
      success: true,
      taskId: result.taskId,
      output: result.output,
      duration: result.duration
    };
  } catch (error) {
    logger.error(`Qoder CLI执行失败: ${error.message}`);
    return {
      success: false,
      message: `❌ 执行失败\n\n错误信息: ${error.message}`,
      error: error.message
    };
  }
}

// 处理状态查询
async function handleStatusCommand() {
  const status = await qoderExecutor.getStatus();
  return messageFormatter.formatStatus(status);
}

// 处理帮助指令
function handleHelpCommand() {
  return {
    success: true,
    message: messageFormatter.getHelpMessage()
  };
}

// 处理任务列表查询
async function handleTasksCommand() {
  const tasks = taskManager.getActiveTasks();
  return messageFormatter.formatTaskList(tasks);
}

// 处理取消任务
async function handleCancelCommand(params, senderId) {
  if (!params) {
    return {
      success: false,
      message: '❌ 请提供要取消的任务ID\n\n示例: /cancel task-123456'
    };
  }

  const success = taskManager.cancelTask(params);
  if (success) {
    return {
      success: true,
      message: `✅ 任务 ${params} 已取消`
    };
  } else {
    return {
      success: false,
      message: `❌ 任务 ${params} 不存在或已完成`
    };
  }
}

// 路由: 接收钉钉Webhook
app.post('/webhook', async (req, res) => {
  const { timestamp, sign } = req.query;

  // 验证签名
  if (!verifyDingTalkSignature(timestamp, sign)) {
    logger.warn('钉钉签名验证失败');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const message = req.body;
  logger.debug('收到钉钉消息:', JSON.stringify(message, null, 2));

  // 获取发送者信息
  // 支持多种字段名: senderStaffId(企业内部应用), senderId, staffId
  const senderId = message.senderStaffId
    || message.senderId
    || message.staffId
    || message.sender?.staffId
    || 'unknown';

  // 获取会话ID
  const conversationId = message.conversationId
    || message.openConversationId
    || message.chatId
    || '';

  logger.info(`收到消息 - 发送者: ${senderId}, 会话: ${conversationId}`);
  
  // 检查权限
  if (!checkUserPermission(senderId)) {
    logger.warn(`用户 ${senderId} 无权限执行操作`);
    await sendDingTalkMessage('❌ 您没有权限执行此操作,请联系管理员', 'text', { originalMessage: message });
    return res.status(200).send('ok');
  }

  // 解析消息
  const parsed = parseDingTalkMessage(message);

  // 回复收到（如果发送失败，记录日志但继续处理）
  try {
    await sendDingTalkMessage('🤖 收到指令,正在处理...', 'text', { originalMessage: message });
  } catch (sendError) {
    logger.warn('发送确认消息失败，继续处理:', sendError.message);
  }

  try {
    let result;

    // 根据指令类型处理
    switch (parsed.command) {
      case 'qoder':
        result = await handleQoderCommand(parsed.params, senderId);
        break;
      case 'status':
        result = await handleStatusCommand();
        break;
      case 'help':
        result = handleHelpCommand();
        break;
      case 'tasks':
        result = await handleTasksCommand();
        break;
      case 'cancel':
        result = await handleCancelCommand(parsed.params, senderId);
        break;
      default:
        // 不是已知指令,提供帮助
        result = {
          success: true,
          message: ` unrecognized command. 发送 /help 查看可用指令`
        };
    }

    // 发送结果到钉钉
    if (result.success) {
      if (result.output) {
        // Qoder CLI执行结果,使用markdown格式
        const formattedOutput = messageFormatter.formatQoderOutput(result.output, result.taskId, result.duration);
        await sendDingTalkMessage(formattedOutput, 'markdown', { originalMessage: message });
      } else {
        await sendDingTalkMessage(result.message, 'text', { originalMessage: message });
      }
    } else {
      await sendDingTalkMessage(result.message, 'text', { originalMessage: message });
      
      if (CONFIG.notifyOnError) {
        logger.error(`任务执行失败: ${result.error}`);
      }
    }
  } catch (error) {
    logger.error('处理钉钉消息时发生错误:', error);
    try {
      await sendDingTalkMessage(`❌ 处理失败: ${error.message}`, 'text', { originalMessage: message });
    } catch (e) {
      logger.error('发送错误消息也失败:', e.message);
    }
  }

  res.status(200).send('ok');
});

// 路由: 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// 路由: 获取服务状态
app.get('/status', async (req, res) => {
  try {
    const status = await qoderExecutor.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 路由: 获取任务列表
app.get('/tasks', (req, res) => {
  const tasks = taskManager.getActiveTasks();
  res.json(tasks);
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('未捕获的错误:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 启动服务器
app.listen(CONFIG.port, () => {
  logger.info(`钉钉-Qoder桥接服务已启动`);
  logger.info(`监听端口: ${CONFIG.port}`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Webhook端点: /webhook`);
  logger.info(`健康检查: http://localhost:${CONFIG.port}/health`);
  
  // 诊断：测试spawn是否工作
  const { spawn } = require('child_process');
  const fs = require('fs');
  try {
    const testChild = spawn('/usr/bin/bash', ['-c', 'echo spawn_test_ok']);
    let testOutput = '';
    testChild.stdout.on('data', (data) => { testOutput += data.toString(); });
    testChild.on('close', (code) => {
      logger.info(`[诊断] spawn测试: code=${code}, output=${testOutput.trim()}`);
    });
    testChild.on('error', (err) => {
      logger.error(`[诊断] spawn测试失败: ${err.message}, code=${err.code}`);
    });
    logger.info(`[诊断] /bin/bash exists: ${fs.existsSync('/bin/bash')}`);
    logger.info(`[诊断] /usr/bin/bash exists: ${fs.existsSync('/usr/bin/bash')}`);
    logger.info(`[诊断] CWD: ${process.cwd()}`);
    logger.info(`[诊断] PATH: ${process.env.PATH}`);
  } catch (e) {
    logger.error(`[诊断] 异常: ${e.message}`);
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号,准备关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号,准备关闭服务...');
  process.exit(0);
});

module.exports = app;
