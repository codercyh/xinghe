// 八字详细解读类型

export interface HiddenStem {
  gan: string;
  element: string;
  power: '本气' | '中气' | '余气';
}

export interface PillarInterpret {
  key: 'year' | 'month' | 'day' | 'hour';
  gan: string;
  zhi: string;
  ganMeaning: string;
  zhiMeaning: string;
  hiddenStems: HiddenStem[];
  pillarMeaning: string;
  ganStrength: string;
}

export interface DayMasterInterpret {
  name: string;
  element: string;
  personality: string[];
  strength: string[];
  weakness: string[];
  career: string[];
  relationships: string;
  health: string;
  growth: string[];
}

export interface WuxingInterpret {
  distribution: {
    metal: number; wood: number; water: number; fire: number; earth: number;
  };
  percentages: Record<string, number>;
  strongest: string;
  weakest: string;
  balance: string;
  analysis: string;
  compatible: string[];
  avoid: string[];
}

export interface StrengthInterpret {
  level: string;
  score: number;
  analysis: string;
  trend: string;
}

export interface XiYongShenInterpret {
  xi: string;
  yong: string;
  explanation: string;
}

export interface TGRow {
  gan1: string;
  gan2: string;
  relation: string;
  description: string;
  type: string;
}

export interface DZRow {
  dz1: string;
  dz2: string;
  relation: string;
  description: string;
  type: string;
}

export interface DecadeBlock {
  age: string;
  years: string;
  element: string;
  description: string;
}

export interface DaYunInterpret {
  summary: string;
  decades: DecadeBlock[];
}

export interface BaziInterpretation {
  pillars: {
    year: PillarInterpret;
    month: PillarInterpret;
    day: PillarInterpret;
    hour: PillarInterpret;
  };
  dayMaster: DayMasterInterpret;
  wuxing: WuxingInterpret;
  strength: StrengthInterpret;
  xiYongShen: XiYongShenInterpret;
  tianGanRelations: TGRow[];
  diZhiRelations: DZRow[];
  daYun: DaYunInterpret;
}
