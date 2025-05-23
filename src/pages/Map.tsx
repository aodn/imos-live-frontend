import { MapComponent, FloatingPanel, MenuComponent } from '@/components';
import { CollapsibleTrigger } from '@/components/FloatingPanel/CollapsibleTrigger';
import { useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect } from 'react';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    <div className="h-full w-full overflow-hidden">
      <MapComponent />
      <FloatingPanel TriggerComp={CollapsibleTrigger} children={<MenuComponent />} />
    </div>
  );
};
