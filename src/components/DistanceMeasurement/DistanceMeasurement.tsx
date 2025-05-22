import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { Button } from '../ui';

export const DistanceMeasurement = ({
  distance,
  setDistance,
  setMeasurePointsGeojson,
}: {
  distance: string;
  setDistance: (d: string) => void;
  setMeasurePointsGeojson: (v: FeatureCollection<Geometry, GeoJsonProperties>) => void;
}) => {
  const clearMeasurements = () => {
    setDistance('');
    setMeasurePointsGeojson({ type: 'FeatureCollection', features: [] });
  };
  return (
    <div className="absolute top-10 left-10 z-10 bg-slate-400 shadow-sm  px-4 py-2 rounded flex flex-col gap-y-4">
      <p>Total distance: {distance} km</p>
      <Button onClick={clearMeasurements} size="sm">
        clear
      </Button>
    </div>
  );
};
