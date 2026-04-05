/**
 * 钉钉企业内部应用API模块
 * 
 * 负责:
 * 1. 获取access_token
 * 2. 发送机器人消息
 * 3. token缓存管理
 */

const axios = require('axios');
const logger = require('../utils/logger');

class DingTalkAPI {
  constructor() {
    this.appKey = process.env.DINGTALK_APP_KEY;
    this.appSecret = process.env.DINGTALK_APP_SECRET;
    this.robotCode = process.env.DINGTALK_ROBOT_CODE || this.appKey;
    
    // Token缓存
    this.accessToken = null;
    this.tokenExpireTime = 0;
    
    // API基础URL
    this.baseUrl = 'https://oapi.dingtalk.com';
    this.apiBaseUrl = 'https://api.dingtalk.com';
  }

  /**
   * 检查是否已配置企业内部应用
   */
  isConfigured() {
    return !!(this.appKey && this.appSecret);
  }

  /**
   * 获取access_token
   * 带缓存，token有效期内不重复请求
   */
  async getAccessToken() {
    // 检查缓存是否有效(提前5分钟刷新)
    if (this.accessToken && Date.now() < this.tokenExpireTime - 5 * 60 * 1000) {
      return this.accessToken;
    }

    if (!this.isConfigured()) {
      throw new Error('未配置钉钉企业内部应用凭证(DINGTALK_APP_KEY/DINGTALK_APP_SECRET)');
    }

    try {
      const url = `${this.baseUrl}/gettoken`;
      const response = await axios.get(url, {
        params: {
          appkey: this.appKey,
          appsecret: this.appSecret
        }
      });

      if (response.data.errcode !== 0) {
        throw new Error(`获取access_token失败: ${response.data.errmsg}`);
      }

      this.accessToken = response.data.access_token;
      // token有效期7200秒(2小时)
      this.tokenExpireTime = Date.now() + (response.data.expires_in || 7200) * 1000;
      
      logger.info('钉钉access_token获取成功');
      return this.accessToken;
    } catch (error) {
      logger.error('获取钉钉access_token失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送单聊消息给指定用户
   * 
   * @param {string} userId - 接收消息的用户ID
   * @param {string} content - 消息内容
   * @param {string} msgType - 消息类型: text, markdown
   */
  async sendPrivateMessage(userId, content, msgType = 'text') {
    try {
      const accessToken = await this.getAccessToken();
      
      // 使用批量发送接口（支持单用户）
      const url = `${this.apiBaseUrl}/v1.0/robot/oToMessages/batchSend`;
      
      // 钉钉企业内部应用使用 msgKey 而不是 msgtype
      let msgKey;
      let messageContent;
      
      if (msgType === 'markdown') {
        msgKey = 'sampleMarkdown';
        messageContent = JSON.stringify({
          title: 'Qoder CLI执行结果',
          text: content
        });
      } else {
        msgKey = 'sampleText';
        messageContent = JSON.stringify({
          content
        });
      }

      const data = {
        robotCode: this.robotCode,
        userIds: [userId],
        msgKey: msgKey,
        msgParam: messageContent
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-acs-dingtalk-access-token': accessToken
        }
      });

      if (response.data.errcode && response.data.errcode !== 0) {
        logger.error('发送单聊消息失败:', response.data);
        throw new Error(`发送消息失败: ${response.data.errmsg || JSON.stringify(response.data)}`);
      }

      logger.info(`单聊消息发送成功, 用户: ${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('发送单聊消息异常:', error.message, error.response?.data || {});
      throw error;
    }
  }

  /**
   * 发送群聊消息
   * 
   * @param {string} conversationId - 群聊ID (conversationId或openConversationId)
   * @param {string} content - 消息内容
   * @param {string} msgType - 消息类型: text, markdown
   * @param {object} at - @信息 {atUserIds: [], isAtAll: false}
   */
  async sendGroupMessage(conversationId, content, msgType = 'text', at = {}) {
    try {
      const accessToken = await this.getAccessToken();
      
      const url = `${this.apiBaseUrl}/v1.0/robot/groupMessages/send`;
      
      // 钉钉企业内部应用使用 msgKey 而不是 msgtype
      let msgKey;
      let messageContent;
      
      if (msgType === 'markdown') {
        msgKey = 'sampleMarkdown';
        messageContent = JSON.stringify({
          title: 'Qoder CLI执行结果',
          text: content
        });
      } else {
        msgKey = 'sampleText';
        messageContent = JSON.stringify({
          content
        });
      }

      const data = {
        robotCode: this.robotCode,
        openConversationId: conversationId,
        msgKey: msgKey,
        msgParam: messageContent
      };

      // 添加@信息
      if (at.atUserIds && at.atUserIds.length > 0) {
        data.atUserIds = at.atUserIds;
      }
      if (at.isAtAll) {
        data.isAtAll = true;
      }

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-acs-dingtalk-access-token': accessToken
        }
      });

      if (response.data.errcode && response.data.errcode !== 0) {
        logger.error('发送群聊消息失败:', response.data);
        throw new Error(`发送消息失败: ${response.data.errmsg || JSON.stringify(response.data)}`);
      }

      logger.info(`群聊消息发送成功, 群: ${conversationId}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('发送群聊消息异常:', error.message, error.response?.data || {});
      throw error;
    }
  }

  /**
   * 通用发送消息方法
   * 根据消息来源自动判断发送单聊还是群聊
   * 
   * @param {object} message - 原始消息对象
   * @param {string} content - 要发送的内容
   * @param {string} msgType - 消息类型
   */
  async sendMessage(message, content, msgType = 'text') {
    // 判断是群聊还是单聊
    // 支持多种字段名格式
    const conversationId = message.conversationId
      || message.openConversationId
      || message.chatId
      || '';
    const senderId = message.senderStaffId
      || message.senderId
      || message.staffId
      || '';
    const conversationType = message.conversationType;  // 1: 单聊, 2: 群聊

    logger.info('发送消息分析:', { conversationId, senderId, conversationType });

    // 如果是单聊（conversationType === 1 或没有conversationId），发送单聊消息
    // 注意：conversationType可能是字符串"1"或数字1
    if (conversationType == 1 || !conversationId) {
      if (senderId) {
        return this.sendPrivateMessage(senderId, content, msgType);
      } else {
        throw new Error('无法确定消息发送目标: 缺少senderId');
      }
    }
    
    // 群聊场景：优先发送单聊回复给用户
    // 因为企业内部应用机器人群聊回复需要特殊权限
    if (senderId) {
      logger.info('群聊消息，改为单聊回复给用户:', senderId);
      return this.sendPrivateMessage(senderId, content, msgType);
    }
    
    // 如果没有senderId但有conversationId，尝试发送群消息
    if (conversationId) {
      return this.sendGroupMessage(conversationId, content, msgType);
    }
    
    throw new Error('无法确定消息发送目标: 缺少conversationId和senderId');
  }
}

// 导出单例
module.exports = new DingTalkAPI();
