/**
 * 基础测试脚本
 * 用途: 验证核心功能是否正常
 */

const assert = require('assert');
const messageFormatter = require('../src/modules/messageFormatter');
const taskManager = require('../src/modules/taskManager');

console.log('=== 钉钉-Qoder桥接服务 基础测试 ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  错误: ${error.message}`);
    failed++;
  }
}

// 测试消息格式化器
console.log('\n1. 消息格式化测试');

test('格式化Qoder输出', () => {
  const output = messageFormatter.formatQoderOutput(
    'CPU使用率: 23.5%',
    'task-123',
    5000
  );
  assert(output.includes('Qoder CLI执行完成'));
  assert(output.includes('task-123'));
  assert(output.includes('5秒'));
});

test('格式化帮助信息', () => {
  const help = messageFormatter.getHelpMessage();
  assert(help.includes('/qoder'));
  assert(help.includes('/status'));
  assert(help.includes('/help'));
});

test('格式化任务列表(空)', () => {
  const result = messageFormatter.formatTaskList([]);
  assert(result.success === true);
  assert(result.message.includes('没有正在执行的任务'));
});

// 测试任务管理器
console.log('\n2. 任务管理测试');

test('注册任务', () => {
  taskManager.registerTask('test-1', '测试任务');
  const task = taskManager.getTask('test-1');
  assert(task !== undefined);
  assert(task.status === 'running');
});

test('完成任务', () => {
  taskManager.completeTask('test-1', '输出结果', 3000);
  const task = taskManager.getTask('test-1');
  assert(task.status === 'completed');
  assert(task.output === '输出结果');
});

test('获取活跃任务', () => {
  taskManager.registerTask('test-2', '运行中的任务');
  const active = taskManager.getActiveTasks();
  assert(active.length >= 1);
});

test('取消任务', () => {
  taskManager.registerTask('test-3', '待取消任务');
  const success = taskManager.cancelTask('test-3');
  assert(success === true);
  const task = taskManager.getTask('test-3');
  assert(task.status === 'cancelled');
});

test('获取任务统计', () => {
  const stats = taskManager.getStats();
  assert(stats.total >= 3);
  assert(stats.completed >= 1);
  assert(stats.cancelled >= 1);
});

// 测试结果
console.log('\n=== 测试结果 ===');
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✓ 所有测试通过!');
  process.exit(0);
}
