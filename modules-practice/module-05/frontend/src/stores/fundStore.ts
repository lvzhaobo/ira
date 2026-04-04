import { create } from 'zustand';
import type { FundBasicInfo, FundSearchResult } from '@/types/fund';
import { searchFunds, getFundBasicInfo } from '@/services/fundService';

interface FundState {
  // 搜索相关
  searchKeyword: string;
  searchResults: FundSearchResult[];
  isSearching: boolean;
  
  // 基金详情
  currentFund: FundBasicInfo | null;
  isLoadingFund: boolean;
  
  // Actions
  setSearchKeyword: (keyword: string) => void;
  searchFunds: () => Promise<void>;
  loadFundDetail: (fundCode: string) => Promise<void>;
  clearCurrentFund: () => void;
}

export const useFundStore = create<FundState>((set, get) => ({
  // 初始状态
  searchKeyword: '',
  searchResults: [],
  isSearching: false,
  
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
      set({ searchResults: response.data });
    } catch (error) {
      console.error('搜索基金失败:', error);
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
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
