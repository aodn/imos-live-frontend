import { deserialize, isSame, serialize } from '@/utils';
import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type SyncConfig<T> = {
  keys: (keyof T)[];
  getState: () => T;
  setState: (key: keyof T, value: any) => void;
  debounceMs?: number;
};

export function useZustandUrlSync<T extends Record<string, any>>({
  keys,
  getState,
  setState,
  debounceMs = 100,
}: SyncConfig<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialLoad = useRef(true);
  const debounceTimeout = useRef<NodeJS.Timeout>(null);

  const getCurrentStateSlice = useCallback(() => {
    const state = getState();
    return keys.reduce((slice, key) => {
      slice[key] = state[key];
      return slice;
    }, {} as Partial<T>);
  }, [getState, keys]);

  // On initial load: sync URL -> Zustand
  useEffect(() => {
    if (!isInitialLoad.current) return;
    const currentState = getState();
    keys.forEach(key => {
      const urlValue = searchParams.get(key as string);
      if (urlValue !== null) {
        const deserializedValue = deserialize(urlValue, typeof currentState[key]);
        if (deserializedValue === undefined || isSame(deserializedValue, currentState[key])) return;
        setState(key, deserializedValue);
      }
    });

    isInitialLoad.current = false;
  }, [searchParams, keys, getState, setState]);

  // On Zustand change: Zustand -> URL
  const stateSlice = getCurrentStateSlice();

  useEffect(() => {
    if (isInitialLoad.current) return;

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
