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
} from '@/hooks';
import mapboxgl from 'mapbox-gl';
import { CircleDetails } from '../CircleDetails';
import { DistanceMeasurement } from '../DistanceMeasurement';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

type MapComponentProps = {
  style: string;
  overlay: boolean;
  circle: boolean;
  particles: boolean;
  distanceMeasurement: boolean;
  numParticles: number;
  dataset: string;
};

export const MapComponent = memo(
  ({
    style,
    overlay,
    circle,
    particles,
    distanceMeasurement,
    numParticles,
    dataset,
  }: MapComponentProps) => {
    //1. map initialization.
    const { map, mapContainer } = useMapInitialization(
      styles.find(s => s.title === style)?.source || styles[0].source,
    );

    //2. create layer, set data to layer and add layer to map.
    useOverlayLayer(map, overlay, style, dataset);

    useParticleLayer(map, particles, style, dataset, numParticles);

    useWaveBuoysLayer(map, circle, style, dataset);

    const { measurePointsGeojson, setMeasurePointsGeojson } = useDistanceMeasurementLayers(
      map,
      distanceMeasurement,
    );

    //3. add click event listners to map and layers.
    const {
      clickedPointData: waveBuoysLayerClickedPointData,
      openDrawer,
      waveBuoysLayerClicked,
    } = useWaveBuoysLayerClickHandler(map, circle, distanceMeasurement);

    //the reason open drawer in useEffect is because hook is only good for logics without rendering components.
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
  },
);
