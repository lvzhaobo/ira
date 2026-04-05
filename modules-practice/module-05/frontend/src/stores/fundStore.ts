import { create } from 'zustand';
import type { FundBasicInfo, FundSearchResult, FundListResponse } from '@/types/fund';
import { searchFunds, getFundBasicInfo, getFundList } from '@/services/fundService';

interface FundState {
  // 搜索相关
  searchKeyword: string;
  searchResults: FundSearchResult[];
  isSearching: boolean;
  
  // 基金列表
  fundList: FundSearchResult[];
  fundListTotal: number;
  fundListPage: number;
  fundListPageSize: number;
  isLoadingFundList: boolean;
  
  // 基金详情
  currentFund: FundBasicInfo | null;
  isLoadingFund: boolean;
  
  // Actions
  setSearchKeyword: (keyword: string) => void;
  searchFunds: () => Promise<void>;
  loadFundList: (page?: number, page_size?: number) => Promise<void>;
  loadFundDetail: (fundCode: string) => Promise<void>;
  clearCurrentFund: () => void;
}

export const useFundStore = create<FundState>((set, get) => ({
  // 初始状态
  searchKeyword: '',
  searchResults: [],
  isSearching: false,
  
  fundList: [],
  fundListTotal: 0,
  fundListPage: 1,
  fundListPageSize: 20,
  isLoadingFundList: false,
  
  currentFund: null,
  isLoadingFund: false,
  
  // Actions
  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword });
  },
  
  searchFunds: async () => {
    const keyword = get().searchKeyword;
    if (!keyword.trim()) return;
    
    set({ isSearching: true });
    try {
      const response = await searchFunds(keyword);
      set({ searchResults: response.data.list });
    } catch (error) {
      console.error('搜索基金失败:', error);
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },
  
  loadFundList: async (page: number = 1, page_size: number = 20) => {
    set({ isLoadingFundList: true, fundListPage: page, fundListPageSize: page_size });
    try {
      const response = await getFundList(page, page_size);
      set({ 
        fundList: response.data.list,
        fundListTotal: response.data.total,
        fundListPage: response.data.page,
        fundListPageSize: response.data.page_size
      });
    } catch (error) {
      console.error('加载基金列表失败:', error);
      set({ fundList: [] });
    } finally {
      set({ isLoadingFundList: false });
    }
  },
  
  loadFundDetail: async (fundCode: string) => {
    set({ isLoadingFund: true });
    try {
      const response = await getFundBasicInfo(fundCode);
      set({ currentFund: response.data });
    } catch (error) {
      console.error('加载基金详情失败:', error);
      set({ currentFund: null });
    } finally {
      set({ isLoadingFund: false });
    }
  },
  
  clearCurrentFund: () => {
    set({ currentFund: null });
  },
}));
