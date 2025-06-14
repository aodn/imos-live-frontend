import { useRef, useCallback, useEffect } from 'react';

export function useRAFDFn(callback: () => void) {
  const rafIdRef = useRef<number>(null);
  const isScheduledRef = useRef(false);

  const scheduleUpdate = useCallback(() => {
    if (isScheduledRef.current) return;

    isScheduledRef.current = true;
    rafIdRef.current = requestAnimationFrame(() => {
      callback();
      isScheduledRef.current = false;
    });
  }, [callback]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return scheduleUpdate;
}
