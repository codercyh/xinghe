// 用户出生信息
export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  gender: 'male' | 'female';
  timezone: string;
}

// 星座解读详细数据
export interface ZodiacDetail {
  element_trait: string;
  personality: string[];
  strength: string[];
  weakness: string[];
  relationship: string;
  career: string;
  hidden_self: string;
  growth: string[];
  stress_signal: string;
  compatible: string[];
}

// 星座信息
export interface ZodiacSign {
  name: string;
  symbol: string;
  start: string | number[];
  end: string | number[];
  trait: string;
  lunarDate?: string;
  detail?: ZodiacDetail;
  element?: string;
  modality?: string;
}

export interface ZodiacData {
  sun: ZodiacSign;
  moon: ZodiacSign & { lunarDate?: string };
  rising: ZodiacSign;
}

// 八字四柱
export interface Pillar {
  gan: string;
  zhi: string;
}

export interface BaziData {
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  wuxing: {
    metal: number;
    wood: number;
    water: number;
    fire: number;
    earth: number;
  };
  dayMaster: string;
  dayStrength: 'strong' | 'weak' | 'neutral';
  dayun: {
    summary: string;
    nextDecade: string;
  };
  lunarInfo: {
    lunarYear: number;
    lunarMonth: number;
    lunarDay: number;
    isLeapMonth: boolean;
  };
}

// 对话消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type MasterType = 'mínglǐ' | 'xīngzuò' | 'tǎluò';
