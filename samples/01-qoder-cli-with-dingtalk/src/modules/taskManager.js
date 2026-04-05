/**
 * 任务管理器模块
 * 
 * 负责:
 * 1. 注册和跟踪任务
 * 2. 管理任务状态
 * 3. 提供任务查询和取消功能
 */

const logger = require('../utils/logger');

class TaskManager {
  constructor() {
    this.tasks = new Map();
    this.maxHistory = 100; // 保留最近100个任务记录
  }

  /**
   * 注册新任务
   */
  registerTask(taskId, prompt) {
    this.tasks.set(taskId, {
      id: taskId,
      prompt,
      status: 'running',
      startTime: Date.now(),
      endTime: null,
      duration: null,
      output: null,
      error: null
    });

    logger.info(`任务已注册: ${taskId}`);
  }

  /**
   * 标记任务完成
   */
  completeTask(taskId, output, duration) {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.warn(`任务 ${taskId} 不存在,无法标记完成`);
      return;
    }

    task.status = 'completed';
    task.endTime = Date.now();
    task.duration = duration;
    task.output = output;

    logger.info(`任务 ${taskId} 已完成`);
    this.cleanupOldTasks();
  }

  /**
   * 标记任务失败
   */
  failTask(taskId, error, duration) {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.warn(`任务 ${taskId} 不存在,无法标记失败`);
      return;
    }

    task.status = 'failed';
    task.endTime = Date.now();
    task.duration = duration;
    task.error = error;

    logger.error(`任务 ${taskId} 失败: ${error}`);
    this.cleanupOldTasks();
  }

  /**
   * 取消任务
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status === 'running') {
      task.status = 'cancelled';
      task.endTime = Date.now();
      logger.info(`任务 ${taskId} 已取消`);
      return true;
    }

    return false;
  }

  /**
   * 获取任务信息
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * 获取活跃任务列表
   */
  getActiveTasks() {
    const activeTasks = [];
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'running') {
        activeTasks.push({
          id: task.id,
          prompt: task.prompt,
          startTime: new Date(task.startTime).toLocaleString('zh-CN'),
          duration: `${Math.round((Date.now() - task.startTime) / 1000)}秒`
        });
      }
    }
    return activeTasks;
  }

  /**
   * 获取任务历史
   */
  getTaskHistory(limit = 10) {
    const allTasks = Array.from(this.tasks.values())
      .filter(task => task.status !== 'running')
      .sort((a, b) => b.endTime - a.endTime)
      .slice(0, limit);

    return allTasks.map(task => ({
      id: task.id,
      prompt: task.prompt,
      status: task.status,
      startTime: new Date(task.startTime).toLocaleString('zh-CN'),
      endTime: task.endTime ? new Date(task.endTime).toLocaleString('zh-CN') : null,
      duration: task.duration ? `${Math.round(task.duration / 1000)}秒` : null
    }));
  }

  /**
   * 清理旧任务
   */
  cleanupOldTasks() {
    if (this.tasks.size > this.maxHistory) {
      const sortedTasks = Array.from(this.tasks.entries())
        .filter(([_, task]) => task.status !== 'running')
        .sort((a, b) => a.endTime - b.endTime);

      const toRemove = sortedTasks.slice(0, this.tasks.size - this.maxHistory);
      for (const [id] of toRemove) {
        this.tasks.delete(id);
      }

      logger.debug(`清理旧任务,当前任务数: ${this.tasks.size}`);
    }
  }

  /**
   * 获取任务统计
   */
  getStats() {
    let total = 0;
    let running = 0;
    let completed = 0;
    let failed = 0;
    let cancelled = 0;

    for (const task of this.tasks.values()) {
      total++;
      switch (task.status) {
        case 'running': running++; break;
        case 'completed': completed++; break;
        case 'failed': failed++; break;
        case 'cancelled': cancelled++; break;
      }
    }

    return {
      total,
      running,
      completed,
      failed,
      cancelled,
      successRate: total > 0 ? ((completed / total) * 100).toFixed(2) + '%' : '0%'
    };
  }
}

// 导出单例
module.exports = new TaskManager();
