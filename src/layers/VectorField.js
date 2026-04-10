import mapboxgl from 'mapbox-gl';
import * as twgl from 'twgl.js';
import { vectorVs, vectorFs, vectorVsQuad, vectorFsScreen, vectorFsUpdate } from '../utils';
import { particleConfig } from '@/store';

/**
 * fadeOpacity, speedFactor, dropRate, pointSize, etc. are just values that get read during the animation loop, 
 * whichi is cheap and immediate.
 * 
 * changing nParticles requires GPU texture reallocation in setParticles() 
  1. Calculate new texture dimensions: particleRes = Math.ceil(Math.sqrt(num))
  2. Allocate new memory: new Uint8Array(numParticles * 4)
  3. Create new WebGL textures: Two textures for ping-pong rendering
  4. Create new vertex buffer: particleIndices array
  5. Randomize all particles: Fresh random positions

  This is expensive and visually disruptive - all particles reset to random positions.
 */

const config = particleConfig;

function VectorField(map, gl) {
  // Required to use float textures (RG32F) as framebuffer render targets
  gl.getExtension('EXT_color_buffer_float');
  let data;
  let bounds;
  let range;
  let programInfo;
  let textures;
  let screenProgramInfo;
  let updateProgramInfo;
  let particleTextures;
  let dataTextures;
  let colorRampTexture;
  let numParticles;
  let framebuffer;
  let particleIndices;
  let particleRes;
  let state = 'PAUSED';
  let mapBounds;
  let nParticles = config.nParticles;

  let animationId;

  function setBounds(bounds) {
    const nw = bounds.getNorthWest();
    const se = bounds.getSouthEast();
    const nwMercator = mapboxgl.MercatorCoordinate.fromLngLat(nw);
    const seMercator = mapboxgl.MercatorCoordinate.fromLngLat(se);

    //minx miny maxx maxy
    mapBounds = [nwMercator.x, seMercator.y, seMercator.x, nwMercator.y];
  }

  /**
   * Sets simulation data (PNG image + meta info).
   * @param {{
   *   data: ImageBitmap,
   *   bounds: number[],
   *   range: number[][]
   * }} dataObject - Includes the image, bounds, and U/V vector range.
   */
  function setData(dataObject) {
    //set vectorField data and bounds of data, and range of vector components
    ({ data, bounds, range } = dataObject);
    //initialize settings, programs, buffers
    initialize();
  }

  /**
   * Update particle configuration dynamically.
   * @param {Object} newConfig - Partial config object with properties to update.
   */
  function updateConfig(newConfig) {
    if (newConfig.nParticles !== undefined && newConfig.nParticles !== nParticles) {
      nParticles = newConfig.nParticles;
      setParticles(nParticles);
    }
    Object.assign(config, newConfig);
  }

  /**
   * This defines a 2D texture grid (width × height) big enough to hold all particles. Each "pixel" in this texture is one particle.
   * populate a texture where each particle has a random (x, y) position encoded in RG (red/green) channels, so it generate particles and
   * spread out randomly.
   * @private
   * @param {number} num - Number of particles.
   */
  function setParticles(num) {
    particleRes = Math.ceil(Math.sqrt(num));
    numParticles = particleRes * particleRes;

    // Particle position textures — GPU-side scratch space that tracks where each
    // particle is. These have nothing to do with the ocean current PNG (u_image).
    // Every frame, vectorFsUpdate reads from one texture and writes updated
    // positions to the other (ping-pong), then they swap.
    //
    // In WebGL1 positions had to be packed into RGBA Uint8 bytes (the toRGBA /
    // fromRGBA trick) because WebGL1 cannot render to float textures. WebGL2
    // supports RG32F as a framebuffer attachment (via EXT_color_buffer_float), so
    // x and y are stored as plain floats — R channel = x, G channel = y.
    // numParticles * 2 because each particle is 2 floats (x, y), not 4 bytes.
    const particleState = new Float32Array(numParticles * 2);
    for (let i = 0; i < numParticles; i++) {
      particleState[i * 2] = Math.random(); // x
      particleState[i * 2 + 1] = Math.random(); // y
    }

    //create two textures for the particles
    //known as ping-ponging or FBO-based simulation
    particleTextures = twgl.createTextures(gl, {
      particleTexture0: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: particleRes,
        height: particleRes,
        internalFormat: gl.RG32F,
        format: gl.RG,
        type: gl.FLOAT,
        src: particleState,
        wrap: gl.CLAMP_TO_EDGE,
      },
      particleTexture1: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: particleRes,
        height: particleRes,
        internalFormat: gl.RG32F,
        format: gl.RG,
        type: gl.FLOAT,
        src: particleState,
        wrap: gl.CLAMP_TO_EDGE,
      },
    });
    //Creates a buffer of indices: [0, 1, 2, ..., numParticles-1]
    //This can be passed to a vertex shader as an attribute
    //The shader uses this to find each particle’s position in the texture
    particleIndices = new Float32Array(numParticles);
    for (let i = 0; i < numParticles; i++) {
      particleIndices[i] = i;
    }
  }

  /**
   * Sets a new color ramp texture for particles, the 1D color gradient texture generated by getColorRamp converted to a 16×16 gradient texture.
   * @private
   * @param {Record<string, string>} colors - Normalized keys with color values.
   */
  function setColorRamp(colors) {
    colorRampTexture = twgl.createTextures(gl, {
      colorRampTexture: {
        mag: gl.LINEAR,
        min: gl.LINEAR,
        width: 16,
        height: 16,
        format: gl.RGBA,
        src: getColorRamp(colors),
        wrap: gl.CLAMP_TO_EDGE,
      },
    });
  }

  /**
   * Initializes shaders, textures, buffers for the simulation.
   * Called on first `setData()` or when particle count changes.
   * @private
   */
  function initialize() {
    //WGL (Tiny WebGL), a helper library that simplifies working with WebGL
    //below creating WebGL shader programs, and wrapping them in programInfo objects that make them easy to use.
    //WebGL program is a compiled and linked combination of:A vertex shader (runs per vertex) and A fragment shader (runs per pixel/fragment)
    //Together, these define how things are drawn on the screen in the WebGL context.

    //Draw particles
    programInfo = twgl.createProgramInfo(gl, [vectorVs, vectorFs]);
    //Render final frame to screen
    screenProgramInfo = twgl.createProgramInfo(gl, [vectorVsQuad, vectorFsScreen]);
    //Update particle positions
    updateProgramInfo = twgl.createProgramInfo(gl, [vectorVsQuad, vectorFsUpdate]);

    //initial setting of particle positions
    setParticles(nParticles);

    //initial setting of particle colors
    setColorRamp(config.colours);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = data.width;
    canvas.height = data.height;
    context.drawImage(data, 0, 0);

    //get image pixels from canvas
    //getImageData returns an ImageData object that contains the pixel data for the specified rectangle of the canvas.
    const myData = context.getImageData(0, 0, data.width, data.height);

    const emptyPixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);

    // u_image is the ocean current PNG — read-only input that tells the shader the
    // velocity (U, V) at every geographic point. U is encoded in the R channel and
    // V in the G channel of the PNG pixels. Format stays gl.RGBA because that is
    // what the PNG provides; we never write to this texture.
    // This is completely separate from the particle position textures below.
    dataTextures = twgl.createTextures(gl, {
      u_image: {
        mag: gl.LINEAR,
        min: gl.LINEAR,
        width: myData.width,
        height: myData.height,
        format: gl.RGBA,
        src: myData.data,
      },
    });

    textures = twgl.createTextures(gl, {
      backgroundTexture: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: gl.canvas.width,
        height: gl.canvas.height,
        format: gl.RGBA,
        src: emptyPixels,
        wrap: gl.CLAMP_TO_EDGE,
      },
      screenTexture: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: gl.canvas.width,
        height: gl.canvas.height,
        format: gl.RGBA,
        src: emptyPixels,
        wrap: gl.CLAMP_TO_EDGE,
      },
    });

    framebuffer = gl.createFramebuffer();
  }

  /**
   * Draws the particles using current velocity and color shaders.
   * @private
   */
  function drawParticles() {
    //vectorVs, vectorFs is used here.
    gl.useProgram(programInfo.program);

    const arrays = {
      a_index: {
        numComponents: 1,
        data: particleIndices,
      },
    };

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    const uniforms = {
      u_vector: dataTextures.u_image,
      u_particles: particleTextures.particleTexture0,
      u_color_ramp: colorRampTexture.colorRampTexture,
      u_particles_res: particleRes,
      u_vector_min: [range[0][0], range[1][0]],
      u_vector_max: [range[0][1], range[1][1]],
      u_vector_res: [data.width, data.height],
      u_bounds: mapBounds,
      u_data_bounds: bounds,
      u_point_size: config.pointSize,
      u_max_speed: config.maxSpeed,
    };

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    // pass data into shader.
    twgl.setUniforms(programInfo, uniforms);

    twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);
  }

  /**
   * Draws a WebGL texture to the current framebuffer.
   * @private
   * @param {WebGLTexture} texture - The texture to render.
   * @param {number} opacity - Opacity between 0–1.
   */
  function drawTexture(texture, opacity) {
    //vectorVsQuad, vectorFsScreen is used here
    gl.useProgram(screenProgramInfo.program);

    const arrays = {
      a_pos: {
        numComponents: 2,
        data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      },
    };

    const uniforms = {
      u_screen: texture,
      u_opacity: opacity,
    };

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    twgl.setBuffersAndAttributes(gl, screenProgramInfo, bufferInfo);
    twgl.setUniforms(screenProgramInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
  }

  /**
   * Draws the current simulation frame: particles and background texture.
   * Called during animation loop.
   * @private
   */
  function drawScreen() {
    if (!textures || !textures.screenTexture) {
      return; // Skip drawing if textures are not ready.
    }
    //bind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    //draw to screenTexture
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      textures.screenTexture,
      0,
    );
    //set viewport to size of canvas
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    //first disable blending
    gl.disable(gl.BLEND);

    //draw backgroundTexture to screenTexture target
    drawTexture(textures.backgroundTexture, config.fadeOpacity);
    //draw particles to screentexture
    drawParticles();

    //target normal canvas by setting FRAMEBUFFER to null
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //enable blending for final render to map
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    drawTexture(textures.screenTexture, 1.0);

    gl.disable(gl.BLEND);

    //swap background with screen
    const temp = textures.backgroundTexture;
    textures.backgroundTexture = textures.screenTexture;
    textures.screenTexture = temp;
  }

  /**
   * Updates particle positions using the update fragment shader.
   * Swaps particle textures (ping-pong).
   * @private
   */
  function updateParticles() {
    if (!framebuffer || !updateProgramInfo) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      particleTextures.particleTexture1,
      0,
    );

    gl.viewport(0, 0, particleRes, particleRes);
    //vectorVsQuad, vectorFsUpdate is used here
    gl.useProgram(updateProgramInfo.program);

    const arrays = {
      a_pos: {
        numComponents: 2,
        data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      },
    };

    const uniforms = {
      u_vector: dataTextures.u_image,
      u_particles: particleTextures.particleTexture0,
      u_vector_min: [range[0][0], range[1][0]],
      u_vector_max: [range[0][1], range[1][1]],
      u_rand_seed: Math.random(),
      u_vector_res: [data.width, data.height],
      u_speed_factor: config.speedFactor,
      u_drop_rate: config.dropRate,
      u_drop_rate_bump: config.dropRateBump,
      u_bounds: mapBounds,
      u_data_bounds: bounds,
    };

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    twgl.setBuffersAndAttributes(gl, updateProgramInfo, bufferInfo);

    twgl.setUniforms(updateProgramInfo, uniforms);

    twgl.drawBufferInfo(gl, bufferInfo);

    const temp = particleTextures.particleTexture0;
    particleTextures.particleTexture0 = particleTextures.particleTexture1;
    particleTextures.particleTexture1 = temp;
  }

  function draw() {
    if (state !== 'ANIMATING') return;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);

    drawScreen();
    updateParticles();
  }

  /**
   * Draw loop tick: called every frame via requestAnimationFrame.
   * @private
   */
  function frame() {
    map.triggerRepaint();
    animationId = requestAnimationFrame(frame);
  }

  /**
   * Begins the animation loop and starts particle movement.
   */
  function startAnimation() {
    state = 'ANIMATING';
    setBounds(map.getBounds());
    frame();
  }

  /**
   * Stops the animation loop and clears render targets.
   */
  function stopAnimation() {
    state = 'PAUSED';
    clear();
    cancelAnimationFrame(animationId);
  }

  /**
   * Updates the canvas-sized textures when the map is resized.
   */
  function resize() {
    gl.deleteTexture(textures.backgroundTexture);
    gl.deleteTexture(textures.screenTexture);

    const emptyPixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);

    textures = twgl.createTextures(gl, {
      backgroundTexture: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: gl.canvas.width,
        height: gl.canvas.height,
        format: gl.RGBA,
        src: emptyPixels,
        wrap: gl.CLAMP_TO_EDGE,
      },
      screenTexture: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: gl.canvas.width,
        height: gl.canvas.height,
        format: gl.RGBA,
        src: emptyPixels,
        wrap: gl.CLAMP_TO_EDGE,
      },
    });
  }

  /**
   * Clears all textures and resets particles.
   */
  function clear() {
    // Add check to ensure textures are initialized
    if (!textures || !framebuffer) {
      return; // Skip clearing if not initialized
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    //clear framebuffer textures
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      textures.screenTexture,
      0,
    );
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      textures.backgroundTexture,
      0,
    );
    gl.clear(gl.COLOR_BUFFER_BIT);

    //generate new random particle positions
    setParticles(nParticles);

    //target normal canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  return {
    setData,
    startAnimation,
    stopAnimation,
    draw,
    resize,
    updateConfig,
  };
}

/**
 *
 * @param {Record<string, string>} colors an object with normalized(0-1) speed values as keys and color values as values.
 * @returns  a 1D color gradient texture based on the colors, where each of the 256 pixels represents a color along the gradient.
 * This is then uploaded as a texture to the GPU so shaders can sample colors based on speed.
 */
function getColorRamp(colors) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 256;
  canvas.height = 1;

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  for (const stop in colors) {
    gradient.addColorStop(+stop, colors[stop]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);
  return new Uint8Array(ctx.getImageData(0, 0, 256, 1).data);
}

export default VectorField;
