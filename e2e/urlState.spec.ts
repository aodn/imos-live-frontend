import { expect, test } from './fixtures';
import {
  DEEP_LINK_DAY,
  GSLA_ANOMALY_LAYER_ID,
  GSLA_ANOMALY_PRODUCT,
  productEnabledURL,
} from './utils/constants';
import { mapComponent } from './utils/mapComponent';

// The store is persisted via `partialize` + a URL-backed storage adapter
// (see src/store/useMapUIStore.ts → hashStorage). Deep links are the only way
// users share map views, so they get their own regression tests.
test.describe('URL state restore', () => {
  test('restores `date` from the URL on load', async ({ page }) => {
    await page.goto(`/?date=${DEEP_LINK_DAY}`);

    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });

    // `date` is stored verbatim and always kept in the URL (see urlSync.ts).
    await expect(page).toHaveURL(new RegExp(`date=${DEEP_LINK_DAY}`));
  });

  test('restores `productEnabled` from the URL on load (only sea-level anomaly enabled)', async ({
    page,
  }) => {
    await page.goto(productEnabledURL([GSLA_ANOMALY_PRODUCT]));

    await mapComponent.waitUntilLayerLoaded(page, GSLA_ANOMALY_LAYER_ID);

    // Add/Remove buttons swap based on `productEnabled`, so this checks the
    // store hydrated from the URL.
    await expect(
      page
        .getByLabel('GSLA sea level anomaly product')
        .getByRole('button', { name: 'Remove from map' }),
    ).toBeVisible();
    await expect(
      page
        .getByLabel('GSLA Ocean geostrophic current product')
        .getByRole('button', { name: 'Add to map' }),
    ).toBeVisible();
    await expect(
      page.getByLabel('Wave buoys product').getByRole('button', { name: 'Add to map' }),
    ).toBeVisible();
  });
});
