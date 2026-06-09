import { BREAKPOINT } from '@/constants/layout';

export function isSmallScreen(): boolean {
  return window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches;
}
