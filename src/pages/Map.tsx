import { MapComponent, FloatingPanel, MenuComponent, Sidebar } from '@/components';
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
    //MapPage height is set to 100vh
    <div className="relative overflow-hidden h-screen w-full">
      <Sidebar
        width={600}
        defaultOpen={true}
        sidebarContent={
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam ipsum ex optio
            possimus
          </p>
        }
      >
        <>
          <MapComponent />
          <FloatingPanel
            bounds="parent"
            TriggerComp={CollapsibleTrigger}
            children={<MenuComponent />}
            initialPosition={{ x: 10, y: 20 }}
          />
        </>
      </Sidebar>
    </div>
  );
};
