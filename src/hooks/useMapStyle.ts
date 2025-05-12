import { useEffect, useMemo } from 'react';
import { styles } from '@/styles';

export const useMapStyle = (map: React.RefObject<mapboxgl.Map | null>, style: string) => {
  const selectedStyle = useMemo(() => {
    return styles.find(s => s.title === style)?.source || styles[0].source;
  }, [style]);

  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(selectedStyle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStyle]);
};
