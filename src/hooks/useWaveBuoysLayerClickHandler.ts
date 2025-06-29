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
import { WaveBuoyOgcFeature } from '@/types';
import { normalizeWaveBuouysData } from '@/utils';
import { useEffect, useRef, useState } from 'react';

export function useWaveBuoysLayerClickHandler(
  map: React.RefObject<mapboxgl.Map | null>,
  circle: boolean,
  distanceMeasurement: boolean,
) {
  const waveBuoysLayerClicked = useRef(false);
  const tempPointsEventPrevent = useRef(false);
  const openDrawer = useDrawerStore(s => s.openBottomDrawer);
  const [clickedPointData, setClickedPointData] = useState<
    Omit<WaveBuoyOgcFeature, 'type'>[] | null
  >(null);

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
    const mapInstace = map.current;

    const handleMouseDown = (e: mapboxgl.MapMouseEvent & { originalEvent: MouseEvent }) => {
      const wavebuoysLayers = [WAVE_BUOYS_LAYER_ID, UNCLUSTERED_WAVE_BUOYS_LAYER_ID];
      const hasZoomLimitTempPoints = mapInstace.getSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID);

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

    mapInstace.on('mousedown', handleMouseDown);
    return () => {
      mapInstace?.off('mousedown', handleMouseDown);
    };
  }, [circle, map]);

  useEffect(() => {
    //click on clustered wave buoys layer
    if (!map.current || !circle || distanceMeasurement) return;
    const mapInstace = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstace.queryRenderedFeatures(e.point, {
        layers: [WAVE_BUOYS_LAYER_ID],
      });
      if (!features[0] || !features[0].properties) return;

      const clusterId = features[0].properties.cluster_id;

      const source = mapInstace.getSource(WAVE_BUOYS_SOURCE_ID) as mapboxgl.GeoJSONSource;

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        if (typeof zoom === 'number' && zoom <= clusterMaxZoom) {
          mapInstace.easeTo({
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

    mapInstace.on('click', WAVE_BUOYS_LAYER_ID, handleClick);
    return () => {
      mapInstace?.off('click', WAVE_BUOYS_LAYER_ID, handleClick);
    };
  }, [circle, map, distanceMeasurement]);

  useEffect(() => {
    //click on unclustered wave buoys layer.
    if (!map.current || !circle || distanceMeasurement) return;
    const mapInstace = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      setClickedPointData(normalizeWaveBuouysData(e.features));
    };

    mapInstace.on('click', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleClick);
    return () => {
      mapInstace?.off('click', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleClick);
    };
  }, [circle, map, distanceMeasurement]);

  useEffect(() => {
    //click on ZOOM_LIMIT_TEMP_POINTS_LAYER, because points are too close so that cannot be displayed invidiually. This is the layer temporarily created to display thoese points
    if (!map.current || !circle || distanceMeasurement) return;
    const mapInstace = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      setClickedPointData(normalizeWaveBuouysData(e.features));
    };

    mapInstace.on('click', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleClick);
    return () => {
      mapInstace?.off('click', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleClick);
    };
  }, [circle, map, distanceMeasurement]);

  useEffect(() => {
    //disppeart ZOOM_LIMIT_TEMP_POINTS_LAYER when zoom within clusterMaxZoom level.
    if (!map.current || !circle) return;
    const mapInstace = map.current;

    const handleZoomEnd = () => {
      const currentZoom = mapInstace.getZoom();

      if (currentZoom <= clusterMaxZoom && mapInstace.getSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID)) {
        removeZoomLimitTempPoints(map);
      }
    };

    mapInstace.on('zoomend', handleZoomEnd);

    return () => {
      mapInstace?.off('zoomend', handleZoomEnd);
    };
  }, [map, circle]);

  return { clickedPointData, openDrawer, waveBuoysLayerClicked, tempPointsEventPrevent };
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
