import { getOceanCurrentDetails, getWaveBuoyDetails, OceanCurrentResponse } from '@/api';
import { WaveBuoyDetailsFeatureCollection } from '@/types';
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAsyncOptions<TArgs extends any[]> {
  immediate?: boolean;
  args?: TArgs;
}

export function useAsync<TData, TArgs extends any[] = []>(
  asyncFunction: (...args: TArgs) => Promise<TData>,
  options: UseAsyncOptions<TArgs> = {},
) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const call = useCallback(
    async (...args: TArgs) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const currentController = abortControllerRef.current;

      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);

        // Only update state if this request wasn't aborted
        if (!currentController.signal.aborted) {
          setData(result);
        }
      } catch (err: any) {
        if (!currentController.signal.aborted) {
          setError(err?.response?.data?.message || err.message || 'Unknown error');
        }
      } finally {
        if (!currentController.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [asyncFunction],
  );

  // Run immediately on mount if enabled
  useEffect(() => {
    if (options.immediate) {
      call(...((options.args ?? []) as TArgs));
    }

    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, options.immediate]);

  return { data, error, loading, refetch: call };
}

export function useWaveBuoyDetails(date: string, buoy: string) {
  return useAsync<WaveBuoyDetailsFeatureCollection, [string, string]>(getWaveBuoyDetails, {
    immediate: true,
    args: [date, buoy],
  });
}

export function useOceanCurrentDetials(date: string, lat: number, lon: number) {
  return useAsync<OceanCurrentResponse, [string, number, number]>(getOceanCurrentDetails, {
    immediate: false,
    args: [date, lat, lon],
  });
}
