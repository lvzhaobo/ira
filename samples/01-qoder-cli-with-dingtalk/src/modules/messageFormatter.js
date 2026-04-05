/**
 * 钉钉消息格式化模块
 * 
 * 负责:
 * 1. 格式化Qoder CLI输出为钉钉Markdown
 * 2. 生成帮助信息
 * 3. 格式化任务列表和状态
 */

class MessageFormatter {
  /**
   * 格式化Qoder CLI输出为钉钉Markdown
   */
  formatQoderOutput(output, taskId, duration) {
    // 限制输出长度(钉钉消息限制)
    const maxLength = 15000;
    let formattedOutput = output;

    if (output.length > maxLength) {
      formattedOutput = output.substring(0, maxLength) + '\n\n... [输出过长,已截断]';
    }

    // 转义Markdown特殊字符
    formattedOutput = this.escapeMarkdown(formattedOutput);

    const message = `## ✅ Qoder CLI执行完成

**任务ID**: \`${taskId}\`
**执行耗时**: ${Math.round(duration / 1000)}秒
**完成时间**: ${new Date().toLocaleString('zh-CN')}

---

### 执行结果

\`\`\`
${formattedOutput}
\`\`\`

---

💡 提示: 如需查看更多详细信息,请查看服务器日志`;

    return message;
  }

  /**
   * 格式化状态信息
   */
  formatStatus(status) {
    if (!status.qoderInstalled) {
      return {
        success: false,
        message: `❌ Qoder CLI未安装\n\n错误: ${status.error || '未知错误'}`
      };
    }

    const { systemInfo } = status;
    const message = `## 🤖 Qoder CLI服务状态

**Qoder版本**: ${status.qoderVersion}
**Node.js版本**: ${status.nodeVersion}
**活跃任务**: ${status.activeTasks}

### 系统信息

- **平台**: ${systemInfo.platform} ${systemInfo.arch}
- **CPU**: ${systemInfo.cpus}核
- **内存**: ${systemInfo.freeMemory} / ${systemInfo.totalMemory}
- **运行时间**: ${systemInfo.uptime}

---

✅ 服务运行正常`;

    return {
      success: true,
      message
    };
  }

  /**
   * 格式化任务列表
   */
  formatTaskList(tasks) {
    if (tasks.length === 0) {
      return {
        success: true,
        message: '📋 当前没有正在执行的任务'
      };
    }

    let taskList = tasks.map(task => {
      return `- **${task.id}**\n  - 任务: ${task.prompt}\n  - 开始: ${task.startTime}\n  - 已运行: ${task.duration}`;
    }).join('\n\n');

    const message = `## 📋 正在执行的任务

共 ${tasks.length} 个任务

---

${taskList}`;

    return {
      success: true,
      message
    };
  }

  /**
   * 获取帮助信息
   */
  getHelpMessage() {
    return `## 🤖 Qoder CLI钉钉机器人使用指南

### 可用指令

**1. 执行Qoder CLI任务**
\`/qoder <指令>\`

示例:
\`/qoder 查看当前系统CPU使用率\`
\`/qoder 列出所有运行中的进程\`
\`/qoder 检查磁盘空间使用情况\`

**2. 查看服务状态**
\`/status\`

查看Qoder CLI版本、系统信息等

**3. 查看任务列表**
\`/tasks\`

查看正在执行的任务

**4. 取消任务**
\`/cancel <任务ID>\`

取消正在执行的任务

**5. 查看帮助**
\`/help\`

显示此帮助信息

---

### 使用场景示例

📊 **系统监控**
\`/qoder 查询系统CPU、内存、磁盘使用情况\`

🔍 **进程管理**
\`/qoder 列出占用内存最多的10个进程\`

📁 **文件操作**
\`/qoder 查找当前目录下大于100MB的文件\`

🌐 **网络诊断**
\`/qoder 检查端口8080是否被占用\`

🔧 **应用管理**
\`/qoder 重启/opt/app下的node应用\`

---

### 注意事项

⚠️ Qoder CLI会自动执行命令,请谨慎使用
⚠️ 复杂任务可能需要较长时间,请耐心等待
⚠️ 输出结果超过限制时会被截断

---

💡 提示: 如有问题,请联系系统管理员`;
  }

  /**
   * 格式化错误消息
   */
  formatError(error, taskId) {
    const message = `## ❌ 任务执行失败

**任务ID**: \`${taskId || 'unknown'}\`
**错误时间**: ${new Date().toLocaleString('zh-CN')}

### 错误信息

\`\`\`
${this.escapeMarkdown(error.message || error.toString())}
\`\`\`

---

💡 建议:
1. 检查指令是否正确
2. 查看服务器日志获取详细信息
3. 联系系统管理员`;

    return message;
  }

  /**
   * 转义Markdown特殊字符
   */
  escapeMarkdown(text) {
    // 钉钉Markdown需要转义某些字符
    return text
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }
}

// 导出单例
module.exports = new MessageFormatter();
