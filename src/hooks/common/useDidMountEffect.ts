import type { DependencyList, EffectCallback } from 'react';
import { useEffect, useRef } from 'react';

/**
 * Custom hook that works like useEffect but skips the first render
 * @param {EffectCallback} effect - Effect callback function
 * @param {DependencyList} dependencies - Array of dependencies
 */
export function useDidMountEffect(effect: EffectCallback, dependencies: DependencyList = []) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
