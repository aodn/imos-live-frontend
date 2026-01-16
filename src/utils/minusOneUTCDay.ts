export function minusOneUTCDay(date: Date): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}
