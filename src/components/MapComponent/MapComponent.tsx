import {
  useDistanceMeasurementLayers,
  useDistanceMeasurementLayersEventHandler,
  useMapInitialization,
  useMapImages,
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
  getEstuarineMooringSitesByDate,
  getLatestEstuarineMooringSites,
  getLatestMooringSites,
  getLatestWaveBuoySites,
  getMooringSitesByDate,
  getWaveBuoySitesByDate,
} from '@/api';
import { useMapUIStore, openBottomDrawer } from '@/store';
import { cn, isSmallScreen } from '@/utils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { lazy, memo, Suspense, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { DistanceMeasurement } from '../DistanceMeasurement';
import { MapControlPanel } from '../MapControlPanel';
import {
  ESTUARINE_MOORING_CLUSTER_LABEL_LAYER_ID,
  MOORING_CLUSTER_LABEL_LAYER_ID,
  ESTUARINE_MOORING_LAYER_CONFIG,
  MOORING_LAYER_CONFIG,
  PRODUCT,
  PRODUCTS,
  UNCLUSTERED_ESTUARINE_MOORING_LAYER_ID,
  UNCLUSTERED_ESTUARINE_MOORING_LAYER_CONFIG,
  UNCLUSTERED_MOORING_LAYER_CONFIG,
  UNCLUSTERED_MOORING_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
} from '@/constants';
import type { DrawerProps } from '../Drawer';

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
    estuarineMooringEnabled,
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
      estuarineMooringEnabled:
        s.productEnabled[PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC],
      oceanCurrentEnabled: s.productEnabled[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT],
      gslaAnomalySeaLevelsEnabled: s.productEnabled[PRODUCT.GSLA_ANOMALY_SEA_LEVELS],
      marineHeatwaveSstMosaicEnabled: s.productEnabled[PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC],
      marineHeatwaveSstaEnabled: s.productEnabled[PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC],
      marineHeatwaveMcsCategoryEnabled:
        s.productEnabled[PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC],
    })),
  );

  //1. map initialization.
  const { map, mapContainer } = useMapInitialization();
  // add map images like used in icons to the map. These are used by layers and must be added before the layers are added.
  useMapImages(map);

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
    product: PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC,
  });
  useSiteLayer({
    map,
    product: PRODUCT.WAVE_BUOYS,
    unclusteredLayerId: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
    clusterLabelLayerId: WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
    getSitesByDate: getWaveBuoySitesByDate,
    getLatestSites: getLatestWaveBuoySites,
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
  useSiteLayer({
    map,
    product: PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC,
    unclusteredLayerId: UNCLUSTERED_ESTUARINE_MOORING_LAYER_ID,
    clusterLabelLayerId: ESTUARINE_MOORING_CLUSTER_LABEL_LAYER_ID,
    getSitesByDate: getEstuarineMooringSitesByDate,
    getLatestSites: getLatestEstuarineMooringSites,
    clusterConfig: ESTUARINE_MOORING_LAYER_CONFIG,
    unclusteredConfig: UNCLUSTERED_ESTUARINE_MOORING_LAYER_CONFIG,
  });

  //3. add click event listners to map and layers.
  const { clickedPointData: waveBuoysClickedPointData } = useSiteLayerEventHandler(map, {
    product: PRODUCT.WAVE_BUOYS,
    enabled: waveBuoysEnabled,
    distanceMeasurementEnabled,
    clusterLayerId: PRODUCTS[PRODUCT.WAVE_BUOYS].layerId,
    unclusteredLayerId: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
    sourceId: PRODUCTS[PRODUCT.WAVE_BUOYS].sourceId,
  });

  const { clickedPointData: mooringClickedPointData } = useSiteLayerEventHandler(map, {
    product: PRODUCT.MOORING_TIMESERIES_REALTIME,
    enabled: mooringEnabled,
    distanceMeasurementEnabled,
    clusterLayerId: PRODUCTS[PRODUCT.MOORING_TIMESERIES_REALTIME].layerId,
    unclusteredLayerId: UNCLUSTERED_MOORING_LAYER_ID,
    sourceId: PRODUCTS[PRODUCT.MOORING_TIMESERIES_REALTIME].sourceId,
  });

  const { clickedPointData: estuarineMooringClickedPointData } = useSiteLayerEventHandler(map, {
    product: PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC,
    enabled: estuarineMooringEnabled,
    distanceMeasurementEnabled,
    clusterLayerId:
      PRODUCTS[PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC].layerId,
    unclusteredLayerId: UNCLUSTERED_ESTUARINE_MOORING_LAYER_ID,
    sourceId:
      PRODUCTS[PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC].sourceId,
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
      openBottomDrawer(
        <Suspense fallback={<div>Loading...</div>}>
          <WaveBuoyChart waveBuoysData={waveBuoysClickedPointData} showDirection />
        </Suspense>,
        SITE_SNAP_POINTS,
      );
    }
  }, [waveBuoysClickedPointData]);

  useEffect(() => {
    if (mooringClickedPointData) {
      openBottomDrawer(
        <Suspense fallback={<div>Loading...</div>}>
          <MooringChart
            key={PRODUCT.MOORING_TIMESERIES_REALTIME}
            product={PRODUCT.MOORING_TIMESERIES_REALTIME}
            mooringData={mooringClickedPointData}
          />
        </Suspense>,
        SITE_SNAP_POINTS,
      );
    }
  }, [mooringClickedPointData]);

  useEffect(() => {
    if (estuarineMooringClickedPointData) {
      openBottomDrawer(
        <Suspense fallback={<div>Loading...</div>}>
          <MooringChart
            key={PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC}
            product={PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC}
            mooringData={estuarineMooringClickedPointData}
          />
        </Suspense>,
        SITE_SNAP_POINTS,
      );
    }
  }, [estuarineMooringClickedPointData]);

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
