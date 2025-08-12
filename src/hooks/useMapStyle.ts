import { useEffect, useMemo } from 'react';
import { styles } from '@/styles';

export function useMapStyle(map: React.RefObject<mapboxgl.Map | null>, style: string) {
  const selectedStyle = useMemo(() => {
    return styles.find(s => s.title === style)?.source || styles[0].source;
  }, [style]);

  useEffect(() => {
    if (!map.current) return;

    const applyStyle = () =>
      map.current?.setStyle(selectedStyle as any, {
        diff: false,
        localFontFamily: '',
        localIdeographFontFamily: '',
      });

    applyStyle();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStyle]);
}
