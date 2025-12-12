import {
  useDistanceMeasurementLayers,
  useDistanceMeasurementLayersClickHandler,
  useMapInitialization,
  useMapResize,
  useMapStyle,
  useOverlayLayer,
  useParticleLayer,
  useParticleOverlayLayersClickHandlers,
  useWaveBuoysLayer,
  useWaveBuoysLayerClickHandler,
  useWorldLandLayer,
} from '@/hooks';
import { useMapUIStore, useSidebarStore } from '@/store';
import { cn } from '@/utils';
import mapboxgl from 'mapbox-gl';
import { lazy, memo, Suspense, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { DistanceMeasurement } from '../DistanceMeasurement';
import { MapControlPanel } from '../MapControlPanel';
import {
  GSLA_OVERLAY_LAYER_ID,
  GSLA_OVERLAY_SOURCE_ID,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
  PRODUCT,
  SST_ANOMALY_MOSAIC_OVERLAY_LAYER_ID,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
} from '@/constants';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

const WaveBuoyChart = lazy(() => import('../Highcharts/WaveBuoyChart'));

export const MapComponent = memo(() => {
  const isSiderbarOpen = useSidebarStore(s => s.isOpen);
  const {
    distanceMeasurement,
    gslaAnomalySeaLevelsEnabled,
    sstAnomMosaicEnabled,
    waveBuoysEnabled,
    oceanCurrentEnabled,
  } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurement: s.distanceMeasurement,
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
  useOverlayLayer({
    map,
    layerId: GSLA_OVERLAY_LAYER_ID,
    sourceId: GSLA_OVERLAY_SOURCE_ID,
    product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
  });
  useOverlayLayer({
    map,
    layerId: SST_ANOMALY_MOSAIC_OVERLAY_LAYER_ID,
    sourceId: SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
    product: PRODUCT.SST_ANOMALY_MOSAIC,
  });
  useParticleLayer({
    map,
    layerId: PARTICLE_LAYER_ID,
    sourceId: PARTICLE_SOURCE_ID,
    product: PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT,
  });
  useWaveBuoysLayer({
    map,
    layerId: WAVE_BUOYS_LAYER_ID,
    sourceId: WAVE_BUOYS_SOURCE_ID,
    product: PRODUCT.WAVE_BUOYS,
  });

  //3. add click event listners to map and layers.
  const {
    clickedPointData: waveBuoysLayerClickedPointData,
    openDrawer,
    waveBuoysLayerClicked,
    tempPointsEventPrevent,
  } = useWaveBuoysLayerClickHandler(map, waveBuoysEnabled, distanceMeasurement);

  useEffect(() => {
    if (waveBuoysLayerClickedPointData) {
      openDrawer(
        <Suspense fallback={<div>Loading...</div>}>
          <WaveBuoyChart waveBuoysData={waveBuoysLayerClickedPointData} showDirection={true} />
        </Suspense>,
      );
    }
  }, [waveBuoysLayerClickedPointData, openDrawer]);

  useParticleOverlayLayersClickHandlers({
    map,
    overlay: gslaAnomalySeaLevelsEnabled || sstAnomMosaicEnabled,
    oceanCurrentEnabled,
    waveBuoysLayerClicked,
    tempPointsEventPrevent,
    distanceMeasurement,
  });

  const { distance, setDistance } = useDistanceMeasurementLayersClickHandler(
    map,
    distanceMeasurement,
    measurePointsGeojson,
    setMeasurePointsGeojson,
  );

  //4. enable to toggle style.
  useMapStyle(map);

  //5. enable map resize when its parent div size udpate.
  useMapResize(map, mapContainer);

  return (
    <>
      <div ref={mapContainer} className={cn('w-full h-full')} />
      {distanceMeasurement && (
        <DistanceMeasurement
          distance={distance}
          setDistance={setDistance}
          setMeasurePointsGeojson={setMeasurePointsGeojson}
        />
      )}

      <MapControlPanel
        ref={map}
        className={cn('absolute top-14 left-4 z-10 hidden md:block', {
          'top-4': isSiderbarOpen,
        })}
      />
    </>
  );
});

MapComponent.displayName = 'MapComponent';
