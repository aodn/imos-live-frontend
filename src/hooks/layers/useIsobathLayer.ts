import {
  ISOBATH_LABEL_CONFIG,
  ISOBATH_LABEL_LAYER_ID,
  ISOBATH_LABEL_SOURCE_ID,
  ISOBATH_LINE_CONFIG,
  ISOBATH_LINE_LAYER_ID,
  ISOBATH_SOURCE_ID,
} from '@/constants';
import {
  addLayerInOrder,
  addOrUpdateGeoJsonSource,
  addOrUpdateVectorSource,
  buildIsobathLabels,
} from '@/helpers';
import { lineLayer, symbolLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { isobathStyle } from '@/styles';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

const EMPTY_LABELS: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

// Depth contour lines plus one depth label per line in the viewport, toggled by `isobathsEnabled`.
export function useIsobathLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const isobathsEnabled = useMapUIStore(s => s.isobathsEnabled);
  // Last label data written, so `idle` doesn't loop on identical updates.
  const lastLabelsRef = useRef('');

  const isobathLineLayer = useMemo(
    () =>
      lineLayer(
        { id: ISOBATH_LINE_LAYER_ID, source: ISOBATH_SOURCE_ID, ...ISOBATH_LINE_CONFIG },
        isobathsEnabled,
      ),
    [isobathsEnabled],
  );

  const isobathLabelLayer = useMemo(
    () =>
      symbolLayer(
        { id: ISOBATH_LABEL_LAYER_ID, source: ISOBATH_LABEL_SOURCE_ID, ...ISOBATH_LABEL_CONFIG },
        isobathsEnabled,
      ),
    [isobathsEnabled],
  );

  const layers = useMemo(
    () => [isobathLineLayer, isobathLabelLayer],
    [isobathLineLayer, isobathLabelLayer],
  );

  const setupLayer = useCallback(async () => {
    if (!map.current) return;
    addOrUpdateVectorSource({ map: map.current, id: ISOBATH_SOURCE_ID, url: isobathStyle.source });
    addOrUpdateGeoJsonSource({ map: map.current, id: ISOBATH_LABEL_SOURCE_ID, data: EMPTY_LABELS });
    lastLabelsRef.current = '';
    layers.forEach(layer => addLayerInOrder(map, layer));
  }, [map, layers]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useMapboxLayerVisibility(map, loadComplete, layers, isobathsEnabled);

  // Re-place labels whenever the map settles (after pan/zoom and tile loads).
  useEffect(() => {
    const m = map.current;
    if (!m || !loadComplete || !isobathsEnabled) return;

    const updateLabels = () => {
      if (!m.getLayer(ISOBATH_LINE_LAYER_ID)) return;
      const canvas = m.getCanvas();
      const labels = buildIsobathLabels(
        m.queryRenderedFeatures({ layers: [ISOBATH_LINE_LAYER_ID] }),
        {
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          project: lngLat => m.project(lngLat),
          unproject: ({ x, y }) => m.unproject([x, y]).toArray() as [number, number],
        },
      );
      const serialized = JSON.stringify(labels);
      if (serialized === lastLabelsRef.current) return;
      lastLabelsRef.current = serialized;
      addOrUpdateGeoJsonSource({ map: m, id: ISOBATH_LABEL_SOURCE_ID, data: labels });
    };

    updateLabels();
    m.on('idle', updateLabels);
    return () => {
      m.off('idle', updateLabels);
    };
  }, [map, loadComplete, isobathsEnabled]);
}
