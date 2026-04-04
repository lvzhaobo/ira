// API 基础路径
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// 分析维度配置
export const ANALYSIS_DIMENSIONS = [
  { key: 'performance', name: '业绩分析', color: 'blue' },
  { key: 'risk', name: '风险评估', color: 'red' },
  { key: 'holding', name: '持仓分析', color: 'green' },
  { key: 'manager', name: '经理评估', color: 'orange' },
  { key: 'market', name: '市场分析', color: 'purple' },
] as const;

// Agent 类型映射
export const AGENT_TYPE_MAP: Record<string, string> = {
  performance: '业绩分析Agent',
  risk: '风险评估Agent',
  holding: '持仓分析Agent',
  manager: '经理评估Agent',
  market: '市场分析Agent',
};

// 分页配置
export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
};

// 轮询间隔（毫秒）
export const POLLING_INTERVAL = 2000;

// 基金类型映射
export const FUND_TYPE_MAP: Record<string, string> = {
  '股票型': 'blue',
  '混合型': 'green',
  '债券型': 'orange',
  '指数型': 'purple',
  'QDII': 'red',
  '货币型': 'cyan',
};
