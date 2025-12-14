import { BuoyHoverPopupContent } from '@/components';
import { CLUSTER_MAX_ZOOM } from '@/config';
import {
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID,
} from '@/constants';
import {
  type ClosePopupFn,
  createZoomLimitPoints,
  removeZoomLimitTempPoints,
  showPopup,
} from '@/helpers';
import { useDrawerStore, openBottomDrawer } from '@/store';
import type {
  WaveBuoyGeometry,
  WaveBuoyPositionFeature,
  WaveBuoyPositionProperties,
} from '@/types';
import { coordinateToLngLat, normalizeWaveBuouysData } from '@/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

const layers = [
  WAVE_BUOYS_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
] as const;

export function useWaveBuoysLayerEventHandler(
  map: React.RefObject<mapboxgl.Map | null>,
  waveBuoyEnabled: boolean,
  distanceMeasurement: boolean,
) {
  const waveBuoysLayerClicked = useRef(false);
  const tempPointsEventPrevent = useRef(false);
  const selectedFeatureId = useRef<string | number | null>(null);
  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null);
  const popupCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bottomDrawer = useDrawerStore(s => s.bottomDrawer);

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
    if (!map.current || !waveBuoyEnabled) return;
    const mapInstance = map.current;

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
  }, [waveBuoyEnabled, map]);

  useEffect(() => {
    if (!map.current || !waveBuoyEnabled) return;
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
  }, [waveBuoyEnabled, map]);

  useEffect(() => {
    //click on clustered wave buoys layer
    if (!map.current || !waveBuoyEnabled || distanceMeasurement) return;
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

        if (typeof zoom === 'number' && zoom <= CLUSTER_MAX_ZOOM) {
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
  }, [waveBuoyEnabled, map, distanceMeasurement]);

  useEffect(() => {
    //click on unclustered wave buoys layer.
    if (!map.current || !waveBuoyEnabled || distanceMeasurement) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      const feature = e.features[0];
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
  }, [waveBuoyEnabled, map, distanceMeasurement]);

  useEffect(() => {
    //hover on unclustered wave buoys layer.
    if (!map.current || !waveBuoyEnabled || distanceMeasurement) return;
    const mapInstance = map.current;

    const handleMouseEnter = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;

      const { geometry, properties } = e.features[0];
      const { coordinates } = geometry as WaveBuoyGeometry;
      const { buoy, date } = properties as WaveBuoyPositionProperties;

      const lngLat = coordinateToLngLat(coordinates);

      if (popupCloseTimeoutRef.current) {
        clearTimeout(popupCloseTimeoutRef.current);
        popupCloseTimeoutRef.current = null;
      }

      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
        hoverPopupRef.current = null;
      }

      const popup = showPopup({
        map,
        lngLat,
        PopupContent: (closeFn: ClosePopupFn) => (
          <BuoyHoverPopupContent buoy={buoy} date={date} onClose={closeFn} />
        ),
      });

      if (popup) {
        hoverPopupRef.current = popup;

        const popupElement = popup.getElement();
        if (popupElement) {
          const handlePopupMouseEnter = () => {
            if (popupCloseTimeoutRef.current) {
              clearTimeout(popupCloseTimeoutRef.current);
              popupCloseTimeoutRef.current = null;
            }
          };

          const handlePopupMouseLeave = () => {
            if (hoverPopupRef.current) {
              hoverPopupRef.current.remove();
              hoverPopupRef.current = null;
            }
          };
          //add mouse enter and leave event to popup element
          popupElement.addEventListener('mouseenter', handlePopupMouseEnter);
          popupElement.addEventListener('mouseleave', handlePopupMouseLeave);

          popup.on('close', () => {
            popupElement.removeEventListener('mouseenter', handlePopupMouseEnter);
            popupElement.removeEventListener('mouseleave', handlePopupMouseLeave);
          });
        }
      }
    };

    const handleMouseLeave = () => {
      // delay closing the popup to allow mouse to move to the popup
      popupCloseTimeoutRef.current = setTimeout(() => {
        if (hoverPopupRef.current) {
          hoverPopupRef.current.remove();
          hoverPopupRef.current = null;
        }
        popupCloseTimeoutRef.current = null;
      }, 200);
    };

    mapInstance.on('mouseenter', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleMouseEnter);
    mapInstance.on('mouseleave', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleMouseLeave);
    mapInstance.on('mouseenter', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleMouseEnter);
    mapInstance.on('mouseleave', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleMouseLeave);
    return () => {
      mapInstance?.off('mouseenter', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleMouseEnter);
      mapInstance?.off('mouseleave', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleMouseLeave);
      mapInstance.on('mouseenter', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleMouseEnter);
      mapInstance.on('mouseleave', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleMouseLeave);
      // clean up timeout and popup on unmount
      if (popupCloseTimeoutRef.current) {
        clearTimeout(popupCloseTimeoutRef.current);
        popupCloseTimeoutRef.current = null;
      }
      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
        hoverPopupRef.current = null;
      }
    };
  }, [waveBuoyEnabled, map, distanceMeasurement]);

  useEffect(() => {
    //click on ZOOM_LIMIT_TEMP_POINTS_LAYER, because points are too close so that cannot be displayed invidiually. This is the layer temporarily created to display thoese points
    if (!map.current || !waveBuoyEnabled || distanceMeasurement) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      setClickedPointData(normalizeWaveBuouysData(e.features));
    };

    mapInstance.on('click', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleClick);
    return () => {
      mapInstance?.off('click', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleClick);
    };
  }, [waveBuoyEnabled, map, distanceMeasurement]);

  useEffect(() => {
    //disppeart ZOOM_LIMIT_TEMP_POINTS_LAYER when zoom within clusterMaxZoom level.
    if (!map.current || !waveBuoyEnabled) return;
    const mapInstance = map.current;

    const handleZoomEnd = () => {
      const currentZoom = mapInstance.getZoom();

      if (
        currentZoom <= CLUSTER_MAX_ZOOM &&
        mapInstance.getSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID)
      ) {
        removeZoomLimitTempPoints(map);
      }
    };

    mapInstance.on('zoomend', handleZoomEnd);

    return () => {
      mapInstance?.off('zoomend', handleZoomEnd);
    };
  }, [map, waveBuoyEnabled]);

  // Clear unclustered waveBuoyEnabled selection when drawer closed.
  useEffect(() => {
    if (!bottomDrawer.isOpen) {
      clearSelection();
    }
  }, [bottomDrawer.isOpen, clearSelection]);

  return {
    clickedPointData,
    openDrawer: openBottomDrawer,
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
