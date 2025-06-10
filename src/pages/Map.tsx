import {
  MapComponent,
  FloatingPanel,
  Sidebar,
  MapControlPanel,
  MainSidebarContent,
  FeaturesMenu,
  LayersIcon,
  MapsIcon,
  MeasuresIcon,
  DateSelectionBar,
  UrlSyncHandler,
} from '@/components';
import { useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    <div className="overflow-hidden h-screen w-full">
      <Sidebar width={540} defaultOpen={true} sidebarContent={<MainSidebarContent />}>
        <>
          <div className="h-full w-full relative">
            <MapComponent ref={mapRef} />
            <MapControlPanel ref={mapRef} className="absolute top-16 left-4 z-10" />
            <DateSelectionBar className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-full" />
          </div>

          <FloatingPanel
            boundary="parent"
            collapsible
            children={
              <FeaturesMenu
                features={[
                  { icon: LayersIcon, label: 'Layers' },
                  { icon: MapsIcon, label: 'Maps' },
                  { icon: MeasuresIcon, label: 'Measurement' },
                ]}
              />
            }
            initialPosition={{ x: 10, y: 20 }}
          />
          <UrlSyncHandler />
        </>
      </Sidebar>
    </div>
  );
};
//TODO:  2. change the name pattern of dataset in Date format.
// 3. get valid dataset from server instead of generating last 7 days dataset locally.
// 4. update the serverside endpoint getlast7days to getdays that accept a query parameter deciding the number of days' dataset.
// 5. add error handling when one day's dataset is invalid.
