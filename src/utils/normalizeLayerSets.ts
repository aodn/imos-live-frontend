import { LayersDataset } from '@/components';
import {
  GSLA_OVERLAY_SOURCE_ID,
  OVERLAY_LAYER_ID,
  OverlaySource,
  PARTICLE_LAYER_ID,
  SST_ANOMALY_MOSAIC_LAYER_ID,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
  WAVE_BUOYS_LAYER_ID,
} from '@/constants';
import { MapUIState } from '@/store';

/**
 * This is to add display layer function and layer visible state to data consumed by
 * LayerSets component.
 */
export const normalizeLayerSets = (
  layersDatasets: LayersDataset[],
  fns: Pick<MapUIState, 'setParticles' | 'setCircle' | 'setOverlay'>,
  visibiles: Pick<MapUIState, 'circle' | 'particles' | 'overlay'>,
  selectedOverlay: OverlaySource,
): LayersDataset[] => {
  return layersDatasets.map(layer => {
    if (layer.layerId === OVERLAY_LAYER_ID) {
      layer.addToMap = v => {
        fns.setOverlay(v, GSLA_OVERLAY_SOURCE_ID);
      };
      layer.visible = visibiles.overlay && selectedOverlay === GSLA_OVERLAY_SOURCE_ID;
    }
    if (layer.layerId === PARTICLE_LAYER_ID) {
      layer.addToMap = fns.setParticles;
      layer.visible = visibiles.particles;
    }
    if (layer.layerId === WAVE_BUOYS_LAYER_ID) {
      layer.addToMap = fns.setCircle;
      layer.visible = visibiles.circle;
    }
    if (layer.layerId === SST_ANOMALY_MOSAIC_LAYER_ID) {
      layer.addToMap = v => {
        fns.setOverlay(v, SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID);
      };
      layer.visible = visibiles.overlay && selectedOverlay === SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID;
    }
    return layer;
  });
};
