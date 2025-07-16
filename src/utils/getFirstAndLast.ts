export function getFirstAndLast(arr: any[]) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  if (arr.length === 1) return [arr[0]];

  return [arr[0], arr[arr.length - 1]];
}
