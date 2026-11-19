import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

// Waits until the element stops moving (e.g. after auto-scroll).
export async function waitForStable(locator: Locator) {
  let previous = '';
  await expect
    .poll(async () => {
      const current = JSON.stringify(await locator.boundingBox());
      const stable = current === previous;
      previous = current;
      return stable;
    })
    .toBe(true);
}
