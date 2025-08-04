import { getDate3DaysAgo, isSameDay } from '@/utils';

/**
 * if dataset is 3 days ago, then disable cache, otherwise ebable cache.
 * @param dataset expted to be as 'yyyy--mm--dd'
 * @returns
 */
export function cacheConfig(dataset: string) {
  return {
    gcTime: isSameDay(getDate3DaysAgo(), new Date(dataset)) ? 0 : 60 * 60 * 1000,
    staleTime: isSameDay(getDate3DaysAgo(), new Date(dataset)) ? 0 : 60 * 60 * 1000,
  };
}
