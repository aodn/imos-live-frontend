import { useMapUIStore } from '@/store';
import { styles } from '@/styles';
import type { StyleSpecification } from 'mapbox-gl';
import { useEffect } from 'react';
import { useShallow } from 'zustand/shallow';

export function useMapStyle(map: React.RefObject<mapboxgl.Map | null>) {
  const { style } = useMapUIStore(
    useShallow(s => ({
      style: s.style,
    })),
  );
  useEffect(() => {
    const source = (styles.find(s => s.title === style) ?? styles[0]).source as
      | StyleSpecification
      | string;

    map.current?.setStyle(source, {
      diff: false,
      localFontFamily: undefined,
      localIdeographFontFamily: undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);
}
