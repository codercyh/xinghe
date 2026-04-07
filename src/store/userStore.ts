'use client';

import { create } from 'zustand';
import type { BirthInfo, ZodiacData, BaziData, ChatMessage, MasterType } from '@/types/user';

interface HistoryItem {
  id: string;
  birthInfo: BirthInfo;
  zodiacData: ZodiacData;
  baziData: BaziData;
  createdAt: number;
}

type UserStore = {
  birthInfo: BirthInfo | null;
  setBirthInfo: (info: BirthInfo) => void;
  zodiacData: ZodiacData | null;
  baziData: BaziData | null;
  setZodiacData: (data: ZodiacData) => void;
  setBaziData: (data: BaziData) => void;
  currentMaster: MasterType;
  setCurrentMaster: (master: MasterType) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentView: 'home' | 'result';
  setCurrentView: (view: 'home' | 'result') => void;
  history: HistoryItem[];
  addHistory: (item: HistoryItem) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
};

let msgIdCounter = 0;

export const useUserStore = create<UserStore>()((set) => ({
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
      const exists = state.history.find(
        (h) =>
          h.birthInfo.year === item.birthInfo.year &&
          h.birthInfo.month === item.birthInfo.month &&
          h.birthInfo.day === item.birthInfo.day &&
          h.birthInfo.hour === item.birthInfo.hour
      );
      if (exists) {
        return {
          history: state.history.map((h) =>
            h.id === exists.id ? { ...item, id: exists.id } : h
          ),
        };
      }
      return { history: [item, ...state.history].slice(0, 20) };
    }),
  removeHistory: (id) =>
    set((state) => ({
      history: state.history.filter((h) => h.id !== id),
    })),
  clearHistory: () => set({ history: [] }),
}));

export type { HistoryItem };
