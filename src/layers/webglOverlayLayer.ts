import type { ColorPalette, WebGLOverlayFieldAPI } from './WebGLOverlayField';
import { webGLOverlayField } from './WebGLOverlayField';

export interface WebGLOverlayLayerInterface extends mapboxgl.CustomLayerInterface {
  sourceId: string;
  visible: boolean;
  metadata?: {
    bounds: [number, number, number, number];
    range: [number, number]; //the range of the data values, used for color mapping
    legendRange?: [number, number]; //the range to display in the legend, which may differ from the actual data range for better visualization
  };
  webGLOverlayField?: WebGLOverlayFieldAPI;
  palette: ColorPalette;
  setData: (data: ImageBitmap) => void;
  setVisible: (visible: boolean) => void;
  updatePalette: (palette: ColorPalette) => void;
}

export const webGLOverlayLayer = (
  id: string,
  sourceId: string,
  initialPalette: ColorPalette,
): WebGLOverlayLayerInterface => ({
  id,
  sourceId,
  visible: false,
  palette: initialPalette,

  onAdd(map, gl) {
    this.webGLOverlayField = webGLOverlayField(map, gl, this.palette);
    map.on('sourcedata', e => {
      if (e?.sourceId !== this.sourceId || !e?.isSourceLoaded) return;
      const source = map.getSource(this.sourceId);
      if (!source) return;
      if ('image' in source && source.image instanceof ImageBitmap) {
        this.setData(source.image);
      }
    });
  },
  render() {
    this.webGLOverlayField?.draw();
  },
  setData(data: ImageBitmap) {
    if (!this.metadata) return;
    this.webGLOverlayField?.setData({
      data,
      range: this.metadata.range,
      bounds: this.metadata.bounds,
    });
    if (this.visible) this.webGLOverlayField?.setVisible(true);
  },
  setVisible(visible: boolean) {
    this.visible = visible;
    this.webGLOverlayField?.setVisible(visible);
  },
  updatePalette(newPalette: ColorPalette) {
    this.palette = newPalette;
    this.webGLOverlayField?.updatePalette(newPalette);
  },
  type: 'custom' as const,
});
