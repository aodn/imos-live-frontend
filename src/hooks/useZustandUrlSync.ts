import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type SyncConfig<T> = {
  keys: (keyof T)[];
  getState: () => T;
  setState: (key: keyof T, value: any) => void;
  debounceMs?: number;
};

const serialize = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return btoa(JSON.stringify(value));
  } catch {
    return String(value);
  }
};

const deserialize = (value: string, originalValue: any): any => {
  if (!value) return originalValue;
  if (typeof originalValue === 'boolean') return value === 'true';
  if (typeof originalValue === 'number') {
    const num = Number(value);
    return isNaN(num) ? originalValue : num;
  }
  if (typeof originalValue === 'string') return value;
  if (typeof originalValue === 'object' && originalValue !== null) {
    try {
      return JSON.parse(atob(value));
    } catch {
      try {
        return JSON.parse(value);
      } catch {
        return originalValue;
      }
    }
  }
  return value;
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

  // On initial load: sync URL → Zustand
  useEffect(() => {
    if (!isInitialLoad.current) return;
    const currentState = getState();
    keys.forEach(key => {
      const urlValue = searchParams.get(key as string);
      if (urlValue !== null) {
        const deserializedValue = deserialize(urlValue, currentState[key]);
        setState(key, deserializedValue);
      }
    });

    isInitialLoad.current = false;
  }, [searchParams, keys, getState, setState]);

  // On Zustand change: Zustand → URL (with proper dependencies)
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
