import { test } from './fixtures';
import { GSLA_ANOMALY_LAYER_ID, ONLY_WAVE_BUOYS_URL } from './utils/constants';
import { dateSlider } from './utils/dateSlider';
import { mapComponent } from './utils/mapComponent';
import { sidebarComponent } from './utils/sidebarComponent';

test.describe('Anomaly sea levels and Ocean Current', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ONLY_WAVE_BUOYS_URL);
    await sidebarComponent.selectProduct(page, 'GSLA Ocean geostrophic current product');
    await sidebarComponent.selectProduct(page, 'GSLA sea level anomaly product');
    await sidebarComponent.deselectProduct(page, 'Wave buoys product');
  });

  test('User can see the current value from a map particle of different days', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, GSLA_ANOMALY_LAYER_ID);
    await mapComponent.expectPopupToHaveContent(page, {
      gsla: '3.00',
      speed: '1.00',
      direction: 'E',
      degree: '0',
    });

    await dateSlider.stepForward(page);
    await mapComponent.waitUntilIdle(page);

    await mapComponent.expectPopupToHaveContent(page, {
      gsla: '4.00',
      speed: '2.00',
      direction: 'E',
      degree: '0',
    });
  });
});
