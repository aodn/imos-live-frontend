/**
 * debounce - Returns a debounced version of the given function.
 *
 * Delays invoking the original function until `wait` ms have elapsed since
 * the last call to the debounced function. Useful for search input, resize,
 * and click-spam scenarios.
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
