import { create } from 'zustand';
import type { 
  AnalysisTask, 
  AnalysisDimension, 
  AgentMessage,
  HistoryRecord 
} from '@/types/analysis';
import { 
  createAnalysisTask, 
  getAnalysisTask, 
  getAnalysisTasks,
  cancelAnalysisTask 
} from '@/services/analysisService';

interface AnalysisState {
  // 当前分析任务
  currentTask: AnalysisTask | null;
  isAnalyzing: boolean;
  
  // 历史记录
  historyRecords: HistoryRecord[];
  isLoadingHistory: boolean;
  
  // Agent对话
  messages: AgentMessage[];
  
  // 分析维度选择
  selectedDimensions: AnalysisDimension[];
  
  // Actions
  setCurrentTask: (task: AnalysisTask | null) => void;
  startAnalysis: (fundCode: string, fundName: string, dimensions?: AnalysisDimension[]) => Promise<void>;
  pollTaskStatus: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  addMessage: (message: AgentMessage) => void;
  clearMessages: () => void;
  setSelectedDimensions: (dimensions: AnalysisDimension[]) => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  // 初始状�?
  currentTask: null,
  isAnalyzing: false,
  
  historyRecords: [],
  isLoadingHistory: false,
  
  messages: [],
  
  selectedDimensions: ['performance', 'risk', 'holding', 'manager', 'market'],
  
  // Actions
  setCurrentTask: (task: AnalysisTask | null) => {
    set({ currentTask: task });
  },
  
  startAnalysis: async (fundCode: string, _fundName: string, dimensions?: AnalysisDimension[]) => {
    const selectedDims = dimensions || get().selectedDimensions;
    
    set({ isAnalyzing: true, messages: [] });
    try {
      const response = await createAnalysisTask(fundCode, selectedDims);
      const task = response.data;
      set({ currentTask: task });
      
      // 开始轮询任务状�?
      get().pollTaskStatus(task.id.toString());
    } catch (error) {
      console.error('启动分析任务失败:', error);
      set({ isAnalyzing: false });
    }
  },
  
  pollTaskStatus: async (taskId: string) => {
    const poll = async () => {
      try {
        const response = await getAnalysisTask(taskId);
        const task = response.data;
        
        set({ currentTask: task });
        
        // 如果有新消息，添加到消息列表
        if (task.messages && task.messages.length > 0) {
          const currentMessages = get().messages;
          const newMessages = task.messages.slice(currentMessages.length);
          if (newMessages.length > 0) {
            set({ messages: [...currentMessages, ...newMessages] });
          }
        }
        
        // 如果任务完成或失败，停止轮询
        if (task.status === 'completed' || task.status === 'failed') {
          set({ isAnalyzing: false });
          return;
        }
        
        // 继续轮询
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('轮询任务状态失�?', error);
        set({ isAnalyzing: false });
      }
    };
    
    poll();
  },
  
  cancelTask: async (taskId: string) => {
    try {
      await cancelAnalysisTask(taskId);
      set({ currentTask: null, isAnalyzing: false });
    } catch (error) {
      console.error('取消任务失败:', error);
    }
  },
  
  loadHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const response = await getAnalysisTasks();
      // 后端返回格式: { code: 0, data: { list: [], total: 0 } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = response.data as any;
      const records = data?.list || data || [];
      set({ historyRecords: Array.isArray(records) ? records : [] });
    } catch (error) {
      console.error('加载历史记录失败:', error);
      set({ historyRecords: [] });
    } finally {
      set({ isLoadingHistory: false });
    }
  },
  
  addMessage: (message: AgentMessage) => {
    const messages = get().messages;
    set({ messages: [...messages, message] });
  },
  
  clearMessages: () => {
    set({ messages: [] });
  },
  
  setSelectedDimensions: (dimensions: AnalysisDimension[]) => {
    set({ selectedDimensions: dimensions });
  },
}));

