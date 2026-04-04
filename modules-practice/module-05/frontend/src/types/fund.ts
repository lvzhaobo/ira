// 基金基本信息
export interface FundBasicInfo {
  fundCode: string;           // 基金代码
  fundName: string;           // 基金名称
  fundType: string;           // 基金类型
  nav: number;                // 最新净值
  navDate: string;            // 净值日期
  dailyGrowth: number;        // 日增长率
  manager: string;            // 基金经理
  fundCompany: string;        // 基金公司
  scale: number;              // 基金规模（亿元）
 成立Date: string;            // 成立日期
}

// 基金搜索结果
export interface FundSearchResult {
  fundCode: string;
  fundName: string;
  fundType: string;
}

// 基金净值历史
export interface FundNavHistory {
  date: string;
  nav: number;
  accumulatedNav: number;
  dailyGrowth: number;
}

// 基金持仓
export interface FundHolding {
  stockCode: string;
  stockName: string;
  proportion: number;         // 持仓比例
  change: number;             // 较上期变化
}

// 基金经理信息
export interface FundManager {
  name: string;
  tenure: number;             // 任职年限
  returnRate: number;         // 任职回报率
  manageFunds: number;        // 管理基金数
  biography: string;          // 简介
}
