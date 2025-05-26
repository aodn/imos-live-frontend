import { MapComponent, FloatingPanel, Sidebar, MenuComponent } from '@/components';
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
            collapsible
            // children={
            //   <FeaturesMenu
            //     features={[
            //       { icon: LayersIcon, label: 'Layers' },
            //       { icon: MapsIcon, label: 'Maps' },
            //       { icon: MeasuresIcon, label: 'Measurement' },
            //     ]}
            //   />
            // }
            children={<MenuComponent />}
            initialPosition={{ x: 10, y: 20 }}
          />
        </>
      </Sidebar>
    </div>
  );
};
