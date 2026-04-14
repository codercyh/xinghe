// 八字纯算法核心 - server/client 共用
// 不依赖任何外部库

import type { BaziInterpretation } from '@/types/bazi';

// ===== 类型定义 =====
export interface Pillar { gan: string; zhi: string; }
export interface WuxingCount {
  metal: number; wood: number; water: number; fire: number; earth: number;
}
export interface BaziResult {
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar };
  wuxing: WuxingCount;
  dayMaster: string;
  dayStrength: 'strong' | 'weak' | 'neutral';
  dayun: { summary: string; nextDecade: string };
  lunarInfo: { lunarYear: number; lunarMonth: number; lunarDay: number; isLeapMonth: boolean };
}

export interface HiddenStem {
  gan: string;
  element: string;
  power: '本气' | '中气' | '余气';
}

export interface BaziDetail {
  pillars: {
    year: PillarDetail;
    month: PillarDetail;
    day: PillarDetail;
    hour: PillarDetail;
  };
  dayMaster: DayMasterDetail;
  wuxing: WuxingDetail;
  strength: StrengthDetail;
  xiYongShen: XiYongShenDetail;
  tianGanRelations: TGRow[];
  diZhiRelations: DZRow[];
  daYun: DaYunDetail;
}

export interface PillarDetail {
  gan: string;
  zhi: string;
  ganMeaning: string;
  zhiMeaning: string;
  hiddenStems: HiddenStem[];
  pillarMeaning: string;
  ganStrength: '旺' | '相' | '休' | '囚' | '死';
}

export interface DayMasterDetail {
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

export interface WuxingDetail {
  distribution: WuxingCount;
  strongest: string;
  weakest: string;
  balance: '均衡' | '偏强' | '偏弱' | '严重失衡';
  analysis: string;
  compatible: string[];
  avoid: string[];
}

export interface StrengthDetail {
  level: '极强' | '偏强' | '中和' | '偏弱' | '极弱';
  score: number;
  analysis: string;
  trend: string;
}

export interface XiYongShenDetail {
  xi: string;
  yong: string;
  explanation: string;
  metals?: string;
  woods?: string;
  waters?: string;
  fires?: string;
  earths?: string;
}

export interface TGRow {
  gan1: string;
  gan2: string;
  relation: string;
  description: string;
  type: '相生' | '相克' | '比和' | '冲' | '合' | '刑' | '害';
}

export interface DZRow {
  dz1: string;
  dz2: string;
  relation: string;
  description: string;
  type: '相生' | '相克' | '比和' | '冲' | '合' | '刑' | '害' | '破';
}

export interface DaYunDetail {
  summary: string;
  decades: DecadeBlock[];
}

export interface DecadeBlock {
  age: string;
  years: string;
  element: string;
  description: string;
}

// ===== 常量 =====
export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const WUXING_MAP: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
  '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
};
type WuxingKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
const WUXING_NAMES: Record<string, string> = { metal: '金', wood: '木', water: '水', fire: '火', earth: '土' };
const WUXING_SYMBOL: Record<string, string> = { metal: '◈', wood: '♣', water: '❖', fire: '✹', earth: '△' };
const GAN_NAMES: Record<string, string> = {
  '甲': '甲', '乙': '乙', '丙': '丙', '丁': '丁', '戊': '戊',
  '己': '己', '庚': '庚', '辛': '辛', '壬': '壬', '癸': '癸',
};
const ZHI_NAMES: Record<string, string> = {
  '子': '子', '丑': '丑', '寅': '寅', '卯': '卯', '辰': '辰', '巳': '巳',
  '午': '午', '未': '未', '申': '申', '酉': '酉', '戌': '戌', '亥': '亥',
};

// 天干相生相克关系
const TG_RELATIONS: Record<string, { relation: string; type: string; desc: string }> = {
  '甲丙': { relation: '相生', type: '相生', desc: '甲木生丙火，木火通明，才华璀璨，表现欲强。' },
  '甲丁': { relation: '相生', type: '相生', desc: '甲木生丁火，温和持久，创造力强但略显内敛。' },
  '甲戊': { relation: '相克', type: '相克', desc: '甲木克戊土，木克土财，财运不错但需防脾胃。' },
  '甲己': { relation: '相克', type: '相克', desc: '甲木克己土，正财稳重，勤劳致富，善于理财。' },
  '甲庚': { relation: '相克', type: '相克', desc: '甲木庚金，金木相战，筋骨易伤，宜修炼心性。' },
  '甲辛': { relation: '相克', type: '相克', desc: '甲木辛金，阴差阳错，财运反复，感情易有波折。' },
  '甲壬': { relation: '相生', type: '相生', desc: '甲木生壬水，水能生木，贵人运佳，人脉广阔。' },
  '甲癸': { relation: '相生', type: '相生', desc: '甲木生癸水，智慧之星，文途顺畅，学术有成。' },
  '乙丁': { relation: '相生', type: '相生', desc: '乙木生丁火，才艺之星，感情细腻，艺术气质。' },
  '乙丙': { relation: '相生', type: '相生', desc: '乙木生丙火，热情洋溢，人缘佳，表达能力强。' },
  '乙戊': { relation: '相克', type: '相克', desc: '乙木克戊土，财运稳定，勤俭持家，积累致富。' },
  '乙己': { relation: '相克', type: '相克', desc: '乙木克己土，正财得利，细腻顾家，理财有道。' },
  '乙庚': { relation: '相克', type: '相克', desc: '乙木庚金，阴阳相克，财运反复，宜守成不宜投机。' },
  '乙辛': { relation: '相克', type: '相克', desc: '乙木辛金，财运流转，感情有痕，宜防筋骨之疾。' },
  '乙壬': { relation: '相生', type: '相生', desc: '乙木生壬水，壬水润木，思路清晰，人脉通达。' },
  '乙癸': { relation: '相生', type: '相生', desc: '乙木生癸水，癸水润乙，才华暗藏，机遇需等待。' },
  '丙戊': { relation: '相生', type: '相生', desc: '丙火生戊土，火土相生，财运旺盛，领导力强。' },
  '丙己': { relation: '相生', type: '相生', desc: '丙火生己土，食神生财，财运稳定，积累可期。' },
  '丙庚': { relation: '相克', type: '相克', desc: '丙火克庚金，财来财去，财运大但耗身，宜保健康。' },
  '丙辛': { relation: '相克', type: '相克', desc: '丙火克辛金，财官相生，财运事业双丰收。' },
  '丙壬': { relation: '相克', type: '相克', desc: '丙火克壬水，水火既济，名利双收，但需防心脏。' },
  '丙癸': { relation: '相克', type: '相克', desc: '丙火克癸水，暗暗生财，财运稳定，仕途顺利。' },
  '丁戊': { relation: '相生', type: '相生', desc: '丁火生戊土，印星护身，贵人相助，学术有成。' },
  '丁己': { relation: '相生', type: '相生', desc: '丁火生己土，印星高照，学历运势佳，贵人运好。' },
  '丁庚': { relation: '相克', type: '相克', desc: '丁火克庚金，财星受伤，财运受阻，宜守成。' },
  '丁辛': { relation: '相克', type: '相克', desc: '丁火克辛金，财官相生，财运不错，仕途有望。' },
  '丁壬': { relation: '相克', type: '相克', desc: '丁火克壬水，合冲之间，财运反复，情感丰富。' },
  '丁癸': { relation: '相克', type: '相克', desc: '丁火克癸水，财印相克，财运平稳，适合文职。' },
  '戊壬': { relation: '相生', type: '相生', desc: '戊土生壬水，财星高照，财运极旺，理财能力强。' },
  '戊癸': { relation: '相生', type: '相生', desc: '戊土生癸水，财星稳定，适合投资，积累可期。' },
  '戊甲': { relation: '相克', type: '相克', desc: '戊土甲木，木克土财，财运受阻，宜防脾胃之疾。' },
  '戊乙': { relation: '相克', type: '相克', desc: '戊土乙木，财来财去，财运反复，理财能力弱。' },
  '己丁': { relation: '相生', type: '相生', desc: '己土生丁火，印星高照，学术顺利，贵人运好。' },
  '己丙': { relation: '相生', type: '相生', desc: '己土生丙火，印星护主，学历运势佳，仕途有望。' },
  '己庚': { relation: '相克', type: '相克', desc: '己土庚金，土生金，财运稳定，积累致富。' },
  '己辛': { relation: '相克', type: '相克', desc: '己土辛金，财运流通，适合投资，理财有道。' },
  '己壬': { relation: '相生', type: '相生', desc: '己土生壬水，财星得势，财运大旺，横财可期。' },
  '己癸': { relation: '相生', type: '相生', desc: '己土生癸水，财星稳定，正财为主，勤俭致富。' },
  '庚甲': { relation: '相克', type: '相克', desc: '庚金克甲木，金木相战，财运反复，宜防筋骨伤。' },
  '庚乙': { relation: '相克', type: '相克', desc: '庚金克乙木，财星受伤，财运不稳，理财需谨慎。' },
  '庚丙': { relation: '相克', type: '相克', desc: '庚金生壬水，财星高照，财运大旺，仕途顺利。' },
  '庚丁': { relation: '相克', type: '相克', desc: '庚金生癸水，财星稳定，财运平稳，适合文职。' },
  '庚戊': { relation: '相生', type: '相生', desc: '庚金生壬水，财星得势，财运大旺，积累可期。' },
  '庚己': { relation: '相生', type: '相生', desc: '庚金生癸水，财星流通，财运稳定，适合投资。' },
  '辛甲': { relation: '相克', type: '相克', desc: '辛金克甲木，财官相生，财运事业双丰收。' },
  '辛乙': { relation: '相克', type: '相克', desc: '辛金克乙木，财星受伤，财运反复，宜守成。' },
  '辛丙': { relation: '相克', type: '相克', desc: '辛金生壬水，财星高照，财运极旺，投资得利。' },
  '辛丁': { relation: '相克', type: '相克', desc: '辛金生癸水，财星流通，财运稳定，正财为主。' },
  '辛戊': { relation: '相生', type: '相生', desc: '辛金生壬水，财星得势，财运大旺，仕途有望。' },
  '辛己': { relation: '相生', type: '相生', desc: '辛金生癸水，财星稳定，财运平稳，适合文职。' },
  '壬丙': { relation: '相克', type: '相克', desc: '壬水克丙火，水火既济，财运事业双丰收。' },
  '壬丁': { relation: '相克', type: '相克', desc: '壬水克丁火，财官相生，财运不错，仕途顺利。' },
  '壬戊': { relation: '相克', type: '相克', desc: '壬水克丙火，财星高照，财运大旺，投资得利。' },
  '壬己': { relation: '相克', type: '相克', desc: '壬水克丁火，财星流通，财运平稳，适合文职。' },
  '壬乙': { relation: '相生', type: '相生', desc: '壬水生乙木，印星护身，学历运势佳，贵人运好。' },
  '壬甲': { relation: '相生', type: '相生', desc: '壬水生甲木，水木相生，智慧高远，文途顺畅。' },
  '癸乙': { relation: '相生', type: '相生', desc: '癸水生乙木，印星高照，学术有成，贵人相助。' },
  '癸甲': { relation: '相生', type: '相生', desc: '癸水生甲木，水木清华，文才出众，学术运佳。' },
  '癸丁': { relation: '相克', type: '相克', desc: '癸水克丁火，财印相克，财运平稳，积累可期。' },
  '癸丙': { relation: '相克', type: '相克', desc: '癸水克丙火，水火既济，财运事业双丰收。' },
  '癸戊': { relation: '相生', type: '相生', desc: '癸水生甲木，水木清华，文才出众，学术运佳。' },
  '癸己': { relation: '相生', type: '相生', desc: '癸水生乙木，印星护身，学历运势佳，贵人运好。' },
};

// 地支藏干（按地支-本气、中气、余气）
const ZHI_HIDDEN: Record<string, HiddenStem[]> = {
  '子': [{ gan: '癸', element: 'water', power: '本气' }],
  '丑': [{ gan: '己', element: 'earth', power: '本气' }, { gan: '癸', element: 'water', power: '中气' }, { gan: '辛', element: 'metal', power: '余气' }],
  '寅': [{ gan: '甲', element: 'wood', power: '本气' }, { gan: '丙', element: 'fire', power: '中气' }, { gan: '戊', element: 'earth', power: '余气' }],
  '卯': [{ gan: '乙', element: 'wood', power: '本气' }],
  '辰': [{ gan: '戊', element: 'earth', power: '本气' }, { gan: '乙', element: 'wood', power: '中气' }, { gan: '癸', element: 'water', power: '余气' }],
  '巳': [{ gan: '丙', element: 'fire', power: '本气' }, { gan: '庚', element: 'metal', power: '中气' }, { gan: '戊', element: 'earth', power: '余气' }],
  '午': [{ gan: '丁', element: 'fire', power: '本气' }, { gan: '己', element: 'earth', power: '中气' }],
  '未': [{ gan: '己', element: 'earth', power: '本气' }, { gan: '丁', element: 'fire', power: '中气' }, { gan: '乙', element: 'wood', power: '余气' }],
  '申': [{ gan: '庚', element: 'metal', power: '本气' }, { gan: '壬', element: 'water', power: '中气' }, { gan: '戊', element: 'earth', power: '余气' }],
  '酉': [{ gan: '辛', element: 'metal', power: '本气' }],
  '戌': [{ gan: '戊', element: 'earth', power: '本气' }, { gan: '辛', element: 'metal', power: '中气' }, { gan: '丁', element: 'fire', power: '余气' }],
  '亥': [{ gan: '壬', element: 'water', power: '本气' }, { gan: '甲', element: 'wood', power: '中气' }],
};

// 地支关系
const DZ_RELATIONS: Record<string, { relation: string; type: string; desc: string }> = {
  '子丑': { relation: '合', type: '合', desc: '土克水，合化为土，肾泌尿系统需注意' },
  '寅亥': { relation: '合', type: '合', desc: '木克土，合化为木，肝胆健康需关注' },
  '卯戌': { relation: '合', type: '合', desc: '火克金，合化为火，心血管功能需关注' },
  '辰酉': { relation: '合', type: '合', desc: '金生水，合化为金，肺呼吸道需保护' },
  '巳申': { relation: '合', type: '合', desc: '火克金，合化为水，泌尿系统需注意' },
  '午未': { relation: '合', type: '合', desc: '火生土，合化为火，心与小肠需关注' },
  '子午': { relation: '冲', type: '冲', desc: '水克火，子午相冲，心肾不交，需防失眠、心悸' },
  '丑未': { relation: '冲', type: '冲', desc: '土相冲，丑未持势之冲，脾胃易失衡' },
  '寅申': { relation: '冲', type: '冲', desc: '金克木，寅申相冲，肝胆与肺相战' },
  '卯酉': { relation: '冲', type: '冲', desc: '金克木，卯酉相冲，肝胆与肺相战' },
  '辰戌': { relation: '冲', type: '冲', desc: '土相冲，辰戌持势之冲，脾胃易出问题' },
  '巳亥': { relation: '冲', type: '冲', desc: '水克火，巳亥相冲，心脏与肾相克' },
};

// 地支含义
const ZHI_MEANINGS: Record<string, { meaning: string; personality: string[]; health: string }> = {
  '子': {
    meaning: '子为墨池，正北方之水，代表智慧、夜晚、寒冷、流动。',
    personality: ['聪明机敏', '灵活善变', '有智慧有谋略', '适应性极强'],
    health: '泌尿系统、肾、耳'
  },
  '丑': {
    meaning: '丑为柳岸，东北方之土，代表凝结、孕育、地下、厚重。',
    personality: ['踏实稳重', '忍耐力强', '内敛深沉', '有积累心'],
    health: '脾胃、肌肉、肿块'
  },
  '寅': {
    meaning: '寅为广谷，东北方之木，代表开始、生长、阳气初生。',
    personality: ['积极进取', '有领导力', '有开拓精神', '自律性强'],
    health: '肝胆、手足、神经'
  },
  '卯': {
    meaning: '卯为琼枝，东方之木，代表青春、茂盛、动能、阴木。',
    personality: ['细腻敏感', '有艺术气质', '观察力强', '但易犹豫'],
    health: '肝胆、手指、筋'
  },
  '辰': {
    meaning: '辰为草泽，东方之土，代表湿气、储存、整合、变动。',
    personality: ['包容性强', '有弹性', '善变通', '有时懒散'],
    health: '脾胃、肩胸、皮肤'
  },
  '巳': {
    meaning: '巳为大驿，南方之火，代表色彩、变化、阴火、文明。',
    personality: ['聪明伶俐', '有表达能力', '善于交际', '但多思虑'],
    health: '心脏、眼睛、额头'
  },
  '午': {
    meaning: '午为烽堠，南方之火，代表光明、冲突、阳火、极致。',
    personality: ['热情洋溢', '行动力强', '正义感强', '但易冲动'],
    health: '心脏、小肠、舌'
  },
  '未': {
    meaning: '未为花园，西南之土，代表收敛、成熟、魅力、文雅。',
    personality: ['优雅有品味', '善于表达', '有艺术细胞', '但计较得失'],
    health: '脾胃、消化系统'
  },
  '申': {
    meaning: '申为名都，西南方之金，代表传送、精密、严肃、决断。',
    personality: ['精明能干', '有执行力', '思维清晰', '有时冷酷'],
    health: '肺、大肠、骨骼'
  },
  '酉': {
    meaning: '酉为绣岭，西方之金，代表精致、鉴赏、阴金、晚唱。',
    personality: ['细腻敏感', '审美能力强', '有耐心', '但易消极'],
    health: '肺、呼吸系统、骨'
  },
  '戌': {
    meaning: '戌为烧原，西北之土，代表余晖、归宿、诚实、老成。',
    personality: ['成熟稳重', '有责任感', '忠诚可靠', '但有时悲观'],
    health: '脾胃、腿脚、免疫'
  },
  '亥': {
    meaning: '亥为悬河，西北之水，代表智慧、阴险、变动、交叉。',
    personality: ['聪明智慧', '直觉敏锐', '善于思考', '但多疑虑'],
    health: '肾、泌尿系统、耳'
  },
};

// 天干含义
const GAN_MEANINGS: Record<string, { meaning: string; personality: string[]; strength: string[]; weakness: string[]; career: string[] }> = {
  '甲': {
    meaning: '甲为天魁，阳木参天之性，参天拔地，有领导之德。代表栋梁、首领、开始。',
    personality: ['有领导力', '正直有担当', '积极进取', '意志坚强'],
    strength: ['责任心强', '有魄力', '抗压能力强', '目标明确'],
    weakness: ['有时过于固执', '不够灵活', '过于刚直', '不善变通'],
    career: ['企业高管', '政治领袖', '创业者', '管理者']
  },
  '乙': {
    meaning: '乙为奇才，阴木花草之性，柔情曼姿，有审美之德。代表艺术、柔韧、创意。',
    personality: ['心思细腻', '善于变通', '有审美眼光', '温柔有耐心'],
    strength: ['适应力强', '创意丰富', '善于沟通', '人缘极佳'],
    weakness: ['容易犹豫', '缺乏决断', '有时优柔寡断', '抗压较弱'],
    career: ['艺术家', '设计师', '外交官', '文职工作']
  },
  '丙': {
    meaning: '丙为太昭，阳火太阳之性，光辉灿烂，有照耀之德。代表光明、热烈、权力。',
    personality: ['热情大方', '正直开朗', '有感染力', '行动力强'],
    strength: ['领导力强', '执行力高', '抗压能力强', '目标导向'],
    weakness: ['容易冲动', '有时自负', '缺乏耐心', '言语直接'],
    career: ['企业家', '销售', '演讲家', '政治家']
  },
  '丁': {
    meaning: '丁为、文明，阴火烛光之性，温情内敛，有温柔之德。代表文化、礼仪、智慧。',
    personality: ['内敛深沉', '思维敏捷', '有文化底蕴', '善于思考'],
    strength: ['分析能力强', '有洞察力', '文学素养高', '逻辑清晰'],
    weakness: ['有时冷漠', '不善表达情感', '容易消极', '人际关系浅'],
    career: ['学者', '作家', '律师', '顾问']
  },
  '戊': {
    meaning: '戊为铁山，阳土城墙之性，厚重稳实，有包容之德。代表诚信、稳定、积累。',
    personality: ['踏实厚重', '忠诚可靠', '有耐心', '意志坚强'],
    strength: ['理财能力强', '抗压能力高', '信用良好', '有积累心'],
    weakness: ['有时固执', '不擅言辞', '缺乏灵活性', '过于保守'],
    career: ['金融', '会计', '建筑', '地产']
  },
  '己': {
    meaning: '己为天原，阴土田园之性，柔和细腻，有化育之德。代表包容、诚实、务实。',
    personality: ['细腻周到', '善于规划', '有耐心', '考虑周全'],
    strength: ['策划能力强', '善于协调', '勤俭节约', '适应力好'],
    weakness: ['容易计较', '有时消极', '缺乏自信', '过于谨慎'],
    career: ['秘书', '会计', '策划', '管理者']
  },
  '庚': {
    meaning: '庚为剑锋，阳金刚健之性，刚毅果敢，有决断之德。代表纪律、义气、刚强。',
    personality: ['刚毅果断', '有魄力', '正义感强', '意志坚强'],
    strength: ['执行力强', '抗压能力高', '决断力强', '领导潜质'],
    weakness: ['有时冷酷', '不够圆滑', '言语直接', '不易妥协'],
    career: ['军人', '警官', '法官', '管理者']
  },
  '辛': {
    meaning: '辛为珠玉，阴金温润之性，精致细腻，有审美之德。代表工艺、精致、更新。',
    personality: ['细腻精致', '审美能力高', '善于变通', '有品味'],
    strength: ['艺术天赋', '创新能力高', '审美出众', '适应力强'],
    weakness: ['容易消极', '有时优柔寡断', '抗压较弱', '情绪波动'],
    career: ['艺术家', '设计师', '演艺', '美容']
  },
  '壬': {
    meaning: '壬为大海，阳水沧溟之性，宽广流动，有智慧之德。代表智慧、流动、广阔。',
    personality: ['胸怀宽广', '思维开阔', '有智慧', '适应力强'],
    strength: ['领导力强', '决策果断', '视野宏大', '人脉广泛'],
    weakness: ['有时漂浮', '不够专注', '计划性弱', '执行不够'],
    career: ['企业家', '外交', '旅游', '贸易']
  },
  '癸': {
    meaning: '癸为春霖，阴水雨露之性，滋润纤细，有涵养之德。代表智慧、柔顺、学术。',
    personality: ['柔和细腻', '有耐心', '善于思考', '学术气质'],
    strength: ['学术能力强', '思维深入', '有涵养', '文笔出众'],
    weakness: ['容易消极', '决策缓慢', '抗压较弱', '行动力弱'],
    career: ['学者', '作家', '教师', '研究员']
  },
};

// 日主（八大日主）详细性格
const DAYMASTER_DETAIL: Record<string, DayMasterDetail> = {
  '甲': {
    name: '甲木',
    element: '木',
    personality: [
      '甲木之人如参天大树，正直向上，有强烈的责任感和使命感。',
      '你骨子里的正直让你不屑于走捷径，宁可脚踏实地一步步攀登。',
      '你有清晰的价值观和原则，对正义有着本能的追求。',
      '内心深处渴望被认可为有价值的人，被尊重是你的核心需求。',
      '你有出色的学习能力和上进心，在学术和事业上往往有所成就。',
    ],
    strength: ['正直可靠', '上进心强', '有领导力', '学习能力强', '意志坚定', '抗压能力强'],
    weakness: ['过于刚直', '不善变通', '缺乏柔韧性', '不善表达情感', '有时固执'],
    career: ['企业管理', '政治仕途', '学术研究', '教育培训', '创业者'],
    relationships: '你在感情中比较内敛，不善表达，但一旦认定了对方会非常专一和投入。你需要伴侣的尊重和欣赏，同时也需要给对方一定的独立空间。',
    health: '肝胆系统较弱，需注意情绪波动对肝功能的影响。保持适度运动和情绪平和对健康很重要。',
    growth: ['学会在坚持原则和灵活变通之间找到平衡', '练习更好地表达和理解情感', '接受不完美，不要对自己和他人过于苛刻', '适当放慢脚步，享受过程'],
  },
  '乙': {
    name: '乙木',
    element: '木',
    personality: [
      '乙木之人如花草藤蔓，柔韧而富有生命力，适应力极强。',
      '你直觉敏锐，善于观察，能迅速捕捉到周围人的情绪变化。',
      '你有出色的审美能力，对美有着天然的追求和感知。',
      '你善于沟通和协调，在人际交往中往往能如鱼得水。',
      '你内心柔软但并不脆弱，有着意想不到的坚强和韧性。',
    ],
    strength: ['适应力强', '直觉敏锐', '善于交际', '审美出众', '有创意', '感受力强'],
    weakness: ['容易犹豫', '抗压较弱', '情绪波动', '有时优柔寡断', '不够坚定'],
    career: ['艺术设计', '外交公关', '心理咨询', '教育培训', '文学创作'],
    relationships: '你在感情中细腻温柔，需要大量的情感交流和陪伴。你渴望被理解和支持，有时会为了维持和谐而压抑自己的真实需求。学会表达真实感受对你很重要。',
    health: '肝胆系统较弱，尤其是情绪波动时容易影响肝气运行。注意保护眼睛和手指。',
    growth: ['勇敢表达真实的想法和感受', '在重大决定前给自己设定决策时间', '建立更健康的边界', '学会接受拒绝和失望'],
  },
  '丙': {
    name: '丙火',
    element: '火',
    personality: [
      '丙火之人如太阳当空，光芒万丈，走到哪都能成为焦点。',
      '你热情洋溢，对生活充满热爱，这种热情能感染身边的每一个人。',
      '你有强烈的自尊心，渴望被认可和欣赏，这是你行动的重要动力。',
      '你正直坦率，说话直接，宁可真实的伤害人也不用谎言来讨好。',
      '你有出色的领导力和感染力，天生适合站在舞台中央。',
    ],
    strength: ['热情大方', '领导力强', '执行力高', '正直坦率', '抗压能力强', '有感染力'],
    weakness: ['容易冲动', '有时自负', '言语直接易伤人', '不够细腻', '缺乏耐心'],
    career: ['企业管理', '销售公关', '演艺表演', '政治领袖', '创业者'],
    relationships: '你在感情中热烈而直接，喜欢就会大胆表达。你需要伴侣的欣赏和崇拜，同时你也会给予对方热烈的爱。但你要学会倾听伴侣的感受，而不只是关注自己的需求。',
    health: '心脏和小肠系统需注意，高血压、心率不齐是潜在风险。保持情绪稳定对心脏很重要。',
    growth: ['说话前三思，你的直言可能伤害亲近的人', '学会倾听他人的感受', '接受批评，把它当作成长的机会', '在热情和冷静之间找到平衡'],
  },
  '丁': {
    name: '丁火',
    element: '火',
    personality: [
      '丁火之人如烛光灯火，外表柔和但内心明亮，有独特的温柔力量。',
      '你思维缜密，善于分析问题，有很强的洞察力和理解力。',
      '你有深厚的文化底蕴，对文学、艺术、历史等领域有天然的亲近感。',
      '你不善于主动表达情感，但内心情感世界极为丰富和深刻。',
      '你有很高的情商，能细腻地感知他人的情绪和需求。',
    ],
    strength: ['思维缜密', '洞察力强', '情商高', '有文化底蕴', '善于分析', '稳定可靠'],
    weakness: ['不善表达', '有时消极', '容易压抑情感', '过于追求完美', '人际关系偏窄'],
    career: ['学术研究', '文学创作', '律师', '顾问咨询', '教育培训'],
    relationships: '你在感情中深沉而专一，一旦投入会是极度忠诚的伴侣。你需要深度的情感连接而非表面的热闹。学会主动表达爱意和需求，能让你的亲密关系更加顺畅。',
    health: '心脏和眼睛需注意，尤其是用眼过度的现代人。保持充足睡眠对丁火之人很重要。',
    growth: ['主动表达情感，不要总是等待对方猜测', '扩大社交圈，不要只停留在舒适区', '接受他人的帮助，学会依赖', '对不完美的事更加包容'],
  },
  '戊': {
    name: '戊土',
    element: '土',
    personality: [
      '戊土之人如城墙磐石，厚重稳重，给人极强的安全感和信任感。',
      '你诚实守信，说到做到，一旦承诺就会全力以赴去履行。',
      '你有很强的耐心和毅力，愿意为长远目标持续付出和等待。',
      '你理财观念很强，知道如何积累和守护财富。',
      '你内敛沉稳，不喜欢出风头，但关键时刻能扛起重任。',
    ],
    strength: ['稳重可靠', '有耐心', '理财高手', '意志坚强', '抗压能力强', '忠诚度高'],
    weakness: ['有时固执', '不擅言辞', '缺乏灵活性', '过于保守', '不善表达情感'],
    career: ['金融投资', '会计审计', '建筑工程', '房地产开发', '行政管理'],
    relationships: '你在感情中是沉默的给予者，用行动而非言语来表达爱。你渴望一段稳定、长久的亲密关系。一旦背叛被确认，伤口很难愈合。你需要学会更多地用语言表达感情。',
    health: '脾胃消化系统较为薄弱，需注意饮食规律。皮肤和肌肉也需适当保养。',
    growth: ['在坚持原则和接受变化之间找到平衡', '学习更好地表达情感和需求', '尝试新的事物，不要总是待在舒适区', '信任他人，不要过度控制'],
  },
  '己': {
    name: '己土',
    element: '土',
    personality: [
      '己土之人如田园泥土，柔和细腻，包容万物，有极强的适应力。',
      '你善于思考和规划，做事之前会进行全面而细致的考量。',
      '你有出色的协调能力，能在不同的人和事之间找到平衡点。',
      '你勤俭节约，知道财富需要一点点积累。',
      '你表面温和，内心有自己的原则和底线，一旦触碰会坚决捍卫。',
    ],
    strength: ['善于规划', '协调能力强', '细致周到', '适应力好', '勤俭节约', '考虑周全'],
    weakness: ['容易计较', '有时消极', '缺乏自信', '过于谨慎', '抗压较弱'],
    career: ['行政管理', '财务规划', '人力资源', '策划咨询', '秘书助理'],
    relationships: '你在感情中细腻体贴，会记住伴侣的各种小细节并给予关心。你需要伴侣的肯定和安全感，有时会为了避免冲突而压抑自己的需求。学会更坦诚地表达不满和需求。',
    health: '脾胃消化系统需重点关注，饮食要规律，避免过度思虑。肌肉和皮肤也需适当保养。',
    growth: ['建立自信，不要总是贬低自己', '有不满时勇敢表达，不要总是忍耐', '扩大视野，不要只看到眼前', '接受帮助，不要所有事都自己扛'],
  },
  '庚': {
    name: '庚金',
    element: '金',
    personality: [
      '庚金之人如剑锋刀刃，刚毅果敢，有决断力和执行力。',
      '你为人正直，有强烈的正义感，对不公正的事情无法袖手旁观。',
      '你有出色的领导能力，能带领团队克服困难达成目标。',
      '你不怕困难和挑战，越是艰难的环境越能激发你的斗志。',
      '你说话直接，不喜欢绕弯子，讨厌虚伪和做作。',
    ],
    strength: ['刚毅果断', '执行力强', '正义感强', '抗压能力强', '领导力高', '意志坚定'],
    weakness: ['有时冷酷', '不够圆滑', '言语直接', '不易妥协', '缺乏耐心'],
    career: ['军警执法', '企业管理', '金融投资', '法律司法', '工程建造'],
    relationships: '你在感情中比较直接，不善表达细腻情感。你需要伴侣的尊重和理解，不喜欢被束缚和控制。学习更柔和地表达感情和需求，能让亲密关系更加融洽。',
    health: '肺和大肠系统需注意，呼吸系统较为敏感。骨骼和牙齿也需适当保养。',
    growth: ['说话更柔和一些，直接不等于伤害', '学会欣赏和认可他人的努力', '在坚持和妥协之间找到平衡', '培养更细腻的情感表达能力'],
  },
  '辛': {
    name: '辛金',
    element: '金',
    personality: [
      '辛金之人如珠玉宝石，精致细腻，有独特的审美和品位。',
      '你善于反思和自省，对自己有很深的认知和了解。',
      '你有敏锐的洞察力，能看到事物表面之下的本质。',
      '你有追求完美的倾向，对自己和他人都有一定的标准。',
      '你善于学习，在感兴趣领域能钻研得很深。',
    ],
    strength: ['细腻精致', '有审美', '善于反思', '洞察力强', '有恒心', '学习能力强'],
    weakness: ['容易消极', '抗压较弱', '情绪波动', '有时冷漠', '过于追求完美'],
    career: ['艺术设计', '学术研究', '文学创作', '精细工艺', '鉴定评估'],
    relationships: '你在感情中细腻而敏感，渴望深度的情感连接。你需要伴侣的理解和陪伴，有时会因为害怕被拒绝而不敢敞开心扉。学会信任和放下防备，是你在感情中最重要的成长课题。',
    health: '肺和呼吸系统较为敏感，皮肤和骨骼也需注意保养。',
    growth: ['学会信任和放下戒备', '接受自己的不完美和失败', '多参与社交活动', '在挫折中寻找成长的机会'],
  },
  '壬': {
    name: '壬水',
    element: '水',
    personality: [
      '壬水之人如江河湖海，宽广流动，有宏大的视野和气度。',
      '你思维活跃，善于从宏观角度分析问题。',
      '你有很强的适应性，无论什么环境都能迅速找到自己的位置。',
      '你热爱自由，不喜欢被束缚，渴望多元化的生活体验。',
      '你智慧超群，善于学习和接受新事物，有前瞻性思维。',
    ],
    strength: ['视野宽广', '适应力强', '思维活跃', '学习能力强', '人脉广泛', '有前瞻性'],
    weakness: ['计划性弱', '执行不够', '缺乏耐心', '有时漂浮', '难专注'],
    career: ['企业家', '外交外贸', '旅游娱乐', '投资融资', '教育培训'],
    relationships: '你在感情中需要保持一定的独立性，不喜欢过度亲密。你欣赏有趣、有智慧、能跟上你思维的伴侣。学习在亲密和独立之间找到平衡，是你的重要课题。',
    health: '肾和泌尿系统需注意，生殖系统也较为敏感。保持适度运动对健康很重要。',
    growth: ['提高专注力，在一件事上深入钻研', '提高执行力，不要只停留在计划阶段', '学会坚持，不要轻易放弃', '在感情中给予更多的承诺和责任'],
  },
  '癸': {
    name: '癸水',
    element: '水',
    personality: [
      '癸水之人如春雨露珠，滋润细腻，有极强的感知力和同理心。',
      '你思维深邃，善于思考抽象和哲学性的问题。',
      '你有出色的文学天赋和表达能力，文字往往能打动人心。',
      '你直觉敏锐，能感知到常人难以察觉的细微之处。',
      '你内敛沉静，有着超越年龄的成熟和智慧。',
    ],
    strength: ['感知力强', '思维深邃', '文学天赋', '直觉敏锐', '有涵养', '善于分析'],
    weakness: ['决策缓慢', '行动力弱', '抗压较弱', '容易消极', '不够果断'],
    career: ['学术研究', '文学创作', '教育培训', '心理咨询', '宗教哲学'],
    relationships: '你在感情中深沉而内敛，渴望与伴侣有灵魂层面的交流。你需要大量独处的时间来充电。学习更主动地表达情感和需求，而不是等待对方来猜测。',
    health: '肾和泌尿系统较为敏感，需要注意保养。耳朵和骨骼也需关注。',
    growth: ['提高行动力，不要过度思考', '勇敢表达想法，不要害怕被拒绝', '建立更健康的自我价值感', '学会在竞争中争取机会'],
  },
};

// ===== 工具函数 =====

// 公历转JDN
export function gToJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5)
    + 365 * y2 + Math.floor(y2 / 4)
    - Math.floor(y2 / 100) + Math.floor(y2 / 400)
    - 32045;
}

// 真太阳时
export function toTrueSolarTime(hour: number, timezone: string): number {
  const lngMap: Record<string, number> = {
    'Asia/Shanghai': 121.4, 'Asia/Hong_Kong': 114.1, 'Asia/Taipei': 121.5,
    'Asia/Tokyo': 139.7, 'Asia/Singapore': 103.8,
    'America/New_York': -74.0, 'Europe/London': -0.1,
  };
  const lng = lngMap[timezone] ?? 120;
  const total = hour * 60 + (lng - 120) * 4;
  if (total < 0) return 23;
  if (total >= 1440) return 0;
  return Math.floor(total / 60);
}

// 60甲子查表算日柱
export function getDayGanZhi(jdn: number): { gan: string; zhi: string } {
  const BASE_JDN = 2451528;
  const cycleIdx = ((jdn - BASE_JDN) % 60 + 60) % 60;
  const CYCLE60 = ['甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉','甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未','甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳','甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯','甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑','甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'];
  const gz = CYCLE60[cycleIdx];
  return { gan: gz[0], zhi: gz[1] };
}

// 算年柱
export function getYearGanZhi(year: number): { gan: string; zhi: string } {
  const cycle = ((year - 1984) % 60 + 60) % 60;
  const CYCLE60 = ['甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉','甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未','甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳','甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯','甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑','甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'];
  const gz = CYCLE60[cycle];
  return { gan: gz[0], zhi: gz[1] };
}

// 算月柱（五虎遁）
export function getMonthGanZhi(yearGanIdx: number, month: number): { gan: string; zhi: string } {
  const wugedun: Record<number, number> = {
    0: 2, 5: 2,
    1: 4, 6: 4,
    2: 6, 7: 6,
    3: 8, 8: 8,
    4: 0, 9: 0,
  };
  const zhi = DI_ZHI[month % 12];
  const gan = TIAN_GAN[((wugedun[yearGanIdx] ?? 2) + month - 1) % 10];
  return { gan, zhi };
}

// 算时柱（五鼠遁）
export function getHourGanZhi(dayGanIdx: number, hour: number): { gan: string; zhi: string } {
  const hourZhiIdx = hour === 0 ? 0
    : hour < 3 ? 1 : hour < 5 ? 2 : hour < 7 ? 3
    : hour < 9 ? 4 : hour < 11 ? 5 : hour < 13 ? 6
    : hour < 15 ? 7 : hour < 17 ? 8 : hour < 19 ? 9
    : hour < 21 ? 10 : 11;
  const zhi = DI_ZHI[hourZhiIdx];
  const wushudun: Record<number, number> = {
    0: 0, 5: 0,
    1: 2, 6: 2,
    2: 4, 7: 4,
    3: 6, 8: 6,
    4: 8, 9: 8,
  };
  const gan = TIAN_GAN[((wushudun[dayGanIdx] ?? 0) + hourZhiIdx) % 10];
  return { gan, zhi };
}

// ===== 完整八字计算 =====

const SHENG: Record<WuxingKey, WuxingKey> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood'
};
const KE: Record<WuxingKey, WuxingKey> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood'
};

// 计算八字（返回结果 + 详细解读）
export function calculateBaziWithInterpretation(
  year: number, month: number, day: number, hour: number,
  gender: 'male' | 'female' = 'male', timezone: string = 'Asia/Shanghai'
): { result: BaziResult; interpretation: BaziInterpretation } {
  const trueHour = toTrueSolarTime(hour, timezone);
  const jdn = gToJDN(year, month, day);

  const dayGZ = getDayGanZhi(jdn);
  const dayGanIdx = TIAN_GAN.indexOf(dayGZ.gan);
  const yearGZ = getYearGanZhi(year);
  const yearGanIdx = TIAN_GAN.indexOf(yearGZ.gan);
  const monthGZ = getMonthGanZhi(yearGanIdx, month);
  const hourGZ = getHourGanZhi(dayGanIdx, trueHour);

  const gans = [yearGZ.gan, monthGZ.gan, dayGZ.gan, hourGZ.gan];
  const zhis = [yearGZ.zhi, monthGZ.zhi, dayGZ.zhi, hourGZ.zhi];

  // 五行统计
  const wuxing: WuxingCount = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  gans.forEach((g) => {
    const w = WUXING_MAP[g] as WuxingKey;
    if (w) wuxing[w]++;
  });
  zhis.forEach((z) => {
    const w = WUXING_MAP[z] as WuxingKey;
    if (w) wuxing[w]++;
  });

  // 日主五行强度
  const dayGan = dayGZ.gan;
  const dayWuxing = (WUXING_MAP[dayGan] ?? 'earth') as WuxingKey;
  let score = (wuxing[dayWuxing] ?? 0) * 1.5;
  (Object.entries(wuxing) as [WuxingKey, number][]).forEach(([w, count]) => {
    if (w === dayWuxing) return;
    if (SHENG[w] === dayWuxing) score += count * 0.8;
    if (KE[w] === dayWuxing) score -= count * 0.8;
  });
  const monthEls: Record<number, WuxingKey> = {
    1: 'water', 2: 'wood', 3: 'wood', 4: 'fire', 5: 'fire', 6: 'earth',
    7: 'earth', 8: 'metal', 9: 'metal', 10: 'water', 11: 'water', 12: 'earth',
  };
  const curEl = monthEls[month] ?? 'earth';
  if (curEl === dayWuxing) score += 2;
  else if (SHENG[curEl] === dayWuxing) score += 1;
  else if (KE[curEl] === dayWuxing) score -= 1;
  const dayStrength = score > 5.5 ? 'strong' : score < 4.5 ? 'weak' : 'neutral';

  const entries = Object.entries(wuxing) as [WuxingKey, number][];
  const weakest = entries.sort((a, b) => a[1] - b[1])[0][0];
  const strongest = entries.sort((a, b) => b[1] - a[1])[0][0];
  const xiYong = dayStrength === 'strong' ? KE[strongest] ?? weakest : SHENG[dayWuxing] ?? weakest;
  const keStrong = KE[strongest] ?? weakest;
  const shengDay = SHENG[dayWuxing] ?? weakest;
  const shengUse = dayStrength === 'strong' ? keStrong : shengDay;

  const st: Record<string, string> = { strong: '偏旺', weak: '偏弱', neutral: '中和' };

  const result: BaziResult = {
    pillars: {
      year: { gan: yearGZ.gan, zhi: yearGZ.zhi },
      month: { gan: monthGZ.gan, zhi: monthGZ.zhi },
      day: { gan: dayGZ.gan, zhi: dayGZ.zhi },
      hour: { gan: hourGZ.gan, zhi: hourGZ.zhi },
    },
    wuxing,
    dayMaster: dayGan,
    dayStrength,
    dayun: {
      summary: `日主 ${dayGan}，五行${st[dayStrength]}。喜用神建议取 ${WUXING_NAMES[xiYong ?? weakest]} / ${WUXING_NAMES[shengUse ?? weakest]}。`,
      nextDecade: dayStrength === 'strong'
        ? `未来十年以${WUXING_NAMES[xiYong ?? weakest]}为主导，宜顺势而为。`
        : `未来十年有${WUXING_NAMES[shengUse ?? weakest]}相助，机遇较好。`,
    },
    lunarInfo: { lunarYear: year, lunarMonth: month, lunarDay: day, isLeapMonth: false },
  };

  // ===== 详细解读 =====

  // 四柱解读
  const pillarData = [
    { key: 'year' as const, gan: yearGZ.gan, zhi: yearGZ.zhi },
    { key: 'month' as const, gan: monthGZ.gan, zhi: monthGZ.zhi },
    { key: 'day' as const, gan: dayGZ.gan, zhi: dayGZ.zhi },
    { key: 'hour' as const, gan: hourGZ.gan, zhi: hourGZ.zhi },
  ];

  const pillarDetails = pillarData.map(({ key, gan, zhi }) => {
    const ganInfo = GAN_MEANINGS[gan] ?? GAN_MEANINGS['甲'];
    const zhiInfo = ZHI_MEANINGS[zhi] ?? ZHI_MEANINGS['子'];
    const hidden = ZHI_HIDDEN[zhi] ?? [];
    const pillarMeanings: Record<string, string> = {
      year: `${ganInfo.meaning.replace('甲为天魁', '').replace('乙为奇才', '').replace('丙为太昭', '').replace('丁为、文明', '').replace('戊为铁山', '').replace('己为天原', '').replace('庚为剑锋', '').replace('辛为珠玉', '').replace('壬为大海', '').replace('癸为春霖', '')}年柱代表根基、祖业，${gan}坐${zhi}，显示祖辈${zhiInfo.personality[0]}。`,
      month: `${ganInfo.meaning.replace('甲为天魁', '').replace('乙为奇才', '').replace('丙为太昭', '').replace('丁为、文明', '').replace('戊为铁山', '').replace('己为天原', '').replace('庚为剑锋', '').replace('辛为珠玉', '').replace('壬为大海', '').replace('癸为春霖', '')}月柱代表父母、事业环境，${gan}坐${zhi}，${zhiInfo.meaning.slice(0,20)}。`,
      day: `${ganInfo.meaning.replace('甲为天魁', '').replace('乙为奇才', '').replace('丙为太昭', '').replace('丁为、文明', '').replace('戊为铁山', '').replace('己为天原', '').replace('庚为剑锋', '').replace('辛为珠玉', '').replace('壬为大海', '').replace('癸为春霖', '')}日柱为命主本人，${gan}坐${zhi}，${zhiInfo.meaning.slice(0,20)}。`,
      hour: `${ganInfo.meaning.replace('甲为天魁', '').replace('乙为奇才', '').replace('丙为太昭', '').replace('丁为、文明', '').replace('戊为铁山', '').replace('己为天原', '').replace('庚为剑锋', '').replace('辛为珠玉', '').replace('壬为大海', '').replace('癸为春霖', '')}时柱代表子女、晚年，${gan}坐${zhi}，${zhiInfo.meaning.slice(0,20)}。`,
    };

    // 天干旺度
    const ganOfMonth = monthGZ.gan;
    const monthZhiIdx = DI_ZHI.indexOf(monthGZ.zhi);
    const ganStrengths: Record<string, Record<number, '旺' | '相' | '休' | '囚' | '死'>> = {
      '甲': { 0: '旺', 1: '相', 2: '休', 3: '囚', 4: '死', 5: '旺', 6: '相', 7: '休', 8: '囚', 9: '死', 10: '旺', 11: '相' },
      '乙': { 0: '旺', 1: '相', 2: '休', 3: '囚', 4: '死', 5: '旺', 6: '相', 7: '休', 8: '囚', 9: '死', 10: '旺', 11: '相' },
      '丙': { 0: '死', 1: '旺', 2: '相', 3: '休', 4: '囚', 5: '死', 6: '旺', 7: '相', 8: '休', 9: '囚', 10: '死', 11: '旺' },
      '丁': { 0: '死', 1: '旺', 2: '相', 3: '休', 4: '囚', 5: '死', 6: '旺', 7: '相', 8: '休', 9: '囚', 10: '死', 11: '旺' },
      '戊': { 0: '囚', 1: '死', 2: '旺', 3: '相', 4: '休', 5: '囚', 6: '死', 7: '旺', 8: '相', 9: '休', 10: '囚', 11: '死' },
      '己': { 0: '囚', 1: '死', 2: '旺', 3: '相', 4: '休', 5: '囚', 6: '死', 7: '旺', 8: '相', 9: '休', 10: '囚', 11: '死' },
      '庚': { 0: '休', 1: '囚', 2: '死', 3: '旺', 4: '相', 5: '休', 6: '囚', 7: '死', 8: '旺', 9: '相', 10: '休', 11: '囚' },
      '辛': { 0: '休', 1: '囚', 2: '死', 3: '旺', 4: '相', 5: '休', 6: '囚', 7: '死', 8: '旺', 9: '相', 10: '休', 11: '囚' },
      '壬': { 0: '相', 1: '休', 2: '囚', 3: '死', 4: '旺', 5: '相', 6: '休', 7: '囚', 8: '死', 9: '旺', 10: '相', 11: '休' },
      '癸': { 0: '相', 1: '休', 2: '囚', 3: '死', 4: '旺', 5: '相', 6: '休', 7: '囚', 8: '死', 9: '旺', 10: '相', 11: '休' },
    };

    return {
      key,
      gan,
      zhi,
      ganMeaning: ganInfo.meaning,
      zhiMeaning: zhiInfo.meaning,
      hiddenStems: hidden,
      pillarMeaning: pillarMeanings[key],
      ganStrength: ganStrengths[gan]?.[monthZhiIdx] ?? '休',
    };
  });

  // 天干关系
  const tianGanPairs: Array<[string, string]> = [
    [yearGZ.gan, monthGZ.gan],
    [yearGZ.gan, dayGZ.gan],
    [yearGZ.gan, hourGZ.gan],
    [monthGZ.gan, dayGZ.gan],
    [monthGZ.gan, hourGZ.gan],
    [dayGZ.gan, hourGZ.gan],
  ];
  const tianGanRelations = tianGanPairs
    .filter(([a, b]) => a !== b)
    .map(([gan1, gan2]) => {
      const key1 = `${gan1}${gan2}`;
      const key2 = `${gan2}${gan1}`;
      const rel = TG_RELATIONS[key1] ?? TG_RELATIONS[key2];
      return {
        gan1,
        gan2,
        relation: rel?.relation ?? '比和',
        description: rel?.desc ?? `${gan1}与${gan2}比和，同性相扶，竞争关系。`,
        type: (rel?.type ?? '比和') as '相生' | '相克' | '比和' | '冲' | '合' | '刑' | '害',
      };
    });

  // 地支关系
  const dzPairs: Array<[string, string]> = [
    [yearGZ.zhi, monthGZ.zhi],
    [yearGZ.zhi, dayGZ.zhi],
    [yearGZ.zhi, hourGZ.zhi],
    [monthGZ.zhi, dayGZ.zhi],
    [monthGZ.zhi, hourGZ.zhi],
    [dayGZ.zhi, hourGZ.zhi],
  ];
  const diZhiRelations = dzPairs
    .filter(([a, b]) => a !== b)
    .map(([dz1, dz2]) => {
      const key1 = `${dz1}${dz2}`;
      const key2 = `${dz2}${dz1}`;
      const rel = DZ_RELATIONS[key1] ?? DZ_RELATIONS[key2];
      return {
        dz1,
        dz2,
        relation: rel?.relation ?? '比和',
        description: rel?.desc ?? `${dz1}与${dz2}比和，地支关系稳定。`,
        type: (rel?.type ?? '比和') as '相生' | '相克' | '比和' | '冲' | '合' | '刑' | '害' | '破',
      };
    });

  // 五行分析
  const wuxingTotal = Object.values(wuxing).reduce((a, b) => a + b, 0) || 1;
  const wuxingPct: Record<string, number> = {};
  (Object.entries(wuxing) as [string, number][]).forEach(([k, v]) => {
    wuxingPct[k] = Math.round((v / wuxingTotal) * 100);
  });

  const balanceLevel = (() => {
    const max = Math.max(...Object.values(wuxing));
    const min = Math.min(...Object.values(wuxing));
    if (max - min <= 2) return '均衡';
    if (wuxing[dayWuxing]! > 3) return '日主偏强';
    if (wuxing[dayWuxing]! < 1) return '日主偏弱';
    return max - min > 4 ? '严重失衡' : '偏颇';
  })();

  const compatibleEls: Record<string, string[]> = {
    wood: ['火', '水'],
    fire: ['土', '金'],
    earth: ['金', '木'],
    metal: ['水', '火'],
    water: ['木', '土'],
  };
  const avoidEls: Record<string, string[]> = {
    wood: ['金', '土'],
    fire: ['水', '木'],
    earth: ['木', '火'],
    metal: ['火', '土'],
    water: ['土', '金'],
  };

  // 强度分析
  const strengthLevel = score > 7 ? '极强' : score > 5.5 ? '偏强' : score > 4.5 ? '中和' : score > 3 ? '偏弱' : '极弱';
  const strengthAnalysis = dayStrength === 'strong'
    ? `日主${dayGan}气盛，五行中${WUXING_NAMES[dayWuxing]}气旺盛，克制我的${WUXING_NAMES[KE[dayWuxing] ?? '土']}较弱。行事宜顺势而为，不可过度压制。`
    : dayStrength === 'weak'
    ? `日主${dayGan}气弱，五行中${WUXING_NAMES[dayWuxing]}气不足，生我的${WUXING_NAMES[SHENG[dayWuxing] ?? '金']}力量偏弱。需要外部助力，宜主动寻求机遇。`
    : `日主${dayGan}气势中和，五行分布相对均衡，无明显偏枯。运势较为平稳，适应能力强。`;

  // 喜用神
  const xiYongExpl = dayStrength === 'strong'
    ? `日主偏旺，宜取${WUXING_NAMES[KE[dayWuxing] ?? '金']}为用神泄秀，取${WUXING_NAMES[SHENG[dayWuxing] ?? '木']}为喜神制衡。忌${WUXING_NAMES[dayWuxing]}再补。`
    : `日主偏弱，宜取${WUXING_NAMES[SHENG[dayWuxing] ?? '木']}为用神生扶，取${WUXING_NAMES[dayWuxing]}为喜神相助。忌${WUXING_NAMES[KE[dayWuxing] ?? '金']}再来克泄。`;

  // 大运
  const currentYear = new Date().getFullYear();
  const startAge = Math.floor((new Date().getFullYear() - year) / 10) * 10;
  const daYunDecades = [
    { age: String(startAge), years: `${year}-${year + 9}`, element: WUXING_NAMES[Object.keys(wuxing).reduce((a, b) => wuxing[a as WuxingKey] > wuxing[b as WuxingKey] ? a : b, 'water') as WuxingKey] ?? '水' },
    { age: String(startAge + 10), years: `${year + 10}-${year + 19}`, element: WUXING_NAMES[Object.keys(wuxing).reduce((a, b) => wuxing[a as WuxingKey] < wuxing[b as WuxingKey] ? a : b, 'earth') as WuxingKey] ?? '土' },
    { age: String(startAge + 20), years: `${year + 20}-${year + 29}`, element: WUXING_NAMES[Object.keys(wuxing).reduce((a, b) => wuxing[a as WuxingKey] > wuxing[b as WuxingKey] ? a : b, 'metal') as WuxingKey] ?? '金' },
  ].map(d => ({
    ...d,
    description: `${d.element}运：此十年${WUXING_NAMES[dayWuxing]}气${dayStrength === 'strong' ? '泄秀' : '生扶'}为主，机遇与挑战并存。`,
  }));

  const interpretation: BaziInterpretation = {
    pillars: {
      year: pillarDetails[0],
      month: pillarDetails[1],
      day: pillarDetails[2],
      hour: pillarDetails[3],
    },
    dayMaster: DAYMASTER_DETAIL[dayGan] ?? DAYMASTER_DETAIL['甲'],
    wuxing: {
      distribution: wuxing,
      percentages: wuxingPct,
      strongest: WUXING_NAMES[strongest],
      weakest: WUXING_NAMES[weakest],
      balance: balanceLevel as any,
      analysis: `五行分布：${Object.entries(wuxing).map(([k, v]) => `${WUXING_NAMES[k]}${v}个(${wuxingPct[k]}%)`).join('，')}。${balanceLevel}。`,
      compatible: compatibleEls[dayWuxing] ?? [],
      avoid: avoidEls[dayWuxing] ?? [],
    },
    strength: {
      level: strengthLevel as any,
      score,
      analysis: strengthAnalysis,
      trend: dayStrength === 'strong' ? '宜顺势而为，不可过于激进' : '宜蓄势待发，把握机遇',
    },
    xiYongShen: {
      xi: WUXING_NAMES[xiYong ?? weakest] ?? '',
      yong: WUXING_NAMES[shengUse ?? weakest] ?? '',
      explanation: xiYongExpl,
    },
    tianGanRelations,
    diZhiRelations,
    daYun: {
      summary: result.dayun.summary,
      decades: daYunDecades,
    },
  };

  return { result, interpretation };
}

// 兼容旧接口：只返回BaziResult，不含详细解读
export function calculateBazi(
  year: number, month: number, day: number, hour: number,
  gender: 'male' | 'female' = 'male', timezone: string = 'Asia/Shanghai'
): BaziResult {
  return calculateBaziWithInterpretation(year, month, day, hour, gender, timezone).result;
}
