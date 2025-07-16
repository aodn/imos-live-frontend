import { clusterMaxZoom } from '@/config';
import {
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID,
} from '@/constants';
import { createZoomLimitPoints, removeZoomLimitTempPoints } from '@/helpers';
import { useDrawerStore } from '@/store';
import { WaveBuoyPositionFeature } from '@/types';
import { normalizeWaveBuouysData } from '@/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useWaveBuoysLayerClickHandler(
  map: React.RefObject<mapboxgl.Map | null>,
  circle: boolean,
  distanceMeasurement: boolean,
) {
  const waveBuoysLayerClicked = useRef(false);
  const tempPointsEventPrevent = useRef(false);
  const selectedFeatureId = useRef<string | number | null>(null);
  const openDrawer = useDrawerStore(s => s.openBottomDrawer);
  const [clickedPointData, setClickedPointData] = useState<
    Omit<WaveBuoyPositionFeature, 'type'>[] | null
  >(null);

  const clearSelection = useCallback(() => {
    if (!map.current || selectedFeatureId.current === null) return;

    map.current.setFeatureState(
      { source: WAVE_BUOYS_SOURCE_ID, id: selectedFeatureId.current },
      { selected: false },
    );
    selectedFeatureId.current = null;
    setClickedPointData(null);
  }, [map]);

  useEffect(() => {
    if (!map.current || !circle) return;
    const mapInstance = map.current;

    const layers = [
      WAVE_BUOYS_LAYER_ID,
      UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
      ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
    ];

    const handleMouseEnter = () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      mapInstance.getCanvas().style.cursor = '';
    };

    layers.forEach(layerId => {
      mapInstance.on('mouseenter', layerId, handleMouseEnter);
      mapInstance.on('mouseleave', layerId, handleMouseLeave);
    });

    return () => {
      layers.forEach(layerId => {
        mapInstance?.off('mouseenter', layerId, handleMouseEnter);
        mapInstance?.off('mouseleave', layerId, handleMouseLeave);
      });
      if (mapInstance?.getCanvas()) {
        mapInstance.getCanvas().style.cursor = '';
      }
    };
  }, [circle, map]);

  useEffect(() => {
    if (!map.current || !circle) return;
    const mapInstance = map.current;

    const handleMouseDown = (e: mapboxgl.MapMouseEvent & { originalEvent: MouseEvent }) => {
      const wavebuoysLayers = [WAVE_BUOYS_LAYER_ID, UNCLUSTERED_WAVE_BUOYS_LAYER_ID];
      const hasZoomLimitTempPoints = mapInstance.getSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID);

      const layers = hasZoomLimitTempPoints
        ? [...wavebuoysLayers, ZOOM_LIMIT_TEMP_POINTS_LAYER_ID]
        : wavebuoysLayers;

      const features = map.current?.queryRenderedFeatures(e.point, { layers: layers });
      // Check if wave buoys layers were clicked
      waveBuoysLayerClicked.current = (features?.length || 0) > 0;

      //handle zoom limit temp points removal
      if (!hasZoomLimitTempPoints) return;
      const zoomLimitFeatures = map.current?.queryRenderedFeatures(e.point, {
        layers: [ZOOM_LIMIT_TEMP_POINTS_LAYER_ID],
      });
      if (!zoomLimitFeatures?.length) {
        removeZoomLimitTempPoints(map);
        tempPointsEventPrevent.current = true;
      }
    };

    mapInstance.on('mousedown', handleMouseDown);
    return () => {
      mapInstance?.off('mousedown', handleMouseDown);
    };
  }, [circle, map]);

  useEffect(() => {
    //click on clustered wave buoys layer
    if (!map.current || !circle || distanceMeasurement) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: [WAVE_BUOYS_LAYER_ID],
      });
      if (!features[0] || !features[0].properties) return;

      const clusterId = features[0].properties.cluster_id;

      const source = mapInstance.getSource(WAVE_BUOYS_SOURCE_ID) as mapboxgl.GeoJSONSource;

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        if (typeof zoom === 'number' && zoom <= clusterMaxZoom) {
          mapInstance.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom,
          });
        } else {
          source.getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
            if (err || !leaves) return;
            createZoomLimitPoints(map, leaves, (features[0].geometry as any).coordinates);
          });
        }
      });
    };

    mapInstance.on('click', WAVE_BUOYS_LAYER_ID, handleClick);
    return () => {
      mapInstance?.off('click', WAVE_BUOYS_LAYER_ID, handleClick);
    };
  }, [circle, map, distanceMeasurement]);

  useEffect(() => {
    //click on unclustered wave buoys layer.
    if (!map.current || !circle || distanceMeasurement) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      const feature = e.features[0];
      // const featureId = feature.properties?._id;
      const featureId = feature.properties?._id;

      if (selectedFeatureId.current !== null) {
        mapInstance.setFeatureState(
          { source: WAVE_BUOYS_SOURCE_ID, id: selectedFeatureId.current },
          { selected: false },
        );
      }

      if (featureId !== undefined) {
        mapInstance.setFeatureState(
          { source: WAVE_BUOYS_SOURCE_ID, id: featureId },
          { selected: true },
        );
        selectedFeatureId.current = featureId;
      }
      setClickedPointData(normalizeWaveBuouysData(e.features));
    };

    mapInstance.on('click', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleClick);
    return () => {
      mapInstance?.off('click', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleClick);
    };
  }, [circle, map, distanceMeasurement]);

  useEffect(() => {
    //click on ZOOM_LIMIT_TEMP_POINTS_LAYER, because points are too close so that cannot be displayed invidiually. This is the layer temporarily created to display thoese points
    if (!map.current || !circle || distanceMeasurement) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      setClickedPointData(normalizeWaveBuouysData(e.features));
    };

    mapInstance.on('click', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleClick);
    return () => {
      mapInstance?.off('click', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleClick);
    };
  }, [circle, map, distanceMeasurement]);

  useEffect(() => {
    //disppeart ZOOM_LIMIT_TEMP_POINTS_LAYER when zoom within clusterMaxZoom level.
    if (!map.current || !circle) return;
    const mapInstance = map.current;

    const handleZoomEnd = () => {
      const currentZoom = mapInstance.getZoom();

      if (
        currentZoom <= clusterMaxZoom &&
        mapInstance.getSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID)
      ) {
        removeZoomLimitTempPoints(map);
      }
    };

    mapInstance.on('zoomend', handleZoomEnd);

    return () => {
      mapInstance?.off('zoomend', handleZoomEnd);
    };
  }, [map, circle]);

  // Clear unclustered circle selection when clicking on empty map area
  useEffect(() => {
    if (!map.current || !circle) return;
    const mapInstance = map.current;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      // Check if click was on any wave buoy layers
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: [WAVE_BUOYS_LAYER_ID, UNCLUSTERED_WAVE_BUOYS_LAYER_ID],
      });

      // If no features were clicked, clear the selection
      if (features.length === 0 && selectedFeatureId.current !== null) {
        mapInstance.setFeatureState(
          { source: WAVE_BUOYS_SOURCE_ID, id: selectedFeatureId.current },
          { selected: false },
        );
        selectedFeatureId.current = null;
        setClickedPointData(null);
      }
    };

    mapInstance.on('click', handleMapClick);
    return () => {
      mapInstance?.off('click', handleMapClick);
    };
  }, [circle, map]);

  //  Clear unclustered circle selection on Escape key press
  useEffect(() => {
    if (!map.current || !circle) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedFeatureId.current !== null && map.current) {
        map.current.setFeatureState(
          { source: WAVE_BUOYS_SOURCE_ID, id: selectedFeatureId.current },
          { selected: false },
        );
        selectedFeatureId.current = null;
        setClickedPointData(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [circle, map]);

  return {
    clickedPointData,
    openDrawer,
    waveBuoysLayerClicked,
    tempPointsEventPrevent,
    clearSelection,
  };
}
/**
 * how cluster works?
 * In a zoom level, if the points distance is within the clusterRadius, then these points will be clutered into one group.
 * With zoomin, the poins outsider clusterRadius will move out from clustered group and go into unclustered layer.
 *
 * getClusterLeaves can get points inside a cluser.
 *
 * And another problme in geojson data, coordinate precision only has one decimal, but in e.features.geometry.coordiates, the prcesion will have multiple decimals.
 * We can round the coordiates to one decimal to identify point from geojson.
 *
 * queryRenderedFeatures can only get features displayed within viewport.
 */
