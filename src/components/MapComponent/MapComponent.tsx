import { memo, useEffect } from 'react';
import { styles } from '@/styles';
import {
  useMapStyle,
  useMapInitialization,
  useOverlayLayer,
  useWaveBuoysLayer,
  useParticleLayer,
  useWaveBuoysLayerClickHandler,
  useParticleOverlayLayersClickHandlers,
  useDistanceMeasurementLayers,
  useDistanceMeasurementLayersClickHandler,
  useMapResize,
} from '@/hooks';
import mapboxgl from 'mapbox-gl';
import { CircleDetails } from '../CircleDetails';
import { DistanceMeasurement } from '../DistanceMeasurement';
import { selectAllStates, useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

export const MapComponent = memo(({ ref }: { ref: React.RefObject<mapboxgl.Map | null> }) => {
  const { style, overlay, circle, particles, distanceMeasurement, numParticles, dataset } =
    useMapUIStore(useShallow(selectAllStates));

  //1. map initialization.
  const { map, mapContainer } = useMapInitialization(
    styles.find(s => s.title === style)?.source || styles[0].source,
    ref,
  );

  //2. create layer, set data to layer and add layer to map.
  useOverlayLayer(map, overlay, style, dataset);

  useParticleLayer(map, particles, style, dataset, numParticles);

  useWaveBuoysLayer(map, circle, style, dataset);

  const { measurePointsGeojson, setMeasurePointsGeojson } = useDistanceMeasurementLayers(
    map,
    distanceMeasurement,
    style,
  );

  //3. add click event listners to map and layers.
  const {
    clickedPointData: waveBuoysLayerClickedPointData,
    openDrawer,
    waveBuoysLayerClicked,
  } = useWaveBuoysLayerClickHandler(map, circle, distanceMeasurement);

  useEffect(() => {
    if (waveBuoysLayerClickedPointData) {
      openDrawer(<CircleDetails {...waveBuoysLayerClickedPointData} />);
    }
  }, [waveBuoysLayerClickedPointData, openDrawer]);

  useParticleOverlayLayersClickHandlers({
    map,
    dataset,
    overlay,
    particles,
    waveBuoysLayerClicked,
    distanceMeasurement,
  });

  const { distance, setDistance } = useDistanceMeasurementLayersClickHandler(
    map,
    distanceMeasurement,
    measurePointsGeojson,
    setMeasurePointsGeojson,
  );

  //4. enable to toggle style.
  useMapStyle(map, style);

  //5. enable map resize when its parent div size udpate.
  useMapResize(map, mapContainer);

  return (
    <>
      <div ref={mapContainer} className="w-full h-full" />
      {distance && (
        <DistanceMeasurement
          distance={distance}
          setDistance={setDistance}
          setMeasurePointsGeojson={setMeasurePointsGeojson}
        />
      )}
    </>
  );
});
