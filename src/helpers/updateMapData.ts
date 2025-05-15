import { addOrUpdateImageSource } from '@/helpers/addOrUpdateImageSource.ts';
import { addOrUpdateGeoJsonSource } from '@/helpers/addOrUpdateGeoJsonSource.ts';
import { OVERLAY_SOURCE_ID, PARTICLE_SOURCE_ID, WAVE_BUOYS_SOURCE_ID } from '@/constants';
import { ProcessedMetaType } from '@/utils';
import { VectoryLayerInterface } from '@/layers';

type LayerSources = {
  particleSource: string;
  overlaySource: string;
  waveBuoysSource: string;
};

export function updateMapData(
  layerSources: LayerSources,
  metaData: ProcessedMetaType,
  map: mapboxgl.Map,
  particleLayer: React.RefObject<VectoryLayerInterface | null>,
) {
  const { maxBounds, bounds, lonRange, latRange, uRange, vRange } = metaData;
  const { particleSource, overlaySource, waveBuoysSource } = layerSources;
  map.setMaxBounds(maxBounds);
  particleLayer.current!.metadata = {
    bounds,
    range: [uRange, vRange],
  };
  addOrUpdateImageSource(map, PARTICLE_SOURCE_ID, particleSource, lonRange, latRange);
  addOrUpdateImageSource(map, OVERLAY_SOURCE_ID, overlaySource, lonRange, latRange);
  addOrUpdateGeoJsonSource(map, WAVE_BUOYS_SOURCE_ID, waveBuoysSource);
}
