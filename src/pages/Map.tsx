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
  ThermometerIcon,
  WaterSurfaceIcon,
  WaveIcon,
} from '@/components';
import { Product } from '@/constants';
import { useViewportSize } from '@/hooks';
import { useDrawerStore, refreshDates, closeLeftDrawer } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo } from 'react';

export const Map = () => {
  const { isSmallScreen } = useViewportSize();
  const leftDrawer = useDrawerStore(s => s.leftDrawer);

  useEffect(() => {
    refreshDates();
  }, []);

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
              { Icon: WaveIcon, product: Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT },
              { Icon: WaterSurfaceIcon, product: Product.GSLA_ANOMALY_SEA_LEVELS },
              { Icon: SatelliteIcon, product: Product.WAVE_BUOYS },
              { Icon: ThermometerIcon, product: Product.SST_ANOMALY_MOSAIC },
            ]}
          />
          <MapComponent key={isSmallScreen ? 'mobile' : 'desktop'} />
          <DateSelectionBar className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full pointer-events-none border" />
          <FloatingPanel
            wrapperClassName="w-14 md:min-w-60 bg-imos-light rounded-xl"
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
