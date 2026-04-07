'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BirthInfo, ZodiacData, BaziData, ChatMessage, MasterType } from '@/types/user';

interface UserStore {
  // 出生信息
  birthInfo: BirthInfo | null;
  setBirthInfo: (info: BirthInfo) => void;

  // 计算结果
  zodiacData: ZodiacData | null;
  baziData: BaziData | null;
  setZodiacData: (data: ZodiacData) => void;
  setBaziData: (data: BaziData) => void;

  // AI 对话
  currentMaster: MasterType;
  setCurrentMaster: (master: MasterType) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;

  // UI 状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentView: 'home' | 'result';
  setCurrentView: (view: 'home' | 'result') => void;

  // 历史记录列表
  history: HistoryItem[];
  addHistory: (item: HistoryItem) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
}

let msgIdCounter = 0;

export interface HistoryItem {
  id: string;
  birthInfo: BirthInfo;
  zodiacData: ZodiacData;
  baziData: BaziData;
  createdAt: number;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      birthInfo: null,
      setBirthInfo: (info) => set({ birthInfo: info }),

      zodiacData: null,
      baziData: null,
      setZodiacData: (data) => set({ zodiacData: data }),
      setBaziData: (data) => set({ baziData: data }),

      currentMaster: 'mínglǐ',
      setCurrentMaster: (master) => set({ currentMaster: master }),

      chatMessages: [],
      addChatMessage: (msg) =>
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            { ...msg, id: `msg-${++msgIdCounter}`, timestamp: Date.now() },
          ],
        })),
      clearChat: () => set({ chatMessages: [] }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      currentView: 'home',
      setCurrentView: (view) => set({ currentView: view }),

      history: [],
      addHistory: (item) =>
        set((state) => {
          // 避免重复（同一人同一天只存一条，取最新）
          const exists = state.history.find(
            (h) =>
              h.birthInfo.year === item.birthInfo.year &&
              h.birthInfo.month === item.birthInfo.month &&
              h.birthInfo.day === item.birthInfo.day &&
              h.birthInfo.hour === item.birthInfo.hour
          );
          if (exists) {
            // 更新已有记录
            return {
              history: state.history.map((h) =>
                h.id === exists.id ? { ...item, id: exists.id } : h
              ),
            };
          }
          return { history: [item, ...state.history].slice(0, 20) }; // 最多存20条
        }),
      removeHistory: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'xinghe-storage',
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
);
