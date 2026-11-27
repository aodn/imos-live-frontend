import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { ISOBATH_LABEL_LAYER_ID, ISOBATH_LINE_LAYER_ID } from '@/constants';
import { NO_PRODUCTS_URL } from './utils/constants';
import { mapComponent } from './utils/mapComponent';

// Label placement depends on live Mapbox tiles, so it's unit-tested in
// src/hooks/layers/useIsobathLayer.spec.ts; here we cover the switch wiring.
const ISOBATH_LAYERS = [ISOBATH_LINE_LAYER_ID, ISOBATH_LABEL_LAYER_ID];

async function toggleIsobaths(page: Page) {
  await page.getByRole('menuitem', { name: 'Options' }).click();
  await page.getByTestId('switch-isobathsEnabled').click();
}

async function expectIsobathsVisible(page: Page) {
  for (const id of ISOBATH_LAYERS) await mapComponent.waitUntilLayerVisible(page, id);
}

async function expectIsobathsHidden(page: Page) {
  for (const id of ISOBATH_LAYERS) await mapComponent.waitUntilLayerNotLoaded(page, id);
}

test.describe('Isobaths', () => {
  test('are off by default and toggled by the Isobaths switch', async ({ page }) => {
    await page.goto(NO_PRODUCTS_URL);
    for (const id of ISOBATH_LAYERS) await mapComponent.waitUntilLayerLoaded(page, id);
    await expectIsobathsHidden(page);
    await expect(page).not.toHaveURL(/isobathsEnabled=/);

    await toggleIsobaths(page);
    await expect(page.getByTestId('switch-isobathsEnabled')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expectIsobathsVisible(page);
    await expect(page).toHaveURL(/isobathsEnabled=1/);

    await page.getByTestId('switch-isobathsEnabled').click();
    await expectIsobathsHidden(page);
    await expect(page).not.toHaveURL(/isobathsEnabled=/);
  });

  test('are restored from the URL', async ({ page }) => {
    await page.goto(`${NO_PRODUCTS_URL}&isobathsEnabled=1`);
    await expectIsobathsVisible(page);

    await page.getByRole('menuitem', { name: 'Options' }).click();
    await expect(page.getByTestId('switch-isobathsEnabled')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('stay visible after a map style change', async ({ page }) => {
    await page.goto(`${NO_PRODUCTS_URL}&isobathsEnabled=1`);
    await expectIsobathsVisible(page);

    await page.getByRole('menuitem', { name: 'Maps' }).click();
    await page.getByRole('button', { name: 'Streets' }).click();
    await page.getByRole('button', { name: 'Dark' }).click();

    await mapComponent.waitUntilIdle(page);
    await expectIsobathsVisible(page);
  });
});
