/**
 * Atlas upload diagnostics (dev / opt-in only).
 *
 * Purpose: pin down the intermittent "speckle" corruption seen on some scalar
 * tiles. The tiles decode to smooth data on the server, so the corruption is
 * introduced client-side — either (a) the upload writes wrong/scrambled bytes
 * into the atlas slot, or (b) the slot is correct and the draw/sampling is at
 * fault.
 *
 * When enabled, `verifyUpload` reads each slot back from the texture right after
 * `texSubImage2D` and measures how smooth the high byte (R = the scalar value's
 * MSB) is across the slot. A correct tile is smooth (mean horizontal |ΔR| of a
 * few units); the speckle corruption scrambles R (mean |ΔR| in the tens). This
 * is reference-free, so it can't be fooled by canvas colour-management.
 *
 *   - readback NOISY  → the texture itself is scrambled ⇒ the bug is in the
 *                       UPLOAD path; the logged GL state (inherited pixel-store
 *                       flags, bound framebuffer, GL error) names the cause.
 *   - readback SMOOTH → the upload is fine ⇒ corruption is downstream in the
 *                       shader/sampling, not here.
 *
 * Enable by setting `VITE_ATLAS_DIAG=true` in `.env` (or `.env.local`) and
 * restarting the dev server; unset/remove it to disable.
 *
 * Zero cost when disabled (a single cached boolean check). The readback path is
 * deliberately heavy (a GPU sync) — it's a diagnostic, not production code.
 */

/** True when `VITE_ATLAS_DIAG=true` is set in the environment. `import.meta.env`
 *  is only populated under Vite — guard it so non-Vite runners (e.g. Playwright,
 *  plain node) that import this module don't throw on the missing object. */
const ATLAS_DIAG_ENABLED = import.meta.env?.VITE_ATLAS_DIAG === 'true';

if (ATLAS_DIAG_ENABLED) {
  console.info(
    '[atlasDiag] enabled — every atlas slot upload will be read back and checked for scrambled (noisy) data.',
  );
}

export function isAtlasDiagEnabled(): boolean {
  return ATLAS_DIAG_ENABLED;
}

// Reused so we don't churn a framebuffer per upload.
let scratchFb: WebGLFramebuffer | null = null;

type SlotGeom = {
  texture: WebGLTexture;
  /** physical slot top-left in atlas pixels */
  x: number;
  y: number;
  slotW: number;
  slotH: number;
};

/** mean |ΔR| above this ⇒ the slot's high byte is scrambled (speckle). Correct
 *  tiles measured 1.8–8.2 in practice; scrambled R averages ~85. */
const NOISE_THRESHOLD = 20;

/**
 * Read the just-uploaded slot back from the texture and report whether its data
 * is smooth (correct) or scrambled (corrupt upload). Logs the inherited GL state
 * on corruption so the cause can be identified.
 */
export function verifyUpload(gl: WebGL2RenderingContext, chunkId: string, geom: SlotGeom): void {
  const { texture, x, y, slotW, slotH } = geom;

  const prevFb = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
  const glErrBefore = gl.getError();
  if (!scratchFb) scratchFb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, scratchFb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  const gpu = new Uint8Array(slotW * slotH * 4);
  if (fbStatus === gl.FRAMEBUFFER_COMPLETE) {
    gl.readPixels(x, y, slotW, slotH, gl.RGBA, gl.UNSIGNED_BYTE, gpu);
  }
  const glErrRead = gl.getError();

  // Snapshot the inherited pixel-store / target state at this exact moment — the
  // upload ran under whatever state Mapbox (or another consumer) last left set.
  const state = {
    flipY: gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL),
    premultiply: gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL),
    colorspace: gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL),
    unpackAlignment: gl.getParameter(gl.UNPACK_ALIGNMENT),
    unpackRowLength: gl.getParameter(gl.UNPACK_ROW_LENGTH),
    unpackSkipPixels: gl.getParameter(gl.UNPACK_SKIP_PIXELS),
    unpackSkipRows: gl.getParameter(gl.UNPACK_SKIP_ROWS),
    fbWasBound: prevFb !== null,
  };

  // Restore the framebuffer binding so we don't disturb Mapbox's next frame.
  gl.bindFramebuffer(gl.FRAMEBUFFER, prevFb);

  if (fbStatus !== gl.FRAMEBUFFER_COMPLETE) {
    console.warn(`[atlasDiag] ${chunkId}: framebuffer incomplete (0x${fbStatus.toString(16)})`);
    return;
  }

  // Reference-free smoothness: mean |ΔR| between horizontally adjacent data
  // pixels. readPixels rows are bottom-up but smoothness is row-local, so the
  // Y orientation doesn't matter here.
  let pairs = 0;
  let sumAbsDeltaR = 0;
  for (let r = 0; r < slotH; r++) {
    const row = r * slotW * 4;
    for (let c = 0; c + 1 < slotW; c++) {
      if (gpu[row + c * 4 + 3] < 128 || gpu[row + (c + 1) * 4 + 3] < 128) continue; // nodata/land
      sumAbsDeltaR += Math.abs(gpu[row + c * 4] - gpu[row + (c + 1) * 4]);
      pairs++;
    }
  }
  const meanDeltaR = pairs ? sumAbsDeltaR / pairs : 0;

  if (meanDeltaR > NOISE_THRESHOLD) {
    console.warn(
      `[atlasDiag] CORRUPT SLOT ${chunkId}: readback R is SCRAMBLED (mean|ΔR|=${meanDeltaR.toFixed(1)}, ` +
        `n=${pairs}). The texture itself is wrong → bug is in the UPLOAD path. Inherited GL state:`,
      { glErrBefore, glErrRead, ...state },
    );
  } else {
    console.info(
      `[atlasDiag] ${chunkId}: slot OK (mean|ΔR|=${meanDeltaR.toFixed(1)}, n=${pairs}).`,
    );
  }
}
