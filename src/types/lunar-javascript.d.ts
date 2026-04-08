declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    getLunar(): Lunar;
    toString(): string;
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    static fromSolar(solar: Solar): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    isLeapMonth(): boolean;
    getDayGanZhi(): string;
    getMonthGanZhi(): string;
    getYearGanZhi(): string;
    getDayZhi(): string;
    toString(): string;
  }

  export class EightChar {
    static fromSolar(solar: Solar, gender: number): EightChar;
    getBaZi(): string[];
    getMonthGanZhi(): string;
    getDayGanZhi(): string;
    getYearGanZhi(): string;
  }

  const Solar: typeof Solar;
  const Lunar: typeof Lunar;
  const EightChar: typeof EightChar;

  export default { Solar, Lunar, EightChar };
}
