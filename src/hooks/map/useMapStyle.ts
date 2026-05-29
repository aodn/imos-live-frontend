import { useMapUIStore } from '@/store';
import { styles } from '@/styles';
import { useEffect } from 'react';
import { useShallow } from 'zustand/shallow';

export function useMapStyle(map: React.RefObject<mapboxgl.Map | null>) {
  const { style } = useMapUIStore(
    useShallow(s => ({
      style: s.style,
    })),
  );
  // TODO: when style changes, the particle configs did not persist, particle layer goes to initial default state, need to find a way to persist the particle layer configs when style changes.
  useEffect(() => {
    map.current?.setStyle(
      styles.find(s => s.title === style)?.source || (styles[0].source as any),
      { diff: false } as any,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);
}
