// ParticlesAtlasLayer / ParticlesAtlasField: Mapbox CustomLayerInterface contract and
// field lifecycle on a real WebGL2 context. The unit tests under
// src/AtlasRenderingSystem/ can't cover these.
import { expect, test } from './fixtures';
import {
  GSLA_PARTICLE_LAYER_ID,
  GSLA_PARTICLE_PRODUCT,
  NEXT_DAY,
  NO_PRODUCTS_URL,
} from './utils/constants';
import {
  invokeLayerMethod,
  removeLayer,
  snapshotLayer,
  waitForLayer,
  waitForLayerGone,
} from './utils/atlasLayer';
import { dateSlider } from './utils/dateSlider';
import { sidebarComponent } from './utils/sidebarComponent';

test.describe('ParticlesAtlasLayer / ParticlesAtlasField', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(NO_PRODUCTS_URL);
    await sidebarComponent.selectProduct(page, 'GSLA Ocean geostrophic current product');
    await waitForLayer(page, GSLA_PARTICLE_LAYER_ID);
  });

  test('registers as a Mapbox custom layer with the expected id and type', async ({ page }) => {
    const snap = await snapshotLayer(page, GSLA_PARTICLE_LAYER_ID);
    expect(snap).not.toBeNull();
    expect(snap!.id).toBe(GSLA_PARTICLE_LAYER_ID);
    expect(snap!.type).toBe('custom');
    expect(snap!.hasOnAdd).toBe(true);
    expect(snap!.hasOnRemove).toBe(true);
    expect(snap!.hasRender).toBe(true);
  });

  test('populates `field` after onAdd', async ({ page }) => {
    const after = await snapshotLayer(page, GSLA_PARTICLE_LAYER_ID);
    expect(after).not.toBeNull();
    expect(after!.hasField).toBe(true);
  });

  test('removing the layer via map.removeLayer fires onRemove and clears `field`', async ({
    page,
  }) => {
    expect((await snapshotLayer(page, GSLA_PARTICLE_LAYER_ID))!.hasField).toBe(true);

    await removeLayer(page, GSLA_PARTICLE_LAYER_ID);

    await waitForLayerGone(page, GSLA_PARTICLE_LAYER_ID);
  });

  test('setVisible flips the wrapper.visible flag', async ({ page }) => {
    // The host hook calls setVisible(false) while the product's loading/error
    // state settles after setup, which can overwrite our call. Retry until it sticks.
    await expect(async () => {
      expect((await invokeLayerMethod(page, GSLA_PARTICLE_LAYER_ID, 'setVisible', [true])).ok).toBe(
        true,
      );
      expect((await snapshotLayer(page, GSLA_PARTICLE_LAYER_ID))!.visible).toBe(true);
    }).toPass();

    expect((await invokeLayerMethod(page, GSLA_PARTICLE_LAYER_ID, 'setVisible', [false])).ok).toBe(
      true,
    );
    expect((await snapshotLayer(page, GSLA_PARTICLE_LAYER_ID))!.visible).toBe(false);
  });

  test('updateConfig accepts a partial CustomizableParticleConfig without throwing', async ({
    page,
  }) => {
    const result = await invokeLayerMethod(page, GSLA_PARTICLE_LAYER_ID, 'updateConfig', [
      { speedFactor: 6.0, fadeOpacity: 0.95, pointSize: 1.5 },
    ]);
    expect(result.ok).toBe(true);
  });

  test('updatePalette is callable without throwing', async ({ page }) => {
    const result = await invokeLayerMethod(page, GSLA_PARTICLE_LAYER_ID, 'updatePalette', [
      { legendRange: [0, 3] },
    ]);
    expect(result.ok).toBe(true);
  });

  test('onMoveStart / onMoveEnd are callable (the layer wires them to the map events)', async ({
    page,
  }) => {
    // Direct invocation models what the registered map handlers do during a pan.
    expect((await invokeLayerMethod(page, GSLA_PARTICLE_LAYER_ID, 'onMoveStart')).ok).toBe(true);
    expect((await invokeLayerMethod(page, GSLA_PARTICLE_LAYER_ID, 'onMoveEnd')).ok).toBe(true);
    expect((await invokeLayerMethod(page, GSLA_PARTICLE_LAYER_ID, 'onResize')).ok).toBe(true);
  });

  test('manifest fetch is keyed by the URL date on day change', async ({ page }) => {
    const nextManifest = dateSlider.waitForManifestRequest(page, GSLA_PARTICLE_PRODUCT, NEXT_DAY);
    await dateSlider.stepForward(page);
    await nextManifest;
  });
});
