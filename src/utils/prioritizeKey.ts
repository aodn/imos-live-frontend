type Item = Record<string, unknown>;

export function prioritizeKey<T extends Item, K extends keyof T>(
  arr: T[],
  key: K,
  valueToPrioritize: T[K],
): T[] {
  return [...arr].sort((a, b) => {
    if (a[key] === valueToPrioritize && b[key] !== valueToPrioritize) return -1;
    if (a[key] !== valueToPrioritize && b[key] === valueToPrioritize) return 1;
    return 0;
  });
}
