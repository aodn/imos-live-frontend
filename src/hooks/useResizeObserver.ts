import { useEffect } from 'react';

export function useResizeObserver<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: () => void,
) {
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(callback);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, callback]);
}
