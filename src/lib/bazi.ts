// 八字 - 客户端入口
export { calculateBazi, TIAN_GAN, DI_ZHI } from './bazi-calc';
export type { BaziResult, Pillar, WuxingCount } from './bazi-calc';
export type { BaziInterpretation } from '@/types/bazi';
import type { BaziResult } from './bazi-calc';
import type { BaziInterpretation } from '@/types/bazi';

export { calculateBaziWithInterpretation } from './bazi-calc';

export async function calculateBaziAsync(
  year: number, month: number, day: number, hour: number,
  gender: 'male' | 'female', timezone: string = 'Asia/Shanghai'
): Promise<{ result: BaziResult; interpretation: BaziInterpretation }> {
  const res = await fetch('/api/bazi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month, day, hour, gender, timezone }),
  });
  if (!res.ok) throw new Error('八字计算失败');
  const data = await res.json();
  return data as { result: BaziResult; interpretation: BaziInterpretation };
}
