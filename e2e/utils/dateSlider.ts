import { extractProductVariables } from '@/constants';
import type { Page } from '@playwright/test';
import { waitForStable } from './waitForStable';

export const dateSlider = {
  // Steps the date forward one day per press, after the slider's auto-scroll settles.
  stepForward: async (page: Page, times = 1) => {
    const handle = page.getByRole('slider', { name: 'point handle' });
    await handle.waitFor({ state: 'visible' });
    await waitForStable(handle);
    await handle.focus();
    for (let i = 0; i < times; i++) await page.keyboard.press('ArrowRight');
  },
  // Resolves when the app requests the tiles manifest for `product` on `date`.
  // Start waiting before stepping the slider.
  waitForManifestRequest: (page: Page, product: string, date: string) => {
    const { dataset, variable } = extractProductVariables(
      product as Parameters<typeof extractProductVariables>[0],
    );
    return page.waitForRequest(req => {
      const url = new URL(req.url());
      return (
        url.pathname.endsWith('/data_tiles/manifest') &&
        url.searchParams.get('dataset') === dataset &&
        url.searchParams.get('variable') === variable &&
        url.searchParams.get('datetime') === date
      );
    });
  },
};
