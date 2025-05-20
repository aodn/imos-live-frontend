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
    <div className="fixed top-10 left-10 z-10 bg-slate-400 shadow-sm  px-4 py-2 rounded">
      <p>Total distance: {distance} km</p>
      <Button children="clear" onClick={clearMeasurements} />
    </div>
  );
};
