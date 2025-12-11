import { useRef, useCallback, useEffect } from 'react';

export function useRAFDFn<T extends any[]>(callback: (...args: T) => void) {
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
