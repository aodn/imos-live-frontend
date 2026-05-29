import {
  useDistanceMeasurementLayers,
  useDistanceMeasurementLayersEventHandler,
  useMapInitialization,
  useMapResize,
  useMapStyle,
  useParticleAtlasLayer,
  useTilesLayersEventHandlers,
  useScalarAtlasLayer,
  useWaveBuoysLayer,
  useWaveBuoysLayerEventHandler,
  useWorldLandLayer,
} from '@/hooks';
import { useMapUIStore } from '@/store';
import { cn, isSmallScreen } from '@/utils';
import mapboxgl from 'mapbox-gl';
import { lazy, memo, Suspense, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { DistanceMeasurement } from '../DistanceMeasurement';
import { MapControlPanel } from '../MapControlPanel';
import { PRODUCT } from '@/constants';
import type { DrawerProps } from '../Drawer';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

const WaveBuoyChart = lazy(() =>
  import('../Highcharts/WaveBuoyChart').then(m => ({ default: m.WaveBuoyChart })),
);

const WAVE_BUOY_SNAP_POINTS = (
  isSmallScreen() ? ['70%', '90%'] : [620, 700]
) as DrawerProps['snapPoints'];

export const MapComponent = memo(function MapComponent() {
  const {
    distanceMeasurementEnabled,
    waveBuoysEnabled,
    oceanCurrentEnabled,
    gslaAnomalySeaLevelsEnabled,
    marineHeatwaveSstMosaicEnabled,
    marineHeatwaveSstaEnabled,
    marineHeatwaveMcsCategoryEnabled,
  } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurementEnabled: s.distanceMeasurementEnabled,
      waveBuoysEnabled: s.productEnabled[PRODUCT.WAVE_BUOYS],
      oceanCurrentEnabled: s.productEnabled[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT],
      gslaAnomalySeaLevelsEnabled: s.productEnabled[PRODUCT.GSLA_ANOMALY_SEA_LEVELS],
      marineHeatwaveSstMosaicEnabled: s.productEnabled[PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC],
      marineHeatwaveSstaEnabled: s.productEnabled[PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC],
      marineHeatwaveMcsCategoryEnabled: s.productEnabled[PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY],
    })),
  );

  //1. map initialization.
  const { map, mapContainer } = useMapInitialization();

  //2. create layer, set data to layer and add layer to map.
  const { measurePointsGeojson, setMeasurePointsGeojson } = useDistanceMeasurementLayers(map);
  useWorldLandLayer(map);
  useParticleAtlasLayer({
    map,
    product: PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT,
  });
  useScalarAtlasLayer({
    map,
    product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
  });
  useScalarAtlasLayer({
    map,
    product: PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
  });
  useScalarAtlasLayer({
    map,
    product: PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC,
  });
  useScalarAtlasLayer({
    map,
    product: PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY,
  });
  useWaveBuoysLayer({
    map,
    product: PRODUCT.WAVE_BUOYS,
  });

  //3. add click event listners to map and layers.
  const { clickedPointData: waveBuoysLayerClickedPointData, openDrawer } =
    useWaveBuoysLayerEventHandler(map, waveBuoysEnabled, distanceMeasurementEnabled);

  useTilesLayersEventHandlers({
    map,
    oceanCurrentEnabled,
    heatmapEnabled:
      gslaAnomalySeaLevelsEnabled ||
      marineHeatwaveSstMosaicEnabled ||
      marineHeatwaveSstaEnabled ||
      marineHeatwaveMcsCategoryEnabled,
    distanceMeasurementEnabled,
  });

  const { distance, setDistance } = useDistanceMeasurementLayersEventHandler(
    map,
    distanceMeasurementEnabled,
    measurePointsGeojson,
    setMeasurePointsGeojson,
  );

  useEffect(() => {
    if (waveBuoysLayerClickedPointData) {
      openDrawer(
        <Suspense fallback={<div>Loading...</div>}>
          <WaveBuoyChart waveBuoysData={waveBuoysLayerClickedPointData} showDirection />
        </Suspense>,
        WAVE_BUOY_SNAP_POINTS,
      );
    }
  }, [waveBuoysLayerClickedPointData, openDrawer]);

  //4. enable to toggle style.
  useMapStyle(map);

  //5. enable map resize when its parent div size udpate.
  useMapResize(map, mapContainer);

  return (
    <>
      <div ref={mapContainer} className={cn('w-full h-full')} />
      {distanceMeasurementEnabled && (
        <DistanceMeasurement
          distance={distance}
          setDistance={setDistance}
          setMeasurePointsGeojson={setMeasurePointsGeojson}
        />
      )}

      <MapControlPanel ref={map} className="absolute top-2 left-2 z-10 hidden md:flex" />
    </>
  );
});

MapComponent.displayName = 'MapComponent';
