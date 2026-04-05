/**
 * Qoder CLI执行器模块
 * 
 * 负责:
 * 1. 执行Qoder CLI命令
 * 2. 管理执行超时
 * 3. 捕获和处理输出
 * 4. 任务状态管理
 */

const { exec, spawn, execFile } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const taskManager = require('./taskManager');
const fs = require('fs');

// 模块加载时诊断
logger.info(`[QoderExecutor] 模块加载`);
logger.info(`[QoderExecutor] spawn type: ${typeof spawn}`);
logger.info(`[QoderExecutor] execFile type: ${typeof execFile}`);
logger.info(`[QoderExecutor] /usr/bin/bash exists: ${fs.existsSync('/usr/bin/bash')}`);
logger.info(`[QoderExecutor] CWD: ${process.cwd()}`);

class QoderExecutor {
  constructor() {
    this.isQoderInstalled = false;
    this.checkQoderInstallation();
  }

  /**
   * 检查Qoder CLI是否已安装
   */
  async checkQoderInstallation() {
    try {
      const { stdout } = await this.execPromise('qodercli --version');
      this.isQoderInstalled = true;
      logger.info(`Qoder CLI已安装: ${stdout.trim()}`);
    } catch (error) {
      this.isQoderInstalled = false;
      logger.warn('Qoder CLI未安装或不在PATH中');
    }
  }

  /**
   * 执行Promise封装 - 使用execFile来避免spawn问题
   */
  execPromise(command, options = {}) {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin:/root/bin'
      };

      logger.info(`[execPromise] 执行命令: ${command.substring(0, 80)}...`);

      // 使用execFile直接执行bash命令
      execFile('/usr/bin/bash', ['-c', command], {
        cwd: options.cwd || process.cwd(),
        env: env,
        maxBuffer: options.maxBuffer || 1024 * 1024 * 50,
        timeout: options.timeout
      }, (error, stdout, stderr) => {
        if (error) {
          logger.error(`[execPromise] 错误: ${error.message}, code=${error.code}, errno=${error.errno}`);
          reject(error);
        } else {
          logger.info(`[execPromise] 成功`);
          resolve({ stdout, stderr });
        }
      });
    });
  }

  /**
   * 执行Qoder CLI命令
   * 
   * @param {string} prompt - 用户输入的prompt
   * @param {object} options - 执行选项
   * @returns {object} 执行结果
   */
  async execute(prompt, options = {}) {
    const taskId = `task-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    // 注册任务
    taskManager.registerTask(taskId, prompt);

    const {
      maxTurns = 15,
      timeout = 300000, // 5分钟
      workdir = process.cwd()
    } = options;

    logger.info(`开始执行Qoder CLI任务 [${taskId}]: ${prompt}`);

    const startTime = Date.now();

    // 构建Qoder CLI命令
    const qoderCommand = [
      'qodercli',
      '-p', `"${prompt.replace(/"/g, '\\"')}"`,
      '--max-turns', maxTurns,
      '--yolo', // 跳过权限确认,自动化模式
      '-w', workdir
    ].join(' ');

    logger.debug(`执行命令: ${qoderCommand}`);

    try {
      // 设置超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Qoder CLI执行超时(${timeout}ms)`));
        }, timeout);
      });

      // 执行命令
      const execPromise = this.execPromise(qoderCommand, {
        maxBuffer: 1024 * 1024 * 50, // 50MB
        cwd: workdir,
        env: {
          ...process.env,
          QODER_PERSONAL_ACCESS_TOKEN: process.env.QODER_PERSONAL_ACCESS_TOKEN
        }
      });

      // 竞争执行和超时
      const result = await Promise.race([execPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      const output = result.stdout.trim();

      logger.info(`任务 [${taskId}] 执行完成,耗时: ${duration}ms`);

      // 更新任务状态
      taskManager.completeTask(taskId, output, duration);

      return {
        taskId,
        success: true,
        output,
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error.message || error.stderr || '未知错误';

      logger.error(`任务 [${taskId}] 执行失败: ${errorMessage}`);

      // 更新任务状态
      taskManager.failTask(taskId, errorMessage, duration);

      throw new Error(errorMessage);
    }
  }

  /**
   * 获取Qoder CLI状态
   */
  async getStatus() {
    try {
      // 检查Qoder CLI版本
      const versionResult = await this.execPromise('qodercli --version');
      const version = versionResult.stdout.trim();

      // 检查Node.js版本
      const nodeResult = await this.execPromise('node --version');
      const nodeVersion = nodeResult.stdout.trim();

      // 获取系统信息
      const os = require('os');
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
        freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
        uptime: `${Math.round(os.uptime() / 3600)}小时`
      };

      return {
        qoderInstalled: true,
        qoderVersion: version,
        nodeVersion,
        systemInfo,
        activeTasks: taskManager.getActiveTasks().length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        qoderInstalled: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 执行系统命令(用于Qoder CLI的Bash工具)
   */
  async executeBashCommand(command, options = {}) {
    const { timeout = 60000, workdir = process.cwd() } = options;

    logger.debug(`执行Bash命令: ${command}`);

    try {
      const result = await this.execPromise(command, {
        timeout,
        maxBuffer: 1024 * 1024 * 10,
        cwd: workdir
      });

      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 导出单例
module.exports = new QoderExecutor();
