declare module 'lunar-javascript' {
  export interface Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    isLeapMonth(): boolean;
    getDayGanIndex(): number;
    getDayZhiIndex(): number;
    getMonthInfo(): { monthGanIndex: number; monthZhiIndex: number };
    toString(): string;
    toFullString(): string;
  }

  export interface LunarStatic {
    fromYmd(year: number, month: number, day: number): Lunar;
  }

  const Lunar: LunarStatic;
  export default Lunar;
  export { Lunar };
}
