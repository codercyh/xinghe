/**
 * 今日运势 — 基于日期 + 出生信息生成稳定的每日运势
 * 同一天同一个人 → 同样的结果；换一天 → 结果变化
 */

export interface DailyFortune {
  // 四维评分 (0-100)
  career: number;      // 事业
  love: number;        // 感情
  wealth: number;      // 财运
  health: number;      // 健康
  // 综合评分
  overall: number;
  // 幸运元素
  luckyColor: { name: string; hex: string };
  luckyNumber: number;
  luckyDirection: string;
  // 今日金句
  quote: string;
  // 综合运势描述
  summary: string;
  // 宜/忌
  goodFor: string[];
  badFor: string[];
  // 日期标识
  dateKey: string;
}

// ─── 确定性哈希（同输入同输出） ───
function hashCode(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// 简易伪随机数生成器（Mulberry32）
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── 金句库 ───
const QUOTES = [
  '星辰不负赶路人，时光不负有心人',
  '你的气场今天格外强大，大胆往前走',
  '保持内心的宁静，好运自会降临',
  '今天适合做一些大胆的决定',
  '放下执念，顺其自然反而柳暗花明',
  '与其焦虑未来，不如享受当下',
  '你的直觉比想象中更准，听从内心',
  '今天是充电日，给自己一些温柔',
  '贵人就在身边，留意身边人的暗示',
  '你的创造力正在高峰期，抓住灵感',
  '小事上退一步，大事上不妥协',
  '今天的付出，会在未来加倍回报',
  '心态平和时，整个宇宙都在帮你',
  '试着换个角度看问题，答案就在那里',
  '今天适合整理思绪，重新出发',
  '你比自己想象的要强大得多',
  '缘分天注定，但努力不白费',
  '跟随你的热情，它会带你去对的地方',
  '不必事事完美，做到最好就够了',
  '今天是好日子，值得被记住',
  '木秀于林风必摧之，低调行事为上',
  '安静的力量往往比喧哗更有穿透力',
  '相信过程，结果不会让你失望',
  '与人为善，善意会以你意想不到的方式回来',
  '今天的小善举，会为未来埋下大福报',
  '财不入急门，稳扎稳打才是正道',
  '月有阴晴圆缺，坦然接受起伏',
  '你的能量正在蓄积，爆发只是时间问题',
  '有些门关了，是因为更好的窗已经打开',
  '今天适合和重要的人好好聊聊',
];

// ─── 运势描述模板 ───
const CAREER_LEVELS = [
  '事业运偏弱，今天适合蛰伏积蓄能量，避免做重大决策',
  '事业上有些小阻力，保持耐心，稳步推进即可',
  '事业运平稳，按部就班就好，会有小进展',
  '事业运不错，适合推进重要项目，贵人可能出现',
  '事业运大旺！今天是出击的好时机，把握机会！',
];

const LOVE_LEVELS = [
  '感情方面今天要多点耐心，避免因小事起争执',
  '感情运一般，适合独处思考，给彼此一些空间',
  '感情运平稳，日常的温馨小互动能增进感情',
  '桃花运不错，单身者有机会遇到心动的人',
  '感情运极佳！浪漫的能量包围着你，好好享受',
];

const WEALTH_LEVELS = [
  '财运偏弱，今天不宜大额消费或投资',
  '财运一般，守住钱包，别冲动消费',
  '财运平稳，正财有保障，理性消费',
  '财运不错，可能有意外收入或好消息',
  '财运旺盛！适合谈薪资、签合同、理财布局',
];

const HEALTH_LEVELS = [
  '身体需要特别注意休息，早睡早起很重要',
  '精力一般，注意饮食均衡，避免过度劳累',
  '身体状态还不错，保持日常锻炼的习惯',
  '精力充沛，适合运动和户外活动',
  '身心状态极佳！能量满满的一天',
];

// ─── 幸运颜色库 ───
const LUCKY_COLORS = [
  { name: '皇室紫', hex: '#7C3AED' },
  { name: '星空蓝', hex: '#3B82F6' },
  { name: '翡翠绿', hex: '#10B981' },
  { name: '樱花粉', hex: '#EC4899' },
  { name: '琥珀金', hex: '#F59E0B' },
  { name: '珊瑚红', hex: '#EF4444' },
  { name: '薄荷青', hex: '#06B6D4' },
  { name: '薰衣草', hex: '#A78BFA' },
  { name: '蜜桃橙', hex: '#F97316' },
  { name: '月光银', hex: '#94A3B8' },
  { name: '森林绿', hex: '#22C55E' },
  { name: '天际蓝', hex: '#38BDF8' },
];

const LUCKY_DIRECTIONS = ['东', '南', '西', '北', '东南', '东北', '西南', '西北'];

// ─── 宜忌库 ───
const GOOD_FOR_POOL = [
  '签约', '面试', '表白', '旅行', '学习', '运动',
  '聚会', '购物', '理财', '创作', '搬家', '出行',
  '谈判', '社交', '冥想', '约会', '剪发', '求职',
  '写作', '读书', '烹饪', '园艺',
];

const BAD_FOR_POOL = [
  '冲动消费', '争吵', '熬夜', '借钱', '赌博',
  '酗酒', '懒散', '拖延', '八卦', '纠结',
  '过度承诺', '冒险投资', '做重大决定', '忽略健康',
];

// ─── 核心函数 ───
export function getDailyFortune(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female'
): DailyFortune {
  // 用今天日期 + 出生信息作为种子
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const seed = hashCode(`${dateKey}-${year}-${month}-${day}-${hour}-${gender}`);
  const rand = mulberry32(seed);

  // 生成四维评分（30-98 之间，避免太极端）
  const genScore = () => Math.floor(rand() * 68) + 30;
  const career = genScore();
  const love = genScore();
  const wealth = genScore();
  const health = genScore();
  const overall = Math.round(career * 0.3 + love * 0.25 + wealth * 0.25 + health * 0.2);

  // 选取各维度描述
  const getLevel = (score: number) => score < 45 ? 0 : score < 55 ? 1 : score < 70 ? 2 : score < 85 ? 3 : 4;

  // 幸运元素
  const luckyColor = LUCKY_COLORS[Math.floor(rand() * LUCKY_COLORS.length)];
  const luckyNumber = Math.floor(rand() * 9) + 1;
  const luckyDirection = LUCKY_DIRECTIONS[Math.floor(rand() * LUCKY_DIRECTIONS.length)];

  // 金句
  const quote = QUOTES[Math.floor(rand() * QUOTES.length)];

  // 宜忌（各选 3 个不重复）
  const shuffled = (arr: string[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const goodFor = shuffled(GOOD_FOR_POOL).slice(0, 3);
  const badFor = shuffled(BAD_FOR_POOL).slice(0, 3);

  // 综合描述
  const overallDesc = overall >= 80
    ? '今日整体运势极佳，星象对你格外眷顾。不管做什么事都能事半功倍，好好把握这难得的好日子！'
    : overall >= 65
    ? '今日运势不错，大部分事情都能顺利推进。保持积极的心态，好事会接踵而来。'
    : overall >= 50
    ? '今日运势平稳，没有太大的波动。按自己的节奏做事就好，稳中求进。'
    : '今日运势偏弱，适合低调行事、休养生息。不要强求结果，顺其自然就好。';

  const summary = [
    CAREER_LEVELS[getLevel(career)],
    LOVE_LEVELS[getLevel(love)],
    WEALTH_LEVELS[getLevel(wealth)],
    HEALTH_LEVELS[getLevel(health)],
    overallDesc,
  ].join('\n\n');

  return {
    career,
    love,
    wealth,
    health,
    overall,
    luckyColor,
    luckyNumber,
    luckyDirection,
    quote,
    summary,
    goodFor,
    badFor,
    dateKey,
  };
}
