import { debounce } from '@/utils/debounce';
import { useCallback, useRef, useState, useEffect } from 'react';

type Size = { width: number; height: number };

interface Options {
  debounceMs?: number;
  widthBreakpoints?: Record<string, number>;
  heightBreakpoints?: Record<string, number>;
}

function getBreakpoint(value: number, breakpoints: Record<string, number>): string {
  const sorted = Object.entries(breakpoints).sort(([, a], [, b]) => a - b);
  for (const [key, threshold] of sorted) {
    if (value < threshold) return key;
  }
  return '';
}

export function useElementSize<T extends HTMLElement>(options: Options = {}) {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [widthBreakpoint, setWidthBreakpoint] = useState<string | undefined>();
  const [heightBreakpoint, setHeightBreakpoint] = useState<string | undefined>();

  const {
    debounceMs = 100,
    widthBreakpoints = { sm: 640, md: 768, lg: 1024, xl: Infinity },
    heightBreakpoints = { sm: 480, md: 768, lg: 900, xl: Infinity },
  } = options;

  const updateSize = useCallback((entry: ResizeObserverEntry) => {
    const { width, height } = entry.contentRect;
    setSize({ width, height });
    if (widthBreakpoints) setWidthBreakpoint(getBreakpoint(width, widthBreakpoints));
    if (heightBreakpoints) setHeightBreakpoint(getBreakpoint(height, heightBreakpoints));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handler = useCallback(() => {
    return debounceMs ? debounce(updateSize, debounceMs) : updateSize;
  }, [debounceMs, updateSize]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) handler()(entries[0]);
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, [handler]);

  return { ref, size, widthBreakpoint, heightBreakpoint };
}
