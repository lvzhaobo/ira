// 分析任务状态
export type AnalysisTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

// 分析维度
export type AnalysisDimension = 
  | 'performance'    // 业绩分析
  | 'risk'           // 风险评估
  | 'holding'        // 持仓分析
  | 'manager'        // 经理评估
  | 'market';        // 市场分析

// Agent消息
export interface AgentMessage {
  id: string;
  agentName: string;
  agentType: AnalysisDimension;
  content: string;
  timestamp: string;
  status: 'thinking' | 'responding' | 'completed';
}

// 分析结果 - 业绩分析
export interface PerformanceAnalysis {
  dimension: 'performance';
  summary: string;
  returns: {
    oneMonth: number;
    threeMonths: number;
    sixMonths: number;
    oneYear: number;
    threeYears: number;
  };
  ranking: number;            // 同类排名
  totalFunds: number;         // 同类总数
  chartData: Array<{
    date: string;
    fundValue: number;
    benchmarkValue: number;
  }>;
}

// 分析结果 - 风险评估
export interface RiskAnalysis {
  dimension: 'risk';
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  metrics: {
    volatility: number;       // 波动率
    sharpeRatio: number;      // 夏普比率
    maxDrawdown: number;      // 最大回撤
    beta: number;             // Beta系数
  };
}

// 分析结果 - 持仓分析
export interface HoldingAnalysis {
  dimension: 'holding';
  summary: string;
  topHoldings: Array<{
    stockName: string;
    proportion: number;
    industry: string;
  }>;
  industryDistribution: Array<{
    industry: string;
    proportion: number;
  }>;
  concentration: number;      // 持仓集中度
}

// 分析结果 - 经理评估
export interface ManagerAnalysis {
  dimension: 'manager';
  summary: string;
  managerName: string;
  tenure: number;
  experience: number;         // 从业年限
  bestFund: string;           // 最佳表现基金
  investmentStyle: string;    // 投资风格
  rating: number;             // 评分 1-5
}

// 分析结果 - 市场分析
export interface MarketAnalysis {
  dimension: 'market';
  summary: string;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  keyFactors: string[];
  opportunities: string[];
  risks: string[];
}

// 综合分析结果
export type AnalysisResult = 
  | PerformanceAnalysis
  | RiskAnalysis
  | HoldingAnalysis
  | ManagerAnalysis
  | MarketAnalysis;

// 分析任务（匹配后端返回格式）
export interface AnalysisTask {
  id: number;              // 后端返回的任务ID
  fund_code: string;       // 基金代码
  task_name?: string;      // 任务名称
  task_type?: string;      // 任务类型
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;        // 进度 0-100
  params?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  // 以下字段为前端使用
  taskId?: string;
  fundCode?: string;
  fundName?: string;
  currentAgent?: string;
  results?: AnalysisResult[];
  messages?: AgentMessage[];
  createdAt?: string;
  completedAt?: string;
}

// 历史记录
export interface HistoryRecord {
  id: string;
  fundCode: string;
  fundName: string;
  analysisType: AnalysisDimension[];
  status: AnalysisTaskStatus;
  createdAt: string;
  completedAt?: string;
}
