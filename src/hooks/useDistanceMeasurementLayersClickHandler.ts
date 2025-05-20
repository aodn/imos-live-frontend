import { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { useCallback, useEffect, useState } from 'react';
import * as turf from '@turf/turf';
import { PointLike } from 'mapbox-gl';
import { MEASURE_POINTS_LAYER_ID } from '@/constants';

export function useDistanceMeasurementLayersClickHandler(
  map: React.RefObject<mapboxgl.Map | null>,
  distanceMeasurement: boolean,
  measurePointsGeojson: FeatureCollection<Geometry, GeoJsonProperties>,
  setMeasurePointsGeojson: (v: FeatureCollection<Geometry, GeoJsonProperties>) => void,
) {
  const [distance, setDistance] = useState<string>('');

  const updateGeojson = useCallback(
    (features: any[]) => {
      const newFeatures = [...features];
      let dist = '';
      if (features.length > 1) {
        const line: Feature<Geometry, GeoJsonProperties> = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: features.map(pt => pt.geometry.coordinates),
          },
          properties: {},
        };
        newFeatures.push(line);
        dist = turf.length(line).toLocaleString();
      }

      setMeasurePointsGeojson({
        type: 'FeatureCollection',
        features: newFeatures,
      });
      setDistance(dist);
    },
    [setMeasurePointsGeojson],
  );

  useEffect(() => {
    if (!map.current || !distanceMeasurement) return;
    const mapInstance = map.current;

    function handleClick(e: {
      point: PointLike | [PointLike, PointLike];
      lngLat: { lng: any; lat: any };
    }) {
      const points = measurePointsGeojson.features.filter(f => f.geometry.type === 'Point');
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: [MEASURE_POINTS_LAYER_ID],
      });

      let newPoints;
      if (features.length) {
        const id = features[0].properties?.id;
        newPoints = points.filter(pt => pt.properties?.id !== id);
      } else {
        newPoints = [
          ...points,
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [e.lngLat.lng, e.lngLat.lat],
            },
            properties: { id: String(Date.now()) },
          },
        ];
      }
      updateGeojson(newPoints);
    }

    mapInstance.on('click', handleClick);

    function handleMouseMove(e: { point: PointLike | [PointLike, PointLike] }) {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: [MEASURE_POINTS_LAYER_ID],
      });
      mapInstance.getCanvas().style.cursor = features.length ? 'pointer' : 'crosshair';
    }
    mapInstance.on('mousemove', handleMouseMove);

    return () => {
      mapInstance.off('click', handleClick);
      mapInstance.off('mousemove', handleMouseMove);
    };
  }, [distanceMeasurement, map, measurePointsGeojson, updateGeojson]);

  useEffect(() => {
    if (!distanceMeasurement) {
      setMeasurePointsGeojson({ type: 'FeatureCollection', features: [] });
      setDistance('');
    }
  }, [distanceMeasurement, setMeasurePointsGeojson]);

  return { distance, setDistance };
}
