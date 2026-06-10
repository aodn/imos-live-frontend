/**
 * debounce - Returns a debounced version of the given function.
 *
 * The debounced function delays invoking the original function until after
 * the specified wait time has elapsed since the last time the debounced function was called.
 *
 * This is useful for preventing rapid, repeated calls — such as when handling
 * search input, resizing, or click spamming — by only executing the function
 * after the user has "paused" their actions.
 *
 * @template T - A function type that accepts any arguments.
 * @param func - The function to debounce.
 * @param wait - Delay in milliseconds to wait after the last call before invoking the function.
 * @returns A debounced function that mirrors the signature of the original.
 *
 * @example
 * const debouncedClick = debounce((lat, lng) => {
 *   fetchOceanData(lat, lng);
 * }, 300);
 *
 * map.on("click", (e) => {
 *   debouncedClick(e.lat, e.lng);
 * });
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
