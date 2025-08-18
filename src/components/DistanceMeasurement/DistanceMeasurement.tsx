import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { Button } from '../Button';

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
    <div
      className="absolute top-10 left-1/2 -translate-x-1/2 z-10 "
      aria-label="Distance measurement"
    >
      <div className="frosted px-4 py-2 rounded flex flex-col gap-y-4">
        <p>
          Total distance: <span>{distance}</span>
        </p>
        <Button onClick={clearMeasurements} size="sm">
          clear
        </Button>
      </div>
    </div>
  );
};
