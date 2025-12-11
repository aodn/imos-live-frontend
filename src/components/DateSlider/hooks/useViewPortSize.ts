import { useEffect, useState } from 'react';

export function useViewportSize() {
  const [isSmallScreen, setIsSmallScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return { isSmallScreen };
}
