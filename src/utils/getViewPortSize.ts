type Size = { width: number; height: number };

interface ViewportInfo {
  size: Size;
  widthBreakpoint: string;
  heightBreakpoint: string;
}

interface ViewportOptions {
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

//simple method to get viewport size, which can be used outside component.
export function getViewportSize(options: ViewportOptions = {}): ViewportInfo {
  const {
    widthBreakpoints = DEFAULT_WIDTH_BREAKPOINTS,
    heightBreakpoints = DEFAULT_HEIGHT_BREAKPOINTS,
  } = options;

  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  const height = typeof window !== 'undefined' ? window.innerHeight : 0;

  return {
    size: { width, height },
    widthBreakpoint: getBreakpoint(width, widthBreakpoints),
    heightBreakpoint: getBreakpoint(height, heightBreakpoints),
  };
}
