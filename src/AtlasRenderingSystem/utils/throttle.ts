/**
 * Leading + trailing throttle. Invokes `fn` immediately, then at most once per
 * `waitMs` window, always firing once more with the latest args after the final
 * call. Used to cap the frequency of Mapbox's continuous `zoom` event, which
 * otherwise fires onMapMove every frame of a zoom animation.
 */
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
): (...args: A) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: A | null = null;

  return (...args: A) => {
    lastArgs = args;
    const now = Date.now();
    const remaining = waitMs - (now - last);

    if (remaining <= 0) {
      last = now;
      lastArgs = null;
      fn(...args);
    } else if (timer === null) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        if (lastArgs) fn(...lastArgs);
        lastArgs = null;
      }, remaining);
    }
  };
}
