import { serialize } from '@/utils';
import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type SyncConfig<T> = {
  keys: (keyof T)[];
  getState: () => T;
  debounceMs?: number;
};

export function useZustandUrlSync<T extends Record<string, any>>({
  keys,
  getState,
  debounceMs = 100,
}: SyncConfig<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceTimeout = useRef<NodeJS.Timeout>(null);

  const getCurrentStateSlice = useCallback(() => {
    const state = getState();
    return keys.reduce((slice, key) => {
      slice[key] = state[key];
      return slice;
    }, {} as Partial<T>);
  }, [getState, keys]);

  // On Zustand change: Zustand -> URL
  const stateSlice = getCurrentStateSlice();

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      let changed = false;

      keys.forEach(key => {
        const value = stateSlice[key];
        const serializedValue = serialize(value);

        const currentParam = newParams.get(key as string);

        if (serializedValue && currentParam !== serializedValue) {
          newParams.set(key as string, serializedValue);
          changed = true;
        } else if (!serializedValue && currentParam !== null) {
          newParams.delete(key as string);
          changed = true;
        }
      });

      if (changed) {
        setSearchParams(newParams, { replace: true });
      }
    }, debounceMs);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.values(stateSlice), searchParams, setSearchParams, keys, debounceMs]);
}
