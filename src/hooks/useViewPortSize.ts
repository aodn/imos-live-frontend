import { BREAKPOINT } from '@/constants';
import { useEffect, useState } from 'react';

export function useViewportSize() {
  const [isSmallScreen, setIsSmallScreen] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches
      : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);

    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return { isSmallScreen };
}
