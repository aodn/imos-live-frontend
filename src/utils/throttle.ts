export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastTime = now;
      fn(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastTime = Date.now();
        timeout = null;
        fn(...args);
      }, remaining);
    }
  };
}
