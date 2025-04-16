import mapboxgl from "mapbox-gl";
import * as twgl from "twgl.js";
import { vs, fs, vsQuad, fsScreen, fsUpdate } from "./shader.js";
import config from "./vectorConfig.ts";

/**
 * 
Shaders (Vertex and Fragment) run efficiently on the GPU to handle thousands of particles simultaneously. This is ideal for real-time simulations of particle movements.

Your code uses two key shaders for this purpose:

Update Shader (fsUpdate): Calculates updated particle positions based on velocity (direction/strength).

Render Shader (fs): Renders particles visually. 
 */

/*
Particles are things that move around in a space, like little dots or points, each with their own position and speed. 
Vectors are data, one per pixel, stored in png images that tell us how fast and in what direction the particles should move.


Analogy: Wind Map
Imagine you have:

A weather map that shows wind direction everywhere (PNG = vector field)

A bunch of leaves floating in the air (particles)

You don’t have a leaf for every pixel. But:

Each leaf moves by looking at the wind direction at its current position.

Same thing here:

The PNG is the wind map

The particles are the leaves

The shader is what says “move this leaf based on the wind underneath it”

Sample
Looking up the vector from the PNG field at the particle’s current position.
After fonding the vector, the shader moves the particle in that direction. Then it moves the particle at its new position. Then it repeats.

Say you have a particle at (0.5, 0.5) and the vector field says that at (0.5, 0.5) the wind velocity is (0.01,0.02) and speedFactor is 5.0.
Then the particle will move to (0.5 + 0.01 * 5.0, 0.5 + 0.02 * 5.0) = (0.55, 0.6).

Velocity has speed and direction. The speed is the length of the vector, and the direction is the angle of the vector.

This is how the animation of particles works.


speedFactor: determines how fast the particles move based on the vector field. A higher value means faster movement.
dropRate: determines how often particles are removed and respawned in a new position. A higher value means more frequent respawning.
dropRateBump: increases the drop rate for particles moving faster, preventing them from dominating the visual field.
*/

function VectorField(map, gl) {
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
  let state = "PAUSED";
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
   * Set the number of particles generated.
   * @param {number} num - Desired number of particles.
   */
  function setParticleNum(num) {
    nParticles = num;
    setParticles(nParticles);
  }

  /**
   * This defines a 2D texture grid (width × height) big enough to hold all particles. Each "pixel" in this texture is one particle.
   * populate a texture where each particle has a random (x, y) position encoded in RG (red/green) channels, so it generate partiles and
   * spread out randomly.
   * @private
   * @param {number} num - Number of particles.
   */
  function setParticles(num) {
    particleRes = Math.ceil(Math.sqrt(num));
    numParticles = particleRes * particleRes;

    //creata a Uint8Array of size numParticles * 4 (RGBA) to store particle positions
    //each particle will be represented by 4 bytes (R, G, B, A)
    /**
     * Channel	Possible Meaning	Example
        R	Velocity X 	0–255 mapped to -1–1d
        G	Velocity Y  0–255 mapped to -1–1
     */
    const particleState = new Uint8Array(numParticles * 4);

    //put random values in the particleState array
    //each value is between 0 and 255 (inclusive) for RGBA
    //the reason that set random values is to create a random distribution of particles
    //across the screen, so that they are not all in one place
    for (let i = 0; i < particleState.length; i++) {
      particleState[i] = Math.floor(Math.random() * 256);
    }

    //create two textures for the particles
    //known as ping-ponging or FBO-based simulation
    particleTextures = twgl.createTextures(gl, {
      particleTexture0: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: particleRes,
        height: particleRes,
        format: gl.RGBA,
        src: particleState,
        wrap: gl.CLAMP_TO_EDGE,
      },
      particleTexture1: {
        mag: gl.NEAREST,
        min: gl.NEAREST,
        width: particleRes,
        height: particleRes,
        format: gl.RGBA,
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
   * Sets a new color ramp texture for particles.
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
    programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    //Render final frame to screen
    screenProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsScreen]);
    //Update particle positions
    updateProgramInfo = twgl.createProgramInfo(gl, [vsQuad, fsUpdate]);

    //initial setting of particle positions
    setParticles(nParticles);

    //initial setting of particle colors
    setColorRamp(config.colours);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = data.width;
    canvas.height = data.height;

    context.drawImage(data, 0, 0);
    //get image pixels from canvas
    //getImageData returns an ImageData object that contains the pixel data for the specified rectangle of the canvas.
    const myData = context.getImageData(0, 0, data.width, data.height);
    const emptyPixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);

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
    };

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
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
    if (state != "ANIMATING") return;

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
    state = "ANIMATING";
    setBounds(map.getBounds());
    frame();
  }

  /**
   * Stops the animation loop and clears render targets.
   */
  function stopAnimation() {
    state = "PAUSED";
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
    setParticleNum,
    resize,
  };
}

/**
 *
 * @param {Record<string, string>} colors an object with normalized(0-1) speed values as keys and color values as values.
 * @returns  a 1D color gradient texture based on the colors, where each of the 256 pixels represents a color along the gradient.
 * This is then uploaded as a texture to the GPU so shaders can sample colors based on speed.
 */
function getColorRamp(colors) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

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
