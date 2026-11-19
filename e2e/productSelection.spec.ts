import { test } from './fixtures';
import {
  GSLA_ANOMALY_LAYER_ID,
  GSLA_PARTICLE_LAYER_ID,
  ONLY_WAVE_BUOYS_URL,
  WAVE_BUOYS_LAYER_ID,
} from './utils/constants';
import { mapComponent } from './utils/mapComponent';
import { sidebarComponent } from './utils/sidebarComponent';

test.describe('Product selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ONLY_WAVE_BUOYS_URL);
  });

  test('User can deselect all the products', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, GSLA_PARTICLE_LAYER_ID);
    await mapComponent.waitUntilLayerLoaded(page, GSLA_ANOMALY_LAYER_ID);
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);

    // The URL baseline has only Wave Buoys on, so opt the other two in first.
    await sidebarComponent.selectProduct(page, 'GSLA Ocean geostrophic current product');
    await sidebarComponent.selectProduct(page, 'GSLA sea level anomaly product');

    await sidebarComponent.deselectProduct(page, 'GSLA Ocean geostrophic current product');
    await sidebarComponent.deselectProduct(page, 'GSLA sea level anomaly product');
    await sidebarComponent.deselectProduct(page, 'Wave buoys product');

    await mapComponent.waitUntilLayerNotLoaded(page, GSLA_PARTICLE_LAYER_ID);
    await mapComponent.waitUntilLayerNotLoaded(page, GSLA_ANOMALY_LAYER_ID);
    await mapComponent.waitUntilLayerNotLoaded(page, WAVE_BUOYS_LAYER_ID);
  });
});
