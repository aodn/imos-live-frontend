/**
 * WebGLTiledOverlayLayer - Mapbox custom layer wrapper for tiled overlay rendering
 * This is the interface between Mapbox and our tiled WebGL renderer
 */

import type { ColorPalette, WebGLTiledOverlayFieldAPI } from './WebGLTiledOverlayField';
import { webGLTiledOverlayField } from './WebGLTiledOverlayField';
import type { TileSourceConfig } from '@/utils/TileManager';

export interface WebGLTiledOverlayLayerInterface extends mapboxgl.CustomLayerInterface {
  visible: boolean;
  palette: ColorPalette;
  webGLTiledOverlayField?: WebGLTiledOverlayFieldAPI;
  setTileSource: (config: TileSourceConfig) => void;
  setVisible: (visible: boolean) => void;
  updatePalette: (palette: ColorPalette) => void;
  getStats: () => { tiles: any; textures: any } | null;
}

export const webGLTiledOverlayLayer = (
  id: string,
  initialPalette: ColorPalette,
): WebGLTiledOverlayLayerInterface => ({
  id,
  visible: false,
  palette: initialPalette,

  /**
   * Called when the layer is added to the map
   * Initialize the WebGL renderer here
   */
  onAdd(map, gl) {
    this.webGLTiledOverlayField = webGLTiledOverlayField(map, gl, this.palette);
  },

  /**
   * Called every frame to render the layer
   */
  render() {
    this.webGLTiledOverlayField?.draw();
  },

  /**
   * Configure the tile source
   * @param config - Tile source configuration with URL template and metadata
   */
  setTileSource(config: TileSourceConfig) {
    this.webGLTiledOverlayField?.setTileSource(config);
    if (this.visible) {
      this.webGLTiledOverlayField?.setVisible(true);
    }
  },

  /**
   * Set layer visibility
   */
  setVisible(visible: boolean) {
    this.visible = visible;
    this.webGLTiledOverlayField?.setVisible(visible);
  },

  /**
   * Update the color palette
   */
  updatePalette(newPalette: ColorPalette) {
    this.palette = newPalette;
    this.webGLTiledOverlayField?.updatePalette(newPalette);
  },

  /**
   * Get statistics for debugging
   */
  getStats() {
    return this.webGLTiledOverlayField?.getStats() ?? null;
  },

  type: 'custom' as const,
});
