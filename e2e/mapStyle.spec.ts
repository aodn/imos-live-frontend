import { test } from './fixtures';
import { ONLY_WAVE_BUOYS_URL, WAVE_BUOYS_LAYER_ID } from './utils/constants';
import { mapComponent } from './utils/mapComponent';

// `setStyle` reloads the whole Mapbox style, so every layer hook must re-register
// its layers on `style.load`. This is a common regression spot, so one E2E guards it.
test.describe('Style switching', () => {
  test('Wave buoys layer survives a map style change', async ({ page }) => {
    await page.goto(ONLY_WAVE_BUOYS_URL);
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);

    await page.getByRole('menuitem', { name: 'Maps' }).click();
    // The trigger shows the current style as its accessible name ("Streets" by default).
    await page.getByRole('button', { name: 'Streets' }).click();
    await page.getByRole('button', { name: 'Dark' }).click();

    await mapComponent.waitUntilIdle(page);
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);
  });
});
