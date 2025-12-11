export function generateValueByPercentage({
  percentage,
  range,
  decimals,
}: {
  percentage: number;
  range: { min: number; max: number };
  decimals: number;
}) {
  return Number(((range.max - range.min) * percentage + range.min).toFixed(decimals));
}
