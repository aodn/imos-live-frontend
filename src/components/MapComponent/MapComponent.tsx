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
  useSiteClusterEventHandler,
  useSiteClusterLayer,
  useUnclusteredSiteLayer,
  useSiteUnclusteredLayerEventHandler,
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
  PRODUCT,
  UNCLUSTERED_ESTUARINE_MOORING_LAYER_ID,
  UNCLUSTERED_ESTUARINE_MOORING_LAYER_CONFIG,
  UNCLUSTERED_MOORING_LAYER_CONFIG,
  UNCLUSTERED_MOORING_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
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
  useUnclusteredSiteLayer({
    map,
    product: PRODUCT.WAVE_BUOYS,
    unclusteredLayerId: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
    getSitesByDate: getWaveBuoySitesByDate,
    getLatestSites: getLatestWaveBuoySites,
  });
  useUnclusteredSiteLayer({
    map,
    product: PRODUCT.MOORING_TIMESERIES_REALTIME,
    unclusteredLayerId: UNCLUSTERED_MOORING_LAYER_ID,
    getSitesByDate: getMooringSitesByDate,
    getLatestSites: getLatestMooringSites,
    unclusteredConfig: UNCLUSTERED_MOORING_LAYER_CONFIG,
  });
  useUnclusteredSiteLayer({
    map,
    product: PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC,
    unclusteredLayerId: UNCLUSTERED_ESTUARINE_MOORING_LAYER_ID,
    getSitesByDate: getEstuarineMooringSitesByDate,
    getLatestSites: getLatestEstuarineMooringSites,
    unclusteredConfig: UNCLUSTERED_ESTUARINE_MOORING_LAYER_CONFIG,
  });

  useSiteClusterLayer(map, waveBuoysEnabled || mooringEnabled || estuarineMooringEnabled);

  //3. add click event listners to map and layers.
  useSiteClusterEventHandler(map, {
    enabled: waveBuoysEnabled || mooringEnabled || estuarineMooringEnabled,
    distanceMeasurementEnabled,
  });
  const { clickedPointData: waveBuoysClickedPointData } = useSiteUnclusteredLayerEventHandler(map, {
    product: PRODUCT.WAVE_BUOYS,
    enabled: waveBuoysEnabled,
    distanceMeasurementEnabled,
    unclusteredLayerId: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  });

  const { clickedPointData: mooringClickedPointData } = useSiteUnclusteredLayerEventHandler(map, {
    product: PRODUCT.MOORING_TIMESERIES_REALTIME,
    enabled: mooringEnabled,
    distanceMeasurementEnabled,
    unclusteredLayerId: UNCLUSTERED_MOORING_LAYER_ID,
  });

  const { clickedPointData: estuarineMooringClickedPointData } =
    useSiteUnclusteredLayerEventHandler(map, {
      product: PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC,
      enabled: estuarineMooringEnabled,
      distanceMeasurementEnabled,
      unclusteredLayerId: UNCLUSTERED_ESTUARINE_MOORING_LAYER_ID,
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
