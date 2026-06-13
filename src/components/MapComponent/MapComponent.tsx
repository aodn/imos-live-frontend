import {
  useDistanceMeasurementLayers,
  useDistanceMeasurementLayersEventHandler,
  useMapInitialization,
  useMapResize,
  useMapStyle,
  useParticleAtlasLayer,
  useTilesLayersEventHandlers,
  useScalarAtlasLayer,
  useSiteLayer,
  useSiteLayerEventHandler,
  useWorldLandLayer,
} from '@/hooks';
import {
  getLatestMooringSites,
  getLatestWaveBuoySites,
  getMooringSitesByDate,
  getWaveBuoySitesByDate,
} from '@/api';
import { normalizeWaveBuoyDates } from '@/helpers';
import { useMapUIStore } from '@/store';
import { cn, isSmallScreen } from '@/utils';
import mapboxgl from 'mapbox-gl';
import { lazy, memo, Suspense, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { DistanceMeasurement } from '../DistanceMeasurement';
import { MapControlPanel } from '../MapControlPanel';
import {
  MOORING_CLUSTER_LABEL_LAYER_ID,
  MOORING_LAYER_CONFIG,
  PRODUCT,
  PRODUCTS,
  UNCLUSTERED_MOORING_LAYER_CONFIG,
  UNCLUSTERED_MOORING_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
} from '@/constants';
import allWaveBuoySitesBackup from '@/assets/wave_buoy_all_sites.json';
import type { DrawerProps } from '../Drawer';
import type { RawSiteFeatureCollection } from '@/types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

const WaveBuoyChart = lazy(() =>
  import('../Highcharts/WaveBuoyChart').then(m => ({ default: m.WaveBuoyChart })),
);

const MooringChart = lazy(() =>
  import('../Highcharts/MooringChart').then(m => ({ default: m.MooringChart })),
);

const SITE_SNAP_POINTS = (
  isSmallScreen() ? ['70%', '90%'] : [620, 700]
) as DrawerProps['snapPoints'];

export const MapComponent = memo(function MapComponent() {
  const {
    distanceMeasurementEnabled,
    waveBuoysEnabled,
    mooringEnabled,
    oceanCurrentEnabled,
    gslaAnomalySeaLevelsEnabled,
    marineHeatwaveSstMosaicEnabled,
    marineHeatwaveSstaEnabled,
    marineHeatwaveMcsCategoryEnabled,
  } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurementEnabled: s.distanceMeasurementEnabled,
      waveBuoysEnabled: s.productEnabled[PRODUCT.WAVE_BUOYS],
      mooringEnabled: s.productEnabled[PRODUCT.MOORING_TIMESERIES_REALTIME],
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
  useSiteLayer({
    map,
    product: PRODUCT.WAVE_BUOYS,
    unclusteredLayerId: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
    clusterLabelLayerId: WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
    getSitesByDate: getWaveBuoySitesByDate,
    getLatestSites: getLatestWaveBuoySites,
    fallbackData: () => normalizeWaveBuoyDates(allWaveBuoySitesBackup as RawSiteFeatureCollection),
  });
  useSiteLayer({
    map,
    product: PRODUCT.MOORING_TIMESERIES_REALTIME,
    unclusteredLayerId: UNCLUSTERED_MOORING_LAYER_ID,
    clusterLabelLayerId: MOORING_CLUSTER_LABEL_LAYER_ID,
    getSitesByDate: getMooringSitesByDate,
    getLatestSites: getLatestMooringSites,
    clusterConfig: MOORING_LAYER_CONFIG,
    unclusteredConfig: UNCLUSTERED_MOORING_LAYER_CONFIG,
  });

  //3. add click event listners to map and layers.
  const { clickedPointData: waveBuoysClickedPointData, openDrawer } = useSiteLayerEventHandler(
    map,
    {
      enabled: waveBuoysEnabled,
      distanceMeasurementEnabled,
      clusterLayerId: PRODUCTS[PRODUCT.WAVE_BUOYS].layerId,
      unclusteredLayerId: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
      sourceId: PRODUCTS[PRODUCT.WAVE_BUOYS].sourceId,
    },
  );

  const { clickedPointData: mooringClickedPointData } = useSiteLayerEventHandler(map, {
    enabled: mooringEnabled,
    distanceMeasurementEnabled,
    clusterLayerId: PRODUCTS[PRODUCT.MOORING_TIMESERIES_REALTIME].layerId,
    unclusteredLayerId: UNCLUSTERED_MOORING_LAYER_ID,
    sourceId: PRODUCTS[PRODUCT.MOORING_TIMESERIES_REALTIME].sourceId,
  });

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
    if (waveBuoysClickedPointData) {
      openDrawer(
        <Suspense fallback={<div>Loading...</div>}>
          <WaveBuoyChart waveBuoysData={waveBuoysClickedPointData} showDirection />
        </Suspense>,
        SITE_SNAP_POINTS,
      );
    }
  }, [waveBuoysClickedPointData, openDrawer]);

  useEffect(() => {
    if (mooringClickedPointData) {
      openDrawer(
        <Suspense fallback={<div>Loading...</div>}>
          <MooringChart mooringData={mooringClickedPointData} />
        </Suspense>,
        SITE_SNAP_POINTS,
      );
    }
  }, [mooringClickedPointData, openDrawer]);

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
