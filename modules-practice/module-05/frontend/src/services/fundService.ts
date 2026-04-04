import { request } from './api';
import type { FundBasicInfo, FundSearchResult, FundNavHistory, FundHolding, FundManager } from '@/types/fund';

// 搜索基金
export const searchFunds = (keyword: string) => {
  return request.get<FundSearchResult[]>('/fund/search', {
    params: { keyword },
  });
};

// 获取基金基本信息
export const getFundBasicInfo = (fundCode: string) => {
  return request.get<FundBasicInfo>(`/fund/${fundCode}/basic`);
};

// 获取基金净值历史
export const getFundNavHistory = (fundCode: string, startDate?: string, endDate?: string) => {
  return request.get<FundNavHistory[]>(`/fund/${fundCode}/nav`, {
    params: { startDate, endDate },
  });
};

// 获取基金持仓
export const getFundHoldings = (fundCode: string) => {
  return request.get<FundHolding[]>(`/fund/${fundCode}/holdings`);
};

// 获取基金经理信息
export const getFundManager = (fundCode: string) => {
  return request.get<FundManager>(`/fund/${fundCode}/manager`);
};
