import { MapComponent, FloatingPanel, Sidebar, MenuComponent, MapControlPanel } from '@/components';
import { useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect } from 'react';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    //MapPage height is set to 100vh
    <div className="overflow-hidden h-screen w-full">
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
          <div className="h-full w-full relative">
            <MapComponent />
            <MapControlPanel className="absolute top-16 left-4 z-10" />
          </div>

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
