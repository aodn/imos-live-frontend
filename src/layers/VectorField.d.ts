import type mapboxgl from 'mapbox-gl';
import type { CustomizableParticleConfig } from '@/config';

export type VectorFieldAPI = {
  /**
   * Set the input data (vector image + bounds + range).
   */
  setData(dataObject: {
    data: ImageBitmap;
    bounds: [number, number, number, number];
    range: number[][];
  }): void;

  /**
   * Update particle configuration dynamically.
   * This allows updating parameters like fadeOpacity, speedFactor, dropRate, etc.
   */
  updateConfig(config: Partial<CustomizableParticleConfig>): void;

  /**
   * Start animating particles.
   */
  startAnimation(): void;

  /**
   * Stop animating particles.
   */
  stopAnimation(): void;

  /**
   * Trigger a draw call (should be called every frame).
   */
  draw(): void;

  /**
   * Handle resize logic (reallocates textures).
   */
  resize(): void;
};

/**
 * Creates a GPU-accelerated particle system for visualizing vector fields.
 * @param map A Mapbox GL map instance
 * @param gl The WebGL2RenderingContext to render into
 * @returns An object to control and update the vector field simulation
 */
declare function VectorField(map: mapboxgl.Map, gl: WebGL2RenderingContext): VectorFieldAPI;

export default VectorField;
