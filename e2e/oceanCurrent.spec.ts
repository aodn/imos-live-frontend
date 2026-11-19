import { test } from './fixtures';
import {
  GSLA_PARTICLE_LAYER_ID,
  GSLA_PARTICLE_PRODUCT,
  NEXT_DAY,
  ONLY_WAVE_BUOYS_URL,
} from './utils/constants';
import { dateSlider } from './utils/dateSlider';
import { mapComponent } from './utils/mapComponent';
import { sidebarComponent } from './utils/sidebarComponent';

test.describe('Ocean Current', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ONLY_WAVE_BUOYS_URL);
    // The URL baseline has only Wave Buoys on; switch over to Ocean Current.
    await sidebarComponent.selectProduct(page, 'GSLA Ocean geostrophic current product');
    await sidebarComponent.deselectProduct(page, 'Wave buoys product');
    await mapComponent.waitUntilLayerLoaded(page, GSLA_PARTICLE_LAYER_ID);
  });

  test('User can see particle patterns of different days', async ({ page }) => {
    // The particle layer is a Mapbox CustomLayerInterface (no source), so the
    // date change is verified via the manifest request the layer hook fires.
    const nextDateManifest = dateSlider.waitForManifestRequest(
      page,
      GSLA_PARTICLE_PRODUCT,
      NEXT_DAY,
    );
    await dateSlider.stepForward(page);
    await nextDateManifest;
  });

  test('User can see the current value from a map particle of different days', async ({ page }) => {
    await mapComponent.expectPopupToHaveContent(page, {
      speed: '1.00',
      direction: 'E',
      degree: '0',
    });

    await dateSlider.stepForward(page);
    await mapComponent.waitUntilIdle(page);

    await mapComponent.expectPopupToHaveContent(page, {
      speed: '2.00',
      direction: 'E',
      degree: '0',
    });
  });
});
