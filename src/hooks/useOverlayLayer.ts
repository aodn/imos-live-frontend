import { getMetaData } from '@/api';
import { useToast } from '@/components';
import { overlayLayerConfig } from '@/config';
import {
  GSLA_META_NAME,
  GSLA_SEA_LEVEL_NAME,
  OVERLAY_LAYER_ID,
  OVERLAY_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource, CoordinatesType } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { buildGSLADatasetFullPath, buildGSLADatasetPath, processMetaData } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Layer } from 'mapbox-gl';
import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

export function useOverlayLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const { showToast } = useToast();
  const { overlay, dataset, setOverlay } = useMapUIStore(
    useShallow(s => ({
      overlay: s.overlay,
      dataset: s.dataset,
      setOverlay: s.setOverlay,
    })),
  );
  const gslaQuery = useQuery({
    queryKey: [GSLA_META_NAME, dataset],
    queryFn: () => getMetaData(buildGSLADatasetPath(dataset, GSLA_META_NAME)),
  });
  const overlayLayer = useMemo(
    () =>
      imageLayer(
        { id: OVERLAY_LAYER_ID, source: OVERLAY_SOURCE_ID, ...overlayLayerConfig },
        overlay,
      ),
    [overlay],
  );

  useEffect(() => {
    const layer = map.current?.getLayer(overlayLayer.id);
    if (!layer) return;
    if (overlayLayer.layout === layer.layout) return;
    if (overlayLayer.layout && 'visibility' in overlayLayer.layout) {
      map.current?.setLayoutProperty(overlayLayer.id, 'visibility', overlayLayer.layout.visibility);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayLayer]);

  const addLayersBackAfterStyleChanges = async (layer: Layer) => {
    try {
      const data = await gslaQuery.promise;
      if (!data) return;
      const { lonRange, latRange } = processMetaData(data);

      addOrUpdateImageSource(
        map.current!,
        OVERLAY_SOURCE_ID,
        buildGSLADatasetFullPath(dataset, GSLA_SEA_LEVEL_NAME),
        lonRange,
        latRange,
      );
      addLayerInOrder(map, layer);
    } catch (error) {
      console.error('Error adding layers back after style changes:', error);
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get GSLA anamly sea level data of this date',
        duration: 6000,
      });
    }
  };

  useEffect(() => {
    const currentMap = map.current;
    const handleStyleLoad = () => addLayersBackAfterStyleChanges(overlayLayer);
    currentMap?.on('style.load', handleStyleLoad);
    return () => {
      currentMap?.off('style.load', handleStyleLoad);
      return;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, overlayLayer]);

  useEffect(() => {
    if (!gslaQuery.data) return;
    const gslaSource = map.current?.getSource(OVERLAY_SOURCE_ID);
    if (!gslaSource || gslaSource.type !== 'image') return;

    const { lonRange, latRange } = processMetaData(gslaQuery.data);
    const coordinates: CoordinatesType = [
      [lonRange[0], latRange[1]],
      [lonRange[1], latRange[1]],
      [lonRange[1], latRange[0]],
      [lonRange[0], latRange[0]],
    ];
    gslaSource.updateImage({
      url: buildGSLADatasetFullPath(dataset, GSLA_SEA_LEVEL_NAME),
      coordinates,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gslaQuery.data, dataset]);

  useEffect(() => {
    if (gslaQuery.isError && overlay) setOverlay(false);
  }, [gslaQuery.isError, overlay, setOverlay]);
}
