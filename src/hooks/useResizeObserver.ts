import { useEffect } from 'react';

export function useResizeObserver<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: (entry: ResizeObserverEntry) => void,
) {
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(entries => {
      // Only care about the first entry (the observed element)
      if (entries[0]) callback(entries[0]);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, callback]);
}
