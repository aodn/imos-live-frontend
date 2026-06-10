/**
 * debounce - Returns a debounced version of the given function.
 *
 * Delays invoking the original function until `wait` ms have elapsed since
 * the last call to the debounced function. Useful for search input, resize,
 * and click-spam scenarios.
 */
export function debounce<A extends unknown[]>(
  func: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: A) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
