// 八字 - 客户端入口
export { calculateBazi, TIAN_GAN, DI_ZHI } from './bazi-calc';
export type { BaziResult, Pillar, WuxingCount } from './bazi-calc';
import type { BaziResult } from './bazi-calc';

// 异步计算（通过 API route）
export async function calculateBaziAsync(
  year: number, month: number, day: number, hour: number,
  gender: 'male' | 'female', timezone: string = 'Asia/Shanghai'
): Promise<BaziResult> {
  const res = await fetch('/api/bazi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month, day, hour, gender, timezone }),
  });
  if (!res.ok) throw new Error('八字计算失败');
  const data = await res.json();
  return data as BaziResult;
}
