import { request } from './api';
import type { AnalysisTask, AnalysisDimension, HistoryRecord } from '@/types/analysis';

// 创建分析任务
export const createAnalysisTask = (
  fundCode: string,
  dimensions: AnalysisDimension[] = ['performance', 'risk', 'holding', 'manager', 'market']
) => {
  return request.post<AnalysisTask>('/analysis/create', {
    fundCode,
    dimensions,
  });
};

// 获取分析任务状态
export const getAnalysisTask = (taskId: string) => {
  return request.get<AnalysisTask>(`/analysis/${taskId}`);
};

// 获取分析任务列表
export const getAnalysisTasks = (page: number = 1, pageSize: number = 20) => {
  return request.get<HistoryRecord[]>('/analysis/tasks', {
    params: { page, pageSize },
  });
};

// 取消分析任务
export const cancelAnalysisTask = (taskId: string) => {
  return request.post(`/analysis/${taskId}/cancel`);
};

// 获取分析结果
export const getAnalysisResult = (taskId: string) => {
  return request.get<AnalysisTask>(`/analysis/${taskId}/result`);
};
