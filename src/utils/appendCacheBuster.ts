/**
 * Appends a cache-busting query string to the given URL.
 * If the URL already has query parameters, it preserves them.
 *
 * @param url - The original URL
 * @returns The URL with a random query string appended
 */
export function appendCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  const cacheBuster = `_=${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  return `${url}${separator}${cacheBuster}`;
}
