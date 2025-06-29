import { getOceanCurrentDetails, getWaveBuoyDetails, OceanCurrentResponse } from '@/api';
import { WaveBuoyDetailsFeatureCollection } from '@/types';
import { useState, useEffect, useCallback } from 'react';

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

  const call = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        setData(result);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction],
  );

  // Run immediately on mount if enabled
  useEffect(() => {
    if (options.immediate) {
      call(...((options.args ?? []) as TArgs));
    }
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
