import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { Button } from '../Button';
import { CloseIcon } from '../Icons';
import { useMapUIStore } from '@/store';

export function DistanceMeasurement({
  distance,
  setDistance,
  setMeasurePointsGeojson,
}: {
  distance: string;
  setDistance: (d: string) => void;
  setMeasurePointsGeojson: (v: FeatureCollection<Geometry, GeoJsonProperties>) => void;
}) {
  const clearMeasurements = () => {
    setDistance('');
    setMeasurePointsGeojson({ type: 'FeatureCollection', features: [] });
  };
  const setDistanceMeasurementEnabled = useMapUIStore(s => s.setDistanceMeasurementEnabled);

  const closePanel = () => {
    clearMeasurements();
    setDistanceMeasurementEnabled(false);
  };

  return (
    <div
      className="absolute top-10 left-1/2 -translate-x-1/2 z-10 w-75"
      aria-label="Distance measurement"
    >
      <div className="frosted px-4 py-2 rounded flex flex-col gap-y-4 relative">
        <button
          type="button"
          onClick={closePanel}
          aria-label="Close distance measurement"
          className="absolute top-2 right-2 cursor-pointer"
        >
          <CloseIcon />
        </button>
        <p>Measure distance</p>
        {distance === '' && <small>Click on the map to trace a path you want to measure</small>}
        {distance !== '' && (
          <>
            <div>
              <small>Click on the map to add to your path</small>
              <div>
                Total distance: <span>{distance}</span>
              </div>
            </div>
            <Button onClick={clearMeasurements} size="sm">
              clear
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
