import mapboxgl from "mapbox-gl";

export interface VectorFieldAPI {
  /**
   * Set the input data (vector image + bounds + range).
   */
  setData(dataObject: {
    data: ImageBitmap;
    bounds: [number, number, number, number];
    range: number[][];
  }): void;

  /**
   * Set how many particles are used in the simulation.
   */
  setParticleNum(num: number): void;

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
}

/**
 * Creates a GPU-accelerated particle system for visualizing vector fields.
 * @param map A Mapbox GL map instance
 * @param gl The WebGLRenderingContext to render into
 * @returns An object to control and update the vector field simulation
 */
declare function VectorField(
  map: mapboxgl.Map,
  gl: WebGLRenderingContext,
): VectorFieldAPI;

export default VectorField;
