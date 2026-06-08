import { BREAKPOINT } from '@/constants';

export function isSmallScreen(): boolean {
  return window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches;
}
