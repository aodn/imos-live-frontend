export function roundToTwo(num: number | null | undefined): number | null {
  if (num == null || num === undefined) return null;
  return Math.round(num * 100) / 100;
}
