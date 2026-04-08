/**
 * WebGLTiledOverlayField - Renders multiple tiles in a single WebGL layer
 * Uses TileManager for viewport culling and TexturePool for texture caching
 */

import * as twgl from 'twgl.js';
import { getColorRamp, webglOverlayFs, webglOverlayVs } from '@/utils';
import { gslaAnomalySeaLevelsRange } from '@/config';
import type { TileData, TileSourceConfig } from '@/utils/TileManager';
import { TileManager } from '@/utils/TileManager';
import { TexturePool } from '@/utils/TexturePool';

export interface ColorPalette {
  name: string;
  colors: Record<string, string>; // hex colors
}

export interface WebGLTiledOverlayFieldAPI {
  setTileSource: (config: TileSourceConfig) => void;
  updatePalette: (palette: ColorPalette) => void;
  setVisible: (visible: boolean) => void;
  draw: () => void;
  getStats: () => { tiles: any; textures: any };
}

export function webGLTiledOverlayField(
  map: mapboxgl.Map,
  gl: WebGLRenderingContext,
  initialPalette: ColorPalette,
): WebGLTiledOverlayFieldAPI {
  let palette: ColorPalette = initialPalette;
  let visible = false;

  // Tile and texture management
  const tileManager = new TileManager();
  const texturePool = new TexturePool(gl);

  // WebGL resources
  let programInfo: twgl.ProgramInfo | null = null;
  let paletteTexture: WebGLTexture | null = null;
  let bufferInfo: twgl.BufferInfo | null = null;

  /**
   * Initialize WebGL program and buffers
   */
  function initialize() {
    programInfo = twgl.createProgramInfo(gl, [webglOverlayVs, webglOverlayFs]);

    // Create a simple quad (same as original implementation)
    const arrays = {
      a_position: {
        numComponents: 2,
        data: [
          0,
          0, // bottom-left corner
          1,
          0, // bottom-right corner
          0,
          1, // top-left corner
          1,
          1, // top-right corner
        ],
      },
      a_texCoord: {
        numComponents: 2,
        data: [
          0,
          1, // texture coords are flipped in Y
          1,
          1,
          0,
          0,
          1,
          0,
        ],
      },
      indices: [0, 1, 2, 1, 3, 2],
    };

    bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    createPaletteTexture();
  }

  /**
   * Create palette texture for color mapping
   */
  function createPaletteTexture() {
    const colorRamp = getColorRamp(palette.colors);
    paletteTexture = twgl.createTexture(gl, {
      src: colorRamp,
      width: 256,
      height: 1,
      min: gl.LINEAR,
      mag: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
    });
  }

  /**
   * Set the tile source configuration
   */
  function setTileSource(config: TileSourceConfig) {
    tileManager.setSource(config);
  }

  /**
   * Update the color palette
   */
  function updatePalette(newPalette: ColorPalette) {
    palette = newPalette;
    createPaletteTexture();
  }

  /**
   * Set visibility
   */
  function setVisible(isVisible: boolean) {
    visible = isVisible;
  }

  /**
   * Draw all visible tiles
   * This is called every frame by Mapbox
   */
  function draw() {
    if (!visible || !programInfo || !bufferInfo || !paletteTexture) {
      return;
    }

    // Get current viewport bounds and zoom
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    // Get visible tiles from TileManager (includes viewport culling)
    const visibleTiles = tileManager.getVisibleTiles(
      {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      },
      zoom,
    );

    if (visibleTiles.length === 0) {
      return; // Nothing to draw
    }

    // Setup WebGL state
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(programInfo.program);

    // Bind palette texture (shared across all tiles)
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    const paletteTexLocation = gl.getUniformLocation(programInfo.program, 'u_paletteTexture');
    if (paletteTexLocation) gl.uniform1i(paletteTexLocation, 1);

    // Set buffer attributes once (shared across all tiles)
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // Draw each tile
    visibleTiles.forEach(tile => {
      drawTile(tile);
    });
  }

  /**
   * Draw a single tile
   */
  function drawTile(tile: TileData) {
    if (!tile.data || !programInfo || !bufferInfo) return;

    // Get texture from pool (or create if needed)
    const tileKey = `${tile.coord.z}/${tile.coord.x}/${tile.coord.y}`;
    const dataTexture = texturePool.getTexture(tileKey, tile.data);

    // Bind data texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    const dataTexLocation = gl.getUniformLocation(programInfo.program, 'u_dataTexture');
    if (dataTexLocation) gl.uniform1i(dataTexLocation, 0);

    // Project tile corners to screen coordinates
    const [west, south, east, north] = tile.bounds;
    const topLeft = map.project([west, north]);
    const topRight = map.project([east, north]);
    const bottomLeft = map.project([west, south]);
    const bottomRight = map.project([east, south]);

    // Set uniforms for this tile
    const uniforms = {
      u_topLeft: [topLeft.x, topLeft.y],
      u_topRight: [topRight.x, topRight.y],
      u_bottomLeft: [bottomLeft.x, bottomLeft.y],
      u_bottomRight: [bottomRight.x, bottomRight.y],
      u_viewport: [gl.canvas.width, gl.canvas.height],
      u_range: tile.range,
      u_legend_range: [gslaAnomalySeaLevelsRange[0], gslaAnomalySeaLevelsRange[1]],
    };

    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
  }

  /**
   * Get statistics for debugging/monitoring
   */
  function getStats() {
    return {
      tiles: tileManager.getStats(),
      textures: texturePool.getStats(),
    };
  }

  // Initialize on creation
  initialize();

  return {
    setTileSource,
    updatePalette,
    setVisible,
    draw,
    getStats,
  };
}
