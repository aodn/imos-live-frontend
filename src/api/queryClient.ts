import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //even though over staltime, react query will not refetch, unless manually trigger or by refetchOnWindowFocus, refetchOnReconnect.
      staleTime: 5 * 60 * 1000, // 5 minutes - how long the data will become stale.
      gcTime: 30 * 60 * 1000, // 30 minutes - how long the data will be removed from cache memory. this should be longer than staltime.
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      experimental_prefetchInRender: true,
    },
  },
});
