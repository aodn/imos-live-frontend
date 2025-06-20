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
  Drawer,
  LayersIndicator,
  WaterSurfaceIcon,
  WaveIcon,
  SatelliteIcon,
} from '@/components';
import { useDrawerStore, useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef } from 'react';
import { useViewportSize } from '@/hooks';
import { Header as MapHeader } from '@/components';
import { useShallow } from 'zustand/shallow';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const { widthBreakpoint } = useViewportSize();
  const isMobileOrTablet = ['sm', 'md'].includes(widthBreakpoint || '');

  const { leftDrawer, closeLeftDrawer } = useDrawerStore(
    useShallow(s => ({
      leftDrawer: s.leftDrawer,
      closeLeftDrawer: s.closeLeftDrawer,
    })),
  );

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  const mapContent = useMemo(
    () => (
      <div className="h-full w-full flex flex-col">
        <MapHeader
          className="md:hidden"
          image={{
            src: 'src/assets/imos_logo_with_title.png',
            alt: 'IMOS Logo',
            height: 63,
            width: 147,
          }}
          title="IMOS Live"
        />
        <div className="flex-1 w-full relative">
          <Drawer
            isOpen={leftDrawer.isOpen}
            closeDrawer={closeLeftDrawer}
            snapMode={leftDrawer.snapMode}
            direction={leftDrawer.direction}
            snapPoints={['85%']}
            children={leftDrawer.content}
            className="absolute!"
            handleHidden
          />
          <LayersIndicator
            className="md:hidden absolute top-10 left-4 z-10"
            layers={[
              { Icon: WaveIcon, label: 'particles' },
              { Icon: WaterSurfaceIcon, label: 'overlay' },
              { Icon: SatelliteIcon, label: 'circle' },
            ]}
          />
          <MapComponent ref={mapRef} key={isMobileOrTablet ? 'mobile' : 'desktop'} />
          <MapControlPanel ref={mapRef} className="absolute top-10 left-0 z-10 hidden md:block" />
          <DateSelectionBar className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full pointer-events-none" />
          <FloatingPanel
            wrapperClassName="w-14 md:w-fit bg-emerald-300  rounded-xl"
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
        </div>

        <UrlSyncHandler />
      </div>
    ),
    [
      closeLeftDrawer,
      isMobileOrTablet,
      leftDrawer.content,
      leftDrawer.direction,
      leftDrawer.isOpen,
      leftDrawer.snapMode,
    ],
  );

  return (
    <div className="overflow-hidden h-screen w-full">
      {isMobileOrTablet ? (
        <div className="h-full w-full">{mapContent}</div>
      ) : (
        <Sidebar width={540} defaultOpen={true} sidebarContent={<MainSidebarContent />}>
          {mapContent}
        </Sidebar>
      )}
    </div>
  );
};
