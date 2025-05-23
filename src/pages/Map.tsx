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
    //Draggable element's parent needs to be relative so that overflow-hidden can work.
    <div className="relative overflow-hidden h-full w-full">
      <MapComponent />
      <FloatingPanel TriggerComp={CollapsibleTrigger} children={<MenuComponent />} />
    </div>
  );
};
