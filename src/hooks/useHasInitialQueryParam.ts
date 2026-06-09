import { useState } from 'react';

/**
 * Whether a query param was present in the URL on first load — e.g. to detect a
 * deep link. Backed by a snapshot taken before the store rewrites the URL, so
 * it's unaffected by React Router (which doesn't observe `history.replaceState`)
 * or by the store stripping default-valued params (see `store/urlSync.ts`). The
 * value is fixed for the session.
 */
export function useHasInitialQueryParam(key: string): boolean {
  const [hasParam] = useState(() => new URLSearchParams(window.location.search).has(key));
  return hasParam;
}
