import {
  MapComponent,
  FloatingPanel,
  Sidebar,
  MenuComponent,
  MapControlPanel,
  MainSidebarContent,
} from '@/components';
import { useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 300 });
  };

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    <div className="overflow-hidden h-screen w-full">
      <Sidebar width={540} defaultOpen={true} sidebarContent={<MainSidebarContent />}>
        <>
          <div className="h-full w-full relative">
            <MapComponent ref={mapRef} />
            <MapControlPanel
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              className="absolute top-16 left-4 z-10"
            />
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
