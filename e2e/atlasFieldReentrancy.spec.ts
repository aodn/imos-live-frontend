import { expect, test } from './fixtures';
import { GSLA_ANOMALY_LAYER_ID, GSLA_PARTICLE_LAYER_ID, NO_PRODUCTS_URL } from './utils/constants';
import { snapshotLayer, waitForLayer } from './utils/atlasLayer';
import { dateSlider } from './utils/dateSlider';
import { sidebarComponent } from './utils/sidebarComponent';

// Two rapid forward steps: the second setSource supersedes the first, so the
// layer should still be registered and the field still present at the end.
test.describe('Field re-entrancy under rapid date changes (fetchGeneration guard)', () => {
  test('Heatmap layer survives sequential day changes without leaking the wrapper', async ({
    page,
  }) => {
    await page.goto(NO_PRODUCTS_URL);
    await sidebarComponent.selectProduct(page, 'GSLA sea level anomaly product');
    await waitForLayer(page, GSLA_ANOMALY_LAYER_ID);

    await dateSlider.stepForward(page, 2);

    await expect.poll(() => snapshotLayer(page, GSLA_ANOMALY_LAYER_ID)).not.toBeNull();
    const snap = await snapshotLayer(page, GSLA_ANOMALY_LAYER_ID);
    expect(snap!.hasField).toBe(true);
  });

  test('Particle layer survives sequential day changes without leaking the wrapper', async ({
    page,
  }) => {
    await page.goto(NO_PRODUCTS_URL);
    await sidebarComponent.selectProduct(page, 'GSLA Ocean geostrophic current product');
    await waitForLayer(page, GSLA_PARTICLE_LAYER_ID);

    await dateSlider.stepForward(page, 2);

    await expect.poll(() => snapshotLayer(page, GSLA_PARTICLE_LAYER_ID)).not.toBeNull();
    const snap = await snapshotLayer(page, GSLA_PARTICLE_LAYER_ID);
    expect(snap!.hasField).toBe(true);
  });
});
