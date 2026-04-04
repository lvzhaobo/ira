import { request } from './api';

// 获取报告列表
export const getReports = (page: number = 1, pageSize: number = 20) => {
  return request.get('/reports', {
    params: { page, pageSize },
  });
};

// 获取报告详情
export const getReportDetail = (reportId: string) => {
  return request.get(`/reports/${reportId}`);
};

// 下载报告
export const downloadReport = (reportId: string, format: 'pdf' | 'word' = 'pdf') => {
  return request.get(`/reports/${reportId}/download`, {
    params: { format },
    responseType: 'blob',
  });
};

// 删除报告
export const deleteReport = (reportId: string) => {
  return request.delete(`/reports/${reportId}`);
};
