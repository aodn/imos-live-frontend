import { Helmet } from 'react-helmet-async';
import logImage from '@/assets/imos_logo_with_title.png';
import {
  DateSelectionBar,
  DragWrapper,
  Drawer,
  FeaturesMenu,
  FloatingPanel,
  LayersIcon,
  LayersIndicator,
  MainSidebarContent,
  MapComponent,
  Header as MapHeader,
  MapsIcon,
  Sidebar,
  ThermometerIcon,
  WaterSurfaceIcon,
  WaveBuoyIcon,
  WaveIcon,
} from '@/components';
import { PRODUCT } from '@/constants';
import { useViewportSize } from '@/hooks';
import { useDrawerStore, refreshDates, closeLeftDrawer, openLeftDrawer } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useMemo, useState } from 'react';

const MODE_TITLE_PREFIX: Record<string, string> = {
  development: '[DEV] ',
  edge: '[EDGE] ',
};

const DATE_SELECTION_BAR_DRAG_HANDLE = 'date-selection-bar-drag-handle';

export function Map() {
  const { isSmallScreen } = useViewportSize();
  const leftDrawer = useDrawerStore(s => s.leftDrawer);
  const [dateBarCollapsed, setDateBarCollapsed] = useState(false);
  const toggleDateBarCollapsed = useCallback(() => setDateBarCollapsed(prev => !prev), []);

  useEffect(() => {
    refreshDates();
  }, []);

  const mapContent = useMemo(
    () => (
      <div className="h-full w-full flex flex-col">
        <MapHeader
          className="md:hidden"
          onMenuClick={() => openLeftDrawer(<MainSidebarContent />)}
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
            closeIconHidden
          />
          <LayersIndicator
            className="md:hidden absolute top-10 left-4 z-10"
            layers={[
              { Icon: WaveIcon, product: PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT },
              { Icon: WaterSurfaceIcon, product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS },
              { Icon: WaveBuoyIcon, product: PRODUCT.WAVE_BUOYS },
              { Icon: ThermometerIcon, product: PRODUCT.MOORING_TIMESERIES_REALTIME },
              { Icon: ThermometerIcon, product: PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC },
              { Icon: ThermometerIcon, product: PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC },
              { Icon: ThermometerIcon, product: PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY_MOSAIC },
            ]}
          />
          <MapComponent key={isSmallScreen ? 'mobile' : 'desktop'} />
          <DragWrapper
            boundary="parent"
            dragHandleClassName={DATE_SELECTION_BAR_DRAG_HANDLE}
            className={dateBarCollapsed ? 'w-fit' : 'md:w-full'}
            initialPosition={{ x: 0, y: 8 }}
            relative="bottomLeft"
          >
            <DateSelectionBar
              dragHandleClassName={DATE_SELECTION_BAR_DRAG_HANDLE}
              collapsed={dateBarCollapsed}
              onToggleCollapsed={toggleDateBarCollapsed}
            />
          </DragWrapper>

          <FloatingPanel
            wrapperClassName="w-14 md:min-w-72 bg-imos-light rounded-xl"
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
      dateBarCollapsed,
      toggleDateBarCollapsed,
    ],
  );

  return (
    <>
      <Helmet>
        <title>{`${MODE_TITLE_PREFIX[import.meta.env.MODE] ?? ''}Map — IMOS Live`}</title>
        <meta
          name="description"
          content="Explore real-time ocean data including sea surface temperature, geostrophic currents, and wave buoys across the Australasian region."
        />
      </Helmet>
      <div className="overflow-hidden h-full w-full">
        {isSmallScreen ? (
          <div className="h-full w-full">{mapContent}</div>
        ) : (
          <Sidebar width={540} sidebarContent={<MainSidebarContent />}>
            {mapContent}
          </Sidebar>
        )}
      </div>
    </>
  );
}
