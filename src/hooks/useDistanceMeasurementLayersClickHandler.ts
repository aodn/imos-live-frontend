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
    (pointFeatures: Feature<Geometry, GeoJsonProperties>[]) => {
      const newFeatures = [...pointFeatures];
      let dist = '';

      // Create LineString feature if we have 2 or more points
      if (pointFeatures.length > 1) {
        const coordinates = pointFeatures
          .map(pt => {
            // Ensure we're getting coordinates from Point geometry
            if (pt.geometry.type === 'Point') {
              return pt.geometry.coordinates;
            }
            return null;
          })
          .filter(coord => coord !== null);

        if (coordinates.length > 1) {
          const line: Feature<Geometry, GeoJsonProperties> = {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coordinates,
            },
            properties: {
              // Add a property to help distinguish line from points
              featureType: 'measurement-line',
            },
          };

          newFeatures.push(line);

          // Calculate distance using turf
          try {
            const distanceKm = turf.length(line);
            dist = `${distanceKm.toFixed(2)} km`;
          } catch (error) {
            console.error('Error calculating distance:', error);
            dist = 'Error calculating distance';
          }
        }
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
      lngLat: { lng: number; lat: number };
    }) {
      // Get only Point features (exclude LineString features)
      const points = measurePointsGeojson.features.filter(
        f => f.geometry.type === 'Point',
      ) as Feature<Geometry, GeoJsonProperties>[];

      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: [MEASURE_POINTS_LAYER_ID],
      });

      let newPoints: Feature<Geometry, GeoJsonProperties>[];

      if (features.length) {
        // Clicked on existing point - remove it
        const id = features[0].properties?.id;
        newPoints = points.filter(pt => pt.properties?.id !== id);
      } else {
        // Clicked on empty space - add new point
        const newPoint: Feature<Geometry, GeoJsonProperties> = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [e.lngLat.lng, e.lngLat.lat],
          },
          properties: {
            id: String(Date.now()),
            featureType: 'measurement-point',
          },
        };

        newPoints = [...points, newPoint];
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
      if (map.current) {
        map.current.getCanvas().style.cursor = 'grab';
      }
      setMeasurePointsGeojson({ type: 'FeatureCollection', features: [] });
      setDistance('');
    }
  }, [distanceMeasurement, map, setMeasurePointsGeojson]);

  return { distance, setDistance };
}
