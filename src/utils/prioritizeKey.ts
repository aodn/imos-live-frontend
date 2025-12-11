type Item = Record<string, any>;

export function prioritizeKey<T extends Item>(arr: T[], key: keyof T, valueToPrioritize: any): T[] {
  return [...arr].sort((a, b) => {
    if (a[key] === valueToPrioritize && b[key] !== valueToPrioritize) return -1;
    if (a[key] !== valueToPrioritize && b[key] === valueToPrioritize) return 1;
    return 0;
  });
}
