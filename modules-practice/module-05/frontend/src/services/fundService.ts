import { request } from './api';
import type { FundBasicInfo, FundSearchResult, FundNavHistory, FundHolding, FundManager, FundListResponse } from '@/types/fund';

// 获取基金列表（分页）
export const getFundList = (page: number = 1, page_size: number = 20, fund_type?: string) => {
  return request.get<FundListResponse>('/fund/list', {
    params: { page, page_size, fund_type },
  });
};

// 搜索基金
export const searchFunds = (keyword: string, page: number = 1, page_size: number = 10) => {
  return request.get<FundListResponse>('/fund/search', {
    params: { keyword, page, page_size },
  });
};

// 获取基金基本信息
export const getFundBasicInfo = (fundCode: string) => {
  return request.get<FundBasicInfo>(`/fund/${fundCode}`);
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
