declare module 'lunar-javascript' {
  export interface MonthInfo {
    monthGanIndex: number;
    monthZhiIndex: number;
  }

  export interface LunarStatic {
    fromYmd(year: number, month: number, day: number): Lunar;
  }

  export interface Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    isLeapMonth(): boolean;
    getDayGanIndex(): number;
    getDayZhiIndex(): number;
    getMonthInfo(): MonthInfo;
    toString(): string;
  }

  const Lunar: LunarStatic;
  export default Lunar;
}
