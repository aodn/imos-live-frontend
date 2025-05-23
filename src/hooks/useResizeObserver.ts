import { useEffect, useRef } from 'react';

export function useResizeObserver<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: (entry: ResizeObserverEntry) => void,
  debounceMs: number = 200,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(entries => {
      if (!entries[0]) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(entries[0]);
      }, debounceMs);
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [ref, callback, debounceMs]);
}
