export function clamp(value: number, min: number, max: number): number {
  if (min > max) [min, max] = [max, min];
  return Math.min(Math.max(value, min), max);
}

export function clampPercent(value: number, max: number = 100): number {
  return clamp(value, 0, max);
}
