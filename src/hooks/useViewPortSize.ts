import { debounce } from '@/utils/debounce';
import { useCallback, useState, useEffect } from 'react';

type Size = { width: number; height: number };

interface ViewportOptions {
  debounceMs?: number;
  widthBreakpoints?: Record<string, number>;
  heightBreakpoints?: Record<string, number>;
}

const DEFAULT_WIDTH_BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: Infinity };
const DEFAULT_HEIGHT_BREAKPOINTS = { sm: 480, md: 768, lg: 900, xl: Infinity };

function getBreakpoint(value: number, breakpoints: Record<string, number>): string {
  const sorted = Object.entries(breakpoints).sort(([, a], [, b]) => a - b);
  for (const [key, threshold] of sorted) {
    if (value < threshold) return key;
  }
  return sorted[sorted.length - 1]?.[0] || '';
}

export function useViewportSize(options: ViewportOptions = {}) {
  const [size, setSize] = useState<Size>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));
  const [widthBreakpoint, setWidthBreakpoint] = useState<string | undefined>();
  const [heightBreakpoint, setHeightBreakpoint] = useState<string | undefined>();

  const {
    debounceMs = 100,
    widthBreakpoints = DEFAULT_WIDTH_BREAKPOINTS,
    heightBreakpoints = DEFAULT_HEIGHT_BREAKPOINTS,
  } = options;

  const updateSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setSize({ width, height });
    setWidthBreakpoint(getBreakpoint(width, widthBreakpoints));
    setHeightBreakpoint(getBreakpoint(height, heightBreakpoints));
  }, [widthBreakpoints, heightBreakpoints]);

  useEffect(() => {
    const handler = debounceMs ? debounce(updateSize, debounceMs) : updateSize;

    // Initial size
    updateSize();

    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      if (typeof (handler as any).cancel === 'function') {
        (handler as any).cancel();
      }
    };
  }, [updateSize, debounceMs]);

  return { size, widthBreakpoint, heightBreakpoint };
}
