import { useCallback, useRef, useEffect } from 'react';

/**
 * Ensures the latest version of the callback is used inside effects, debounced handlers, etc.
 * This is to ensure the callback fn will be stale due to closure when passed into functions like debounce as callback fn.
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);

  // Always keep ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return a stable function that calls the latest callback
  return useCallback(
    ((...args: any[]) => {
      return callbackRef.current(...args);
    }) as T,
    [],
  );
}
