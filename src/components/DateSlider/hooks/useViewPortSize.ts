import { useEffect, useState } from 'react';
import { BREAKPOINT } from '../constants';

export function useViewportSize() {
  const [isSmallScreen, setIsSmallScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINT : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);

    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return { isSmallScreen };
}
