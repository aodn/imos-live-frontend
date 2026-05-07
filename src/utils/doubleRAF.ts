/** Waits for two animation frames, giving React time to flush pending state updates to the DOM. */
export const doubleRAF = (): Promise<void> =>
  new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
