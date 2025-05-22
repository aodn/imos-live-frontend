import { MapComponent, MenuComponent, DragWrapper } from '@/components';
import { useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect } from 'react';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    <div className="h-full w-full border-8 border-imos-red">
      <MapComponent />
      <DragWrapper>
        <MenuComponent />
      </DragWrapper>
    </div>
  );
};
