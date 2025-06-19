import { clusterMaxZoom } from '@/config';
import {
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
  ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_SOURCE_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID,
} from '@/constants';
import { createZoomLimitPoints } from '@/helpers';
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
  const openDrawer = useDrawerStore(s => s.openDrawer);
  const [clickedPointData, setClickedPointData] = useState<
    Omit<WaveBuoyOgcFeature, 'type'>[] | null
  >(null);

  useEffect(() => {
    if (!map.current) return;
    const mapInstace = map.current;

    const handleMouseDown = (e: mapboxgl.MapMouseEvent & { originalEvent: MouseEvent }) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: [WAVE_BUOYS_LAYER_ID],
      });
      waveBuoysLayerClicked.current = !!(features && features.length > 0);
    };

    mapInstace.on('mousedown', handleMouseDown);
    return () => {
      mapInstace?.off('mousedown', handleMouseDown);
    };
  }, [map]);

  useEffect(() => {
    //click on clustered wave buoys layer
    if (!map.current || !circle || distanceMeasurement) return;
    const mapInstace = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstace.queryRenderedFeatures(e.point, {
        layers: [WAVE_BUOYS_LAYER_ID],
      });
      if (!features[0] || !features[0].properties) return;
      console.log(e.features);
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

  /**
   * how cluster works?
   * In a zoom level, if the points distance is within the clusterRadius, then these points will be clutered into one group.
   * With zoomin, the poins outsider clusterRadius will move out from clustered group and go into unclustered layer.
   *
   * getClusterLeaves can get points inside a cluser.
   *
   * When cluster not enabled, there is only one layer for all the points. And for the poinst that share the same cooridnate location, when click on it,
   * e.features can include all the points.
   * But when cluster enabled, the points in same coordinate location will be clustered. And when click on it, temporary points will be created aroung the
   * clustered point. So we cannot get all the points thourhg e.features. So in order to get all points data for same location and displayed in linechart,
   * need another way. currently, as for demo, we can use js method to get all the point within same location from geojson data source. In the future better
   * by calling api.
   *
   * And another problme in geojson data, coordinate precision only has one decimal, but in e.features.geometry.coordiates, the prcesion will have multiple decimals.
   * We can round the coordiates to one decimal to identify point from geojson.
   */

  useEffect(() => {
    //click on unclustered wave buoys layer.
    if (!map.current || !circle || distanceMeasurement) return;
    const mapInstace = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return; //queryRenderedFeatures can only get features displayed within viewport.

      console.log(e.features);

      const clusterId = e.features[0].properties?.cluster_id;
      const source = mapInstace.getSource(WAVE_BUOYS_SOURCE_ID) as mapboxgl.GeoJSONSource;
      console.log(clusterId);
      source.getClusterLeaves(clusterId, 100, 0, (err, leaves) => {
        if (err) return console.error(err);
        console.log('Features in cluster:', leaves);
        //TODO: get data from the point and the data consumed by line chart.
      });

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

      console.log(e.features);
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
        mapInstace.removeLayer(ZOOM_LIMIT_TEMP_POINTS_LAYER_ID);
        mapInstace.removeLayer(ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_LAYER_ID);
        mapInstace.removeSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID);
        mapInstace.removeSource(ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_SOURCE_ID);
      }
    };

    mapInstace.on('zoomend', handleZoomEnd);

    return () => {
      mapInstace?.off('zoomend', handleZoomEnd);
    };
  }, [map, circle]);

  return { clickedPointData, openDrawer, waveBuoysLayerClicked };
}
