import {
  useDistanceMeasurementLayers,
  useDistanceMeasurementLayersEventHandler,
  useMapInitialization,
  useMapResize,
  useMapStyle,
  useRasterHeatmapLayer,
  useParticleLayer,
  useParticleRasterLayersEventHandlers,
  useWaveBuoysLayer,
  useWaveBuoysLayerEventHandler,
  useWorldLandLayer,
  useWebGLHeatmapLayer,
} from '@/hooks';
import { useMapUIStore } from '@/store';
import { cn } from '@/utils';
import mapboxgl from 'mapbox-gl';
import { lazy, memo, Suspense, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { DistanceMeasurement } from '../DistanceMeasurement';
import { MapControlPanel } from '../MapControlPanel';
import {
  GSLA_RASTER_LAYER_ID,
  GSLA_RASTER_SOURCE_ID,
  GSLA_PARTICLE_LAYER_ID,
  PRODUCT,
  SST_ANOMALY_MOSAIC_RASTER_LAYER_ID,
  SST_ANOMALY_MOSAIC_RASTER_SOURCE_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
  GSLA_WEBGL_LAYER_ID,
  SST_ANOM_MOSAIC_WEBGL_LAYER_ID,
} from '@/constants';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

const WaveBuoyChart = lazy(() => import('../Highcharts/WaveBuoyChart'));

export const MapComponent = memo(function MapComponent() {
  const {
    distanceMeasurementEnabled,
    gslaAnomalySeaLevelsEnabled,
    sstAnomMosaicEnabled,
    waveBuoysEnabled,
    oceanCurrentEnabled,
  } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurementEnabled: s.distanceMeasurementEnabled,
      gslaAnomalySeaLevelsEnabled: s.productEnabled['gsla-anomaly-sea-levels'],
      sstAnomMosaicEnabled: s.productEnabled['sst-anom-mosaic'],
      waveBuoysEnabled: s.productEnabled['wave-buoys'],
      oceanCurrentEnabled: s.productEnabled['gsla-ocean-geostrophic-current'],
    })),
  );

  //1. map initialization.
  const { map, mapContainer } = useMapInitialization();

  //2. create layer, set data to layer and add layer to map.
  const { measurePointsGeojson, setMeasurePointsGeojson } = useDistanceMeasurementLayers(map);
  useWorldLandLayer(map);
  useWebGLHeatmapLayer({
    map,
    layerId: GSLA_WEBGL_LAYER_ID,
    product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS_WEBGL,
    baseUrl: '26-01-01/sea_level_anomaly',
    filePrefix: 'sea_level_anomaly',
    queryKey: 'seaLevelAnomalyAtlasManifest',
  });
  useWebGLHeatmapLayer({
    map,
    layerId: SST_ANOM_MOSAIC_WEBGL_LAYER_ID,
    product: PRODUCT.SST_ANOM_MOSAIC_WEBGL,
    baseUrl: '26-01-01/ssta',
    filePrefix: 'ssta',
    queryKey: 'sstAnomalyAtlasManifest',
  });
  useRasterHeatmapLayer({
    map,
    layerId: GSLA_RASTER_LAYER_ID,
    sourceId: GSLA_RASTER_SOURCE_ID,
    product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
  });
  useRasterHeatmapLayer({
    map,
    layerId: SST_ANOMALY_MOSAIC_RASTER_LAYER_ID,
    sourceId: SST_ANOMALY_MOSAIC_RASTER_SOURCE_ID,
    product: PRODUCT.SST_ANOMALY_MOSAIC,
  });
  useParticleLayer({
    map,
    layerId: GSLA_PARTICLE_LAYER_ID,
    product: PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT,
  });
  useWaveBuoysLayer({
    map,
    layerId: WAVE_BUOYS_LAYER_ID,
    sourceId: WAVE_BUOYS_SOURCE_ID,
    product: PRODUCT.WAVE_BUOYS,
  });

  //3. add click event listners to map and layers.
  const { clickedPointData: waveBuoysLayerClickedPointData, openDrawer } =
    useWaveBuoysLayerEventHandler(map, waveBuoysEnabled, distanceMeasurementEnabled);

  useParticleRasterLayersEventHandlers({
    map,
    raster: gslaAnomalySeaLevelsEnabled || sstAnomMosaicEnabled,
    oceanCurrentEnabled,
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
