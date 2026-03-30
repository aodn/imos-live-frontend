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

  useEffect(() => {
    map.current?.setStyle(
      styles.find(s => s.title === style)?.source || (styles[0].source as any),
      { diff: false } as any,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);
}
