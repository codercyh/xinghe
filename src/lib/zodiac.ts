// 星座数据
export const ZODIAC_SIGNS = [
  { name: '白羊座', symbol: '♈', start: [3, 21], end: [4, 19] },
  { name: '金牛座', symbol: '♉', start: [4, 20], end: [5, 20] },
  { name: '双子座', symbol: '♊', start: [5, 21], end: [6, 20] },
  { name: '巨蟹座', symbol: '♋', start: [6, 21], end: [7, 22] },
  { name: '狮子座', symbol: '♌', start: [7, 23], end: [8, 22] },
  { name: '处女座', symbol: '♍', start: [8, 23], end: [9, 22] },
  { name: '天秤座', symbol: '♎', start: [9, 23], end: [10, 22] },
  { name: '天蝎座', symbol: '♏', start: [10, 23], end: [11, 21] },
  { name: '射手座', symbol: '♐', start: [11, 22], end: [12, 21] },
  { name: '摩羯座', symbol: '♑', start: [12, 22], end: [1, 19] },
  { name: '水瓶座', symbol: '♒', start: [1, 20], end: [2, 18] },
  { name: '双鱼座', symbol: '♓', start: [2, 19], end: [3, 20] },
];

export const ZODIAC_TRAITS: Record<string, string> = {
  '白羊座': '充满活力与冒险精神，直率冲动，喜欢挑战。',
  '金牛座': '踏实可靠，追求稳定与安全感，耐心十足。',
  '双子座': '好奇心强，思维敏捷，善于沟通与表达。',
  '巨蟹座': '温柔细腻，重视家庭与情感，直觉敏锐。',
  '狮子座': '自信大方，喜欢被关注，有领导力。',
  '处女座': '追求完美，注重细节，善于分析与整理。',
  '天秤座': '优雅友善，追求和谐，擅长社交与平衡。',
  '天蝎座': '神秘深沉，意志坚定，直觉敏锐有洞察力。',
  '射手座': '乐观自由，爱冒险，热爱探索与旅行。',
  '摩羯座': '务实上进，有耐心，目标导向强。',
  '水瓶座': '独立创新，人道主义，思维独特不爱受束缚。',
  '双鱼座': '浪漫敏感，富有同理心，富有想象力。',
};

export const MOON_TRAITS: Record<string, string> = {
  '白羊座': '内心充满热情与冲动，情绪来得快去得也快。',
  '金牛座': '渴望安稳与舒适，情绪稳定，注重感官享受。',
  '双子座': '思维活跃，情绪变化快，喜欢新鲜感。',
  '巨蟹座': '情感丰富细腻，渴望被爱与安全感。',
  '狮子座': '内心渴望被认可与欣赏，自尊心强。',
  '处女座': '内心追求完美，习惯自我反省与挑剔。',
  '天秤座': '渴望和谐的人际关系，情绪受他人影响。',
  '天蝎座': '情感深沉而强烈，洞察力极强。',
  '射手座': '内心向往自由与远方，热爱冒险与哲学。',
  '摩羯座': '内敛务实，情绪不外露，渴望成就。',
  '水瓶座': '思维独立，情感疏离，关注宏观与人类命运。',
  '双鱼座': '情感丰沛而敏感，容易感同身受，直觉敏锐。',
};

export const RISING_TRAITS: Record<string, string> = {
  '白羊座': '外在形象直接、有冲劲，给人充满能量的印象。',
  '金牛座': '外在稳重踏实，给人可靠、有品味的印象。',
  '双子座': '外在机智健谈，给人聪明、好奇心强的印象。',
  '巨蟹座': '外在温和亲切，给人亲切、有爱心的印象。',
  '狮子座': '外在自信耀眼，吸引他人目光，气场强大。',
  '处女座': '外在整洁有礼，给人细心、专业的印象。',
  '天秤座': '外在优雅得体，善于社交，给人好感的印象。',
  '天蝎座': '外在神秘有深度，令人好奇，忍不住想探究。',
  '射手座': '外在乐观开朗，给人自由、洒脱的印象。',
  '摩羯座': '外在严肃认真，给人可靠、有野心的印象。',
  '水瓶座': '外在独特有个性，不随波逐流，令人印象深刻。',
  '双鱼座': '外在柔和梦幻，给人浪漫、艺术家气质的印象。',
};

// 获取太阳星座
export function getSunSign(month: number, day: number) {
  for (const sign of ZODIAC_SIGNS) {
    if (sign.name === '摩羯座') {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return sign;
    } else {
      if (
        (month === sign.start[0] && day >= sign.start[1]) ||
        (month === sign.end[0] && day <= sign.end[1])
      ) {
        return sign;
      }
    }
  }
  return ZODIAC_SIGNS[0];
}

// 简化版月亮/上升星座（基于哈希偏移计算）
export function getMoonSign(year: number, month: number, day: number) {
  const offset = (year * 12 + month * 30 + day) % 12;
  return ZODIAC_SIGNS[(offset + 1) % 12];
}

export function getRisingSign(year: number, month: number, day: number, hour: number) {
  const offset = (year + month * 31 + day * 23 + hour * 7) % 12;
  return ZODIAC_SIGNS[(offset + 2) % 12];
}

// 构建完整星座数据
export function buildZodiacData(year: number, month: number, day: number, hour: number) {
  const sun = getSunSign(month, day);
  const moon = getMoonSign(year, month, day);
  const rising = getRisingSign(year, month, day, hour);

  return {
    sun: {
      ...sun,
      trait: ZODIAC_TRAITS[sun.name] ?? '',
    },
    moon: {
      ...moon,
      trait: MOON_TRAITS[moon.name] ?? '',
      lunarDate: '每日流转',
    },
    rising: {
      ...rising,
      trait: RISING_TRAITS[rising.name] ?? '',
      start: '由时辰决定',
      end: '',
    },
  };
}
