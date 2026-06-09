import { useRef, useCallback, useEffect } from 'react';

/**
 * Throttles a callback to one invocation per animation frame, always replaying
 * with the *latest* args. Backward-compatible with the no-arg form: a callback
 * typed `() => void` infers `T = []` and returns `() => void`.
 */
export function useRAFDFn<T extends unknown[]>(callback: (...args: T) => void) {
  const rafIdRef = useRef<number | null>(null);
  const isScheduledRef = useRef(false);
  const latestArgsRef = useRef<T | null>(null);

  const scheduleUpdate = useCallback(
    (...args: T) => {
      latestArgsRef.current = args;

      if (isScheduledRef.current) return;

      isScheduledRef.current = true;

      rafIdRef.current = requestAnimationFrame(() => {
        if (latestArgsRef.current) {
          callback(...latestArgsRef.current);
        }
        isScheduledRef.current = false;
      });
    },
    [callback],
  );

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return scheduleUpdate;
}
