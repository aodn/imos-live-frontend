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
import { selectAllStates, useMapUIStore } from '@/store';
import { cn } from '@/utils';
import mapboxgl from 'mapbox-gl';
import { lazy, memo, Suspense, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { DistanceMeasurement } from '../DistanceMeasurement';
import { MapControlPanel } from '../MapControlPanel';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

const WaveBuoyChart = lazy(() => import('../Highcharts/WaveBuoyChart'));

export const MapComponent = memo(() => {
  const { overlay, circle, particles, distanceMeasurement, overlaySource } = useMapUIStore(
    useShallow(selectAllStates),
  );

  //1. map initialization.
  const { map, mapContainer } = useMapInitialization();

  //2. create layer, set data to layer and add layer to map.
  const { measurePointsGeojson, setMeasurePointsGeojson } = useDistanceMeasurementLayers(map);
  useWorldLandLayer(map);
  useOverlayLayer(map);
  useParticleLayer(map);
  useWaveBuoysLayer(map);

  //3. add click event listners to map and layers.
  const {
    clickedPointData: waveBuoysLayerClickedPointData,
    openDrawer,
    waveBuoysLayerClicked,
    tempPointsEventPrevent,
  } = useWaveBuoysLayerClickHandler(map, circle, distanceMeasurement);

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
    overlay,
    particles,
    waveBuoysLayerClicked,
    tempPointsEventPrevent,
    distanceMeasurement,
    overlaySource,
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

      <MapControlPanel ref={map} className="absolute top-10 left-0 z-10 hidden md:block" />
    </>
  );
});

MapComponent.displayName = 'MapComponent';
