import { LayersDataset } from '@/components';
import { OVERLAY_LAYER_ID, PARTICLE_LAYER_ID, WAVE_BUOYS_LAYER_ID } from '@/constants';

/**
 * This is to add display layer function and layer visible state to data consumed by
 * LayerSets component.
 */
export const normalizeLayerSets = (
  layersDatasets: LayersDataset[],
  fns: {
    setOverlay: (v: boolean) => void;
    setCircle: (v: boolean) => void;
    setParticles: (v: boolean) => void;
  },
  visibiles: {
    overlay: boolean;
    particles: boolean;
    circle: boolean;
  },
): LayersDataset[] => {
  return layersDatasets.map(layer => {
    if (layer.layerId === OVERLAY_LAYER_ID) {
      layer.addToMap = fns.setOverlay;
      layer.visible = visibiles.overlay;
    }
    if (layer.layerId === PARTICLE_LAYER_ID) {
      layer.addToMap = fns.setParticles;
      layer.visible = visibiles.particles;
    }
    if (layer.layerId === WAVE_BUOYS_LAYER_ID) {
      layer.addToMap = fns.setCircle;
      layer.visible = visibiles.circle;
    }
    return layer;
  });
};
