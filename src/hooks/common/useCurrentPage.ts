import type { PageName, PathName } from '@/routes';
import { routeMap } from '@/routes';
import { useLocation } from 'react-router-dom';

/**
 * Returns the logical page name based on current pathname.
 */
export function useCurrentPage(): PageName {
  const { pathname } = useLocation();
  return routeMap[pathname as PathName] ?? 'map';
}
