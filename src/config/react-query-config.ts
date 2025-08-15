import { getDate3DaysAgo, isSameDay } from '@/utils';

/**
 * if dataset is 3 days ago, then disable cache, otherwise ebable cache.
 * @param dataset expted to be as 'yyyy--mm--dd'.
 * @param duration expected to be minute unit.
 * @returns
 */
export function cacheConfig(dataset: string, duration?: number) {
  return {
    gcTime: isSameDay(getDate3DaysAgo(), new Date(dataset)) ? (duration ?? 1000) : 60 * 60 * 1000,
    staleTime: isSameDay(getDate3DaysAgo(), new Date(dataset))
      ? (duration ?? 1000)
      : 60 * 60 * 1000,
  };
}
