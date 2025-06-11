/**
 * 在兩個顏色之間進行插值計算
 * @param color1 起始顏色（十六進制）
 * @param color2 目標顏色（十六進制）
 * @param ratio 插值比例（0-1）
 * @returns 插值後的顏色（十六進制）
 */
export function interpolateColor(color1: number, color2: number, ratio: number): number {
  const r1 = (color1 >> 16) & 0xFF;
  const g1 = (color1 >> 8) & 0xFF;
  const b1 = color1 & 0xFF;
  const r2 = (color2 >> 16) & 0xFF;
  const g2 = (color2 >> 8) & 0xFF;
  const b2 = color2 & 0xFF;

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return (r << 16) | (g << 8) | b;
} 