/**
 * LODController
 *
 * Animates the LOD crossfade blend value (u_lod_blend) from its current
 * value toward 1.0 over BLEND_DURATION ms using an ease-out quadratic curve.
 *
 * Designed to be driven by the existing particle draw loop — getValue() is
 * called each frame instead of running a separate requestAnimationFrame loop.
 *
 * Usage:
 *   const lod = createLODController();
 *   lod.startBlendIn();          // begin animating toward 1.0
 *   lod.reset();                 // snap to 0.0 and cancel animation
 *   u_lod_blend = lod.getValue() // read current value in draw loop
 */

const BLEND_DURATION = 300; // ms

export type LODControllerAPI = {
  /** Begin animating blend value from current position toward 1.0. */
  startBlendIn: () => void;
  /** Snap blend value to 0 and cancel any in-progress animation. */
  reset: () => void;
  /** Return current blend value; advances animation if in progress. */
  getValue: () => number;
  /** Release resources when the controller is no longer needed. */
  destroy: () => void;
};

export function createLODController(): LODControllerAPI {
  let currentValue = 0;
  let startValue = 0;
  let startTime: number | null = null;
  let animating = false;

  function startBlendIn() {
    if (currentValue >= 1.0) return;
    startTime = performance.now();
    startValue = currentValue;
    animating = true;
  }

  function reset() {
    animating = false;
    startTime = null;
    currentValue = 0;
    startValue = 0;
  }

  function getValue(): number {
    if (!animating || startTime === null) return currentValue;

    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / BLEND_DURATION, 1.0);
    // Ease-out quadratic: fast start, decelerates near target
    const eased = t * (2 - t);
    currentValue = startValue + (1.0 - startValue) * eased;

    if (t >= 1.0) {
      animating = false;
      currentValue = 1.0;
    }

    return currentValue;
  }

  function destroy() {
    reset();
  }

  return { startBlendIn, reset, getValue, destroy };
}
