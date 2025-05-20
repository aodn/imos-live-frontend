import { MapComponent, MenuComponent } from '@/components';
import { useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect } from 'react';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    <div className="h-screen w-screen">
      <MapComponent />
      <MenuComponent />
    </div>
  );
};
