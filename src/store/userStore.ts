'use client';

import { create } from 'zustand';
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
}

let msgIdCounter = 0;

export const useUserStore = create<UserStore>((set) => ({
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
}));
