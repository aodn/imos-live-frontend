import {
  useDistanceMeasurementLayers,
  useDistanceMeasurementLayersEventHandler,
  useMapInitialization,
  useMapResize,
  useMapStyle,
  useParticleAtlasLayer,
  useParticleRasterLayersEventHandlers,
  useScalarAtlasLayer,
  useWaveBuoysLayer,
  useWaveBuoysLayerEventHandler,
  useWorldLandLayer,
} from '@/hooks';
import { useMapUIStore } from '@/store';
import { cn } from '@/utils';
import mapboxgl from 'mapbox-gl';
import { lazy, memo, Suspense, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { DistanceMeasurement } from '../DistanceMeasurement';
import { MapControlPanel } from '../MapControlPanel';
import { PRODUCT, PRODUCTS } from '@/constants';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

const WaveBuoyChart = lazy(() => import('../Highcharts/WaveBuoyChart'));

export const MapComponent = memo(function MapComponent() {
  const {
    distanceMeasurementEnabled,
    waveBuoysEnabled,
    oceanCurrentEnabled,
    gslaAnomalySeaLevelsEnabled,
    sstAnomMosaicEnabled,
    marineHeatwaveDhdEnabled,
    marineHeatwaveSstaEnabled,
  } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurementEnabled: s.distanceMeasurementEnabled,
      waveBuoysEnabled: s.productEnabled[PRODUCT.WAVE_BUOYS],
      oceanCurrentEnabled: s.productEnabled[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT],
      gslaAnomalySeaLevelsEnabled: s.productEnabled[PRODUCT.GSLA_ANOMALY_SEA_LEVELS],
      sstAnomMosaicEnabled: s.productEnabled[PRODUCT.SST_ANOMALY_MOSAIC],
      marineHeatwaveDhdEnabled: s.productEnabled[PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC],
      marineHeatwaveSstaEnabled: s.productEnabled[PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC],
    })),
  );

  //1. map initialization.
  const { map, mapContainer } = useMapInitialization();

  //2. create layer, set data to layer and add layer to map.
  const { measurePointsGeojson, setMeasurePointsGeojson } = useDistanceMeasurementLayers(map);
  useWorldLandLayer(map);
  useScalarAtlasLayer({
    map,
    layerId: PRODUCTS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].layerId,
    product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
  });
  useScalarAtlasLayer({
    map,
    layerId: PRODUCTS[PRODUCT.SST_ANOMALY_MOSAIC].layerId,
    product: PRODUCT.SST_ANOMALY_MOSAIC,
  });
  useScalarAtlasLayer({
    map,
    layerId: PRODUCTS[PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC].layerId,
    product: PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC,
  });
  useScalarAtlasLayer({
    map,
    layerId: PRODUCTS[PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC].layerId,
    product: PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC,
  });
  useParticleAtlasLayer({
    map,
    layerId: PRODUCTS[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT].layerId,
    product: PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT,
  });
  useWaveBuoysLayer({
    map,
    layerId: PRODUCTS[PRODUCT.WAVE_BUOYS].layerId,
    sourceId: PRODUCTS[PRODUCT.WAVE_BUOYS].sourceId,
    product: PRODUCT.WAVE_BUOYS,
  });

  //3. add click event listners to map and layers.
  const { clickedPointData: waveBuoysLayerClickedPointData, openDrawer } =
    useWaveBuoysLayerEventHandler(map, waveBuoysEnabled, distanceMeasurementEnabled);

  useParticleRasterLayersEventHandlers({
    map,
    oceanCurrentEnabled,
    heatmapEnabled:
      gslaAnomalySeaLevelsEnabled ||
      sstAnomMosaicEnabled ||
      marineHeatwaveDhdEnabled ||
      marineHeatwaveSstaEnabled,
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
