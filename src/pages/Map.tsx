import logImage from '@/assets/imos_logo_with_title.png';
import {
  DateSelectionBar,
  Drawer,
  FeaturesMenu,
  FloatingPanel,
  LayersIcon,
  LayersIndicator,
  MainSidebarContent,
  MapComponent,
  Header as MapHeader,
  MapsIcon,
  SatelliteIcon,
  Sidebar,
  WaterSurfaceIcon,
  WaveIcon,
} from '@/components';
import { useViewportSize } from '@/hooks';
import { useDrawerStore, useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);
  const { widthBreakpoint } = useViewportSize();
  const isSmallScreen = ['sm', 'md'].includes(widthBreakpoint || '');

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
            src: logImage,
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
            contentWrapperClassName="px-2"
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
          <MapComponent key={isSmallScreen ? 'mobile' : 'desktop'} />
          <DateSelectionBar className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full pointer-events-none" />
          <FloatingPanel
            wrapperClassName="w-14 md:w-fit bg-imos-light rounded-xl"
            boundary="parent"
            collapsible
            initialOpen={!isSmallScreen}
            children={
              <FeaturesMenu
                features={[
                  { icon: LayersIcon, label: 'Options' },
                  { icon: MapsIcon, label: 'Maps' },
                ]}
              />
            }
            initialPosition={{ x: 10, y: 20 }}
          />
        </div>
      </div>
    ),
    [
      closeLeftDrawer,
      isSmallScreen,
      leftDrawer.content,
      leftDrawer.direction,
      leftDrawer.isOpen,
      leftDrawer.snapMode,
    ],
  );

  return (
    <div className="overflow-hidden h-full w-full">
      {isSmallScreen ? (
        <div className="h-full w-full">{mapContent}</div>
      ) : (
        <Sidebar width={540} defaultOpen={true} sidebarContent={<MainSidebarContent />}>
          {mapContent}
        </Sidebar>
      )}
    </div>
  );
};
