// 基金基本信息
export interface FundBasicInfo {
  id: number;
  code: string;
  name: string;
  fund_type: string;
  manager_name?: string;
  establish_date?: string;
  scale?: number;
  status: string;
  updated_at?: string;
  latest_nav?: {
    date: string;
    nav: number;
    accum_nav: number;
    daily_return: number;
  };
}

// 基金搜索结果
export interface FundSearchResult {
  id: number;
  code: string;
  name: string;
  fund_type: string;
}

// 基金列表响应（分页）
export interface FundListResponse {
  list: FundSearchResult[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// 基金净值历史
export interface FundNavHistory {
  id: number;
  fund_code: string;
  date: string;
  nav: number;
  accum_nav: number;
  daily_return: number;
}

// 基金持仓
export interface FundHolding {
  id: number;
  fund_code: string;
  stock_code: string;
  stock_name: string;
  holding_ratio: number;
  holding_shares: number;
  market_value: number;
  report_date: string;
}

// 基金经理信息
export interface FundManager {
  id: number;
  name: string;
  gender: string;
  education: string;
  experience_years: number;
  biography: string;
  start_date: string;
  total_scale: number;
  status: string;
}
