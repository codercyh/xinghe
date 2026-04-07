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

// 星座信息
export interface ZodiacSign {
  name: string;
  symbol: string;
  start: string | number[];
  end: string | number[];
  trait: string;
  lunarDate?: string;
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
}

// 对话消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type MasterType = 'mínglǐ' | 'xīngzuò' | 'tǎluò';
