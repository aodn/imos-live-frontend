import * as twgl from 'twgl.js';
import { getColorRamp, webglOverlayFs, webglOverlayVs } from '@/utils';
import mapboxgl from 'mapbox-gl';

export type ColorPalette = {
  name: string;
  colors: Record<string, string>; // hex colors
};

type GSLAData = {
  data: ImageBitmap;
  range: [number, number];
  bounds: [number, number, number, number]; // [west, south, east, north]
  legendRange?: [number, number];
};

export interface WebGLOverlayFieldAPI {
  setData: (dataObject: GSLAData) => void;
  updatePalette: (palette: ColorPalette) => void;
  setVisible: (visible: boolean) => void;
  draw: () => void;
}

export function webGLOverlayField(
  map: mapboxgl.Map,
  gl: WebGLRenderingContext,
  initialPalette: ColorPalette,
): WebGLOverlayFieldAPI {
  let data: ImageBitmap | null = null;
  let bounds: [number, number, number, number] = [0, 0, 0, 0];
  let range: [number, number];
  let legendRange: [number, number] | undefined;
  let palette: ColorPalette = initialPalette;

  let programInfo: twgl.ProgramInfo | null = null;
  let dataTexture: WebGLTexture | null = null;
  let paletteTexture: WebGLTexture | null = null;
  let bufferInfo: twgl.BufferInfo | null = null;
  let visible = false;

  function initialize() {
    programInfo = twgl.createProgramInfo(gl, [webglOverlayVs, webglOverlayFs]);

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
  }

  function createDataTexture() {
    if (!data) {
      console.log('No data for texture creation');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = data.width;
    canvas.height = data.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    ctx.drawImage(data, 0, 0);
    const imageData = ctx.getImageData(0, 0, data.width, data.height);

    dataTexture = twgl.createTexture(gl, {
      src: imageData,
      width: data.width,
      height: data.height,
      min: gl.LINEAR,
      mag: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
    });
  }

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

  function setData(dataObject: GSLAData) {
    ({ data, bounds, range, legendRange } = dataObject);
    if (!programInfo) initialize();

    if (gl && data) {
      createDataTexture();
      createPaletteTexture();
    } else {
      console.error('Missing GL context or data');
    }
  }

  function updatePalette(newPalette: ColorPalette) {
    palette = newPalette;
    createPaletteTexture();
  }

  function setVisible(isVisible: boolean) {
    visible = isVisible;
  }

  function draw() {
    if (!visible || !programInfo || !bufferInfo || !dataTexture || !paletteTexture) {
      return;
    }

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(programInfo.program);

    // Bind textures manually
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dataTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);

    const dataTexLocation = gl.getUniformLocation(programInfo.program, 'u_dataTexture');
    const paletteTexLocation = gl.getUniformLocation(programInfo.program, 'u_paletteTexture');

    if (dataTexLocation) gl.uniform1i(dataTexLocation, 0);
    if (paletteTexLocation) gl.uniform1i(paletteTexLocation, 1);

    const [west, south, east, north] = bounds;

    // Project all four corners to pixel coordinates
    const topLeft = map.project([west, north]);
    const topRight = map.project([east, north]);
    const bottomLeft = map.project([west, south]);
    const bottomRight = map.project([east, south]);

    // Mercator Y values for north/south boundaries — passed to the shader so it
    // can invert the Mercator projection and map each fragment to the correct row
    // of the equirectangular source image, fixing the southward drift at Australia's latitudes.
    const northMercY = mapboxgl.MercatorCoordinate.fromLngLat({ lng: west, lat: north }).y;
    const southMercY = mapboxgl.MercatorCoordinate.fromLngLat({ lng: west, lat: south }).y;

    const uniforms = {
      u_topLeft: [topLeft.x, topLeft.y],
      u_topRight: [topRight.x, topRight.y],
      u_bottomLeft: [bottomLeft.x, bottomLeft.y],
      u_bottomRight: [bottomRight.x, bottomRight.y],
      u_viewport: [gl.canvas.width, gl.canvas.height],
      u_range: [range[0], range[1]],
      u_legend_range: legendRange ?? [range[0], range[1]],
      u_merc_y_north: northMercY,
      u_merc_y_south: southMercY,
      u_lat_range: [south, north],
    };

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
  }

  return { setData, updatePalette, setVisible, draw };
}
