/**
 * AtlasRenderingSystem — Playwright integration tests
 *
 * Pins down the Mapbox CustomLayerInterface contract and field-lifecycle
 * behaviours of HeatmapAtlasLayer, HeatmapAtlasField, ParticlesAtlasLayer and
 * ParticlesAtlasField. These exercise a real WebGL2 context (Chromium) and the
 * real Mapbox custom-layer wiring — pieces that are intentionally out of scope
 * for the unit tests under src/AtlasRenderingSystem/.
 *
 * Layer registration / popup data flow / style-switch survival are already
 * covered by happyPath.spec.ts, so this file deliberately avoids duplicating
 * that surface and focuses on the lower-level invariants:
 *
 *   - layer.id / layer.type / layer.visible
 *   - layer.field is populated after onAdd, cleared after onRemove
 *   - layer.setVisible toggles the flag and propagates to the field
 *   - layer.updatePalette / layer.updateConfig are callable safely
 *   - date change triggers a manifest fetch keyed by the new date
 *   - rapid date changes resolve cleanly (fetchGeneration guard)
 */
// Import directly from '@/api/tiles' rather than the '@/api' barrel — the
// barrel re-exports './site', which pulls in '@/helpers' -> 'mapImageExport.ts'
// -> '@/components' (the whole component tree, incl. Highcharts/CSS modules).
// Playwright's Node-side spec transform can't handle those non-JS assets.
import { extractProductVariables } from '@/api/tiles';
import { PRODUCT, PRODUCTS } from '@/constants';
import { serialize } from '@/store/serialization';
import type { Page, Route } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { Map } from 'mapbox-gl';

const GSLA_PARTICLE_PRODUCT = PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT;
const GSLA_ANOMALY_PRODUCT = PRODUCT.GSLA_ANOMALY_SEA_LEVELS;
const GSLA_PARTICLE_LAYER_ID = PRODUCTS[GSLA_PARTICLE_PRODUCT].layerId;
const GSLA_ANOMALY_LAYER_ID = PRODUCTS[GSLA_ANOMALY_PRODUCT].layerId;

const currentDate = new Date('2025-08-01T00:00:00.000Z');
const defaultDaySelected = '2025-07-01';
const nextDaySelected = '2025-07-02';

// Pin an all-disabled product baseline via the URL so these tests are
// independent of INITIAL_PRODUCT_ENABLED (which enables several products by
// default). Each test then enables exactly the one product it exercises via the
// sidebar, which assumes that product starts hidden.
const NO_PRODUCTS_ENABLED = serialize(
  {
    [GSLA_PARTICLE_PRODUCT]: false,
    [GSLA_ANOMALY_PRODUCT]: false,
    [PRODUCT.WAVE_BUOYS]: false,
    [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: false,
    [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: false,
    [PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY]: false,
  },
  'productEnabled',
);
const defaultDayURL = `/?date=${defaultDaySelected}&productEnabled=${NO_PRODUCTS_ENABLED}`;

// Single-LOD manifests — sufficient for layer-contract assertions.
const PARTICLE_MANIFEST = {
  bounds: { lonMin: 109.9, lonMax: 170.1, latMin: -50.1, latMax: 0.1 },
  uRange: [-1, 1],
  vRange: [-1, 1],
  lods: {
    '1': { grid: [1, 1], storedPx: [256, 256], chunkPx: [256, 256], padding: 0 },
  },
};

const SCALAR_MANIFEST = {
  bounds: { lonMin: 109.9, lonMax: 170.1, latMin: -50.1, latMax: 0.1 },
  valueRange: [-1.2, 1.2],
  lods: {
    '1': { grid: [1, 1], storedPx: [256, 256], chunkPx: [256, 256], padding: 0 },
  },
};

// Top-level metadata manifest (`/products`). Layer hooks gate their first tile
// load on this resolving (via `manifestLoaded`) and validate the selected date
// against `available_dates`, so the products under test must list the dates
// these tests exercise (default day and the +1 day).
const AVAILABLE_DATES = [defaultDaySelected, nextDaySelected];
const METADATA_MANIFEST = {
  products: (
    [
      GSLA_PARTICLE_PRODUCT,
      GSLA_ANOMALY_PRODUCT,
      PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
      PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC,
      PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY,
    ] as const
  ).map(id => ({
    id,
    available_dates: AVAILABLE_DATES,
    full_date_range: { start: AVAILABLE_DATES[0], end: AVAILABLE_DATES.at(-1)! },
  })),
};

type LayerSnapshot = {
  id: string;
  type: string;
  visible: boolean;
  hasField: boolean;
  hasRender: boolean;
  hasOnAdd: boolean;
  hasOnRemove: boolean;
};

/** Read the live snapshot of an atlas layer through `window.map`. */
function snapshotLayer(page: Page, layerId: string) {
  return page.evaluate(id => {
    const map = (window as unknown as { map?: Map }).map;
    if (!map) throw new Error('Map not found');
    const layer = map.getLayer(id) as unknown as
      | (Record<string, unknown> & { implementation?: Record<string, unknown> })
      | undefined;
    if (!layer) return null;
    // Mapbox wraps CustomLayerInterface in an internal class that exposes the
    // original object via `.implementation`. Fall back to the layer directly
    // for older / patched versions.
    const target = (layer.implementation ?? layer) as Record<string, unknown> & {
      field?: unknown;
      render?: unknown;
      onAdd?: unknown;
      onRemove?: unknown;
    };
    return {
      id: target['id'] as string,
      type: target['type'] as string,
      visible: target['visible'] as boolean,
      hasField: target.field !== undefined,
      hasRender: typeof target.render === 'function',
      hasOnAdd: typeof target.onAdd === 'function',
      hasOnRemove: typeof target.onRemove === 'function',
    } satisfies LayerSnapshot;
  }, layerId);
}

/** Drive any methods exposed on the wrapped custom layer (setVisible, updatePalette…). */
function invokeLayerMethod(page: Page, layerId: string, method: string, args: unknown[] = []) {
  return page.evaluate(
    ({ id, method, args }) => {
      const map = (window as unknown as { map?: Map }).map;
      if (!map) throw new Error('Map not found');
      const layer = map.getLayer(id) as unknown as
        | (Record<string, unknown> & { implementation?: Record<string, unknown> })
        | undefined;
      if (!layer) throw new Error(`Layer ${id} not found`);
      const target = (layer.implementation ?? layer) as Record<string, unknown>;
      const fn = target[method] as ((...a: unknown[]) => unknown) | undefined;
      if (typeof fn !== 'function') {
        throw new Error(`Method ${method} not found on ${id}`);
      }
      try {
        fn.apply(target, args);
        return { ok: true as const };
      } catch (err) {
        return { ok: false as const, error: (err as Error).message };
      }
    },
    { id: layerId, method, args },
  );
}

async function waitForLayer(page: Page, layerId: string) {
  await expect
    .poll(
      () => page.evaluate(id => !!(window as unknown as { map?: Map }).map?.getLayer(id), layerId),
      {
        timeout: 10_000,
      },
    )
    .toBe(true);
}

async function waitForLayerGone(page: Page, layerId: string) {
  await expect
    .poll(
      () => page.evaluate(id => !!(window as unknown as { map?: Map }).map?.getLayer(id), layerId),
      {
        timeout: 10_000,
      },
    )
    .toBe(false);
}

async function enableProduct(page: Page, productName: string) {
  await page.getByLabel(productName).getByRole('button', { name: 'Add to map' }).click();
  await expect(
    page.getByLabel(productName).getByRole('button', { name: 'Remove from map' }),
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: currentDate });

  // Top-level metadata manifest powering per-product date availability:
  // `/collections/{collectionId}/products`.
  await page.route(/\/collections\/[^/]+\/products(?:$|\?)/, async (route: Route) => {
    await route.fulfill({ json: METADATA_MANIFEST });
  });

  // Per-product-per-date manifest: `/collections/{collectionId}/data_tiles/manifest
  // ?dataset=...&variable=...&datetime=...`. Routed by the `dataset`/`variable`
  // query params rather than a path segment, per the new tile-fetch contract.
  const { variable: particleVariable } = extractProductVariables(GSLA_PARTICLE_PRODUCT);
  await page.route(/\/data_tiles\/manifest(?:\?|$)/, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('variable') === particleVariable) {
      await route.fulfill({ json: PARTICLE_MANIFEST });
    } else {
      await route.fulfill({ json: SCALAR_MANIFEST });
    }
  });

  // Abort tile fetches — the layer enters its alpha-mask-discard state which is
  // fine for layer-contract tests. New shape: `/data_tiles/{lod}/{cx}/{cy}?...`
  // (no extension).
  await page.route(/\/data_tiles\/\d+\/\d+\/\d+(?:\?|$)/, route => route.abort());

  // Keep wave-buoy fetches quiet so they don't interfere — the default URL
  // enables Wave Buoys, so the page would otherwise log errors.
  await page.route(/\/api\/.+\/items\/wave_buoy_first_data_available/, async route => {
    await route.fulfill({
      json: { type: 'FeatureCollection', metadata: {}, features: [] },
    });
  });
  await page.route(/\/api\/.+\/items\/wave_buoy_all(?:\?|$)/, async route => {
    await route.fulfill({
      json: { type: 'FeatureCollection', metadata: {}, features: [] },
    });
  });
  await page.route(/\/api\/.+\/items\/wave_buoy_latest_date(?:\?|$)/, async route => {
    await route.fulfill({ json: defaultDaySelected + 'T00:00:00.000000000Z' });
  });
});

test.describe('HeatmapAtlasLayer / HeatmapAtlasField', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(defaultDayURL);
    await enableProduct(page, 'GSLA sea level anomaly product');
    await waitForLayer(page, GSLA_ANOMALY_LAYER_ID);
  });

  test('registers as a Mapbox custom layer with the expected id and type', async ({ page }) => {
    const snap = await snapshotLayer(page, GSLA_ANOMALY_LAYER_ID);
    expect(snap).not.toBeNull();
    expect(snap!.id).toBe(GSLA_ANOMALY_LAYER_ID);
    expect(snap!.type).toBe('custom');
    expect(snap!.hasOnAdd).toBe(true);
    expect(snap!.hasOnRemove).toBe(true);
    expect(snap!.hasRender).toBe(true);
  });

  test('populates `field` after onAdd', async ({ page }) => {
    // The host hook keeps the layer registered for the lifetime of the map style
    // (toggling a product only flips visibility); `field` is created in onAdd
    // and lives on the wrapper.
    const after = await snapshotLayer(page, GSLA_ANOMALY_LAYER_ID);
    expect(after).not.toBeNull();
    expect(after!.hasField).toBe(true);
  });

  test('removing the layer via map.removeLayer fires onRemove and clears `field`', async ({
    page,
  }) => {
    expect((await snapshotLayer(page, GSLA_ANOMALY_LAYER_ID))!.hasField).toBe(true);

    // Drive map.removeLayer directly to exercise the onRemove cleanup path —
    // the host hook does not call removeLayer when toggling product enablement.
    await page.evaluate(id => {
      const map = (window as unknown as { map?: Map }).map;
      if (!map) throw new Error('Map not found');
      if (map.getLayer(id)) map.removeLayer(id);
    }, GSLA_ANOMALY_LAYER_ID);

    await waitForLayerGone(page, GSLA_ANOMALY_LAYER_ID);
  });

  test('setVisible flips the wrapper.visible flag', async ({ page }) => {
    // Don't rely on the host hook's auto-show: tile fetches are aborted in the
    // beforeEach, which keeps the product in `isError` state and prevents the
    // hook from ever calling setVisible(true). Exercise the wrapper API directly.
    expect((await invokeLayerMethod(page, GSLA_ANOMALY_LAYER_ID, 'setVisible', [true])).ok).toBe(
      true,
    );
    expect((await snapshotLayer(page, GSLA_ANOMALY_LAYER_ID))!.visible).toBe(true);

    expect((await invokeLayerMethod(page, GSLA_ANOMALY_LAYER_ID, 'setVisible', [false])).ok).toBe(
      true,
    );
    expect((await snapshotLayer(page, GSLA_ANOMALY_LAYER_ID))!.visible).toBe(false);
  });

  test('updatePalette is callable without throwing', async ({ page }) => {
    const result = await invokeLayerMethod(page, GSLA_ANOMALY_LAYER_ID, 'updatePalette', [
      { legendRange: [-2, 2] },
    ]);
    expect(result.ok).toBe(true);
  });

  test('manifest fetch is keyed by the URL date on day change', async ({ page }) => {
    const { dataset, variable } = extractProductVariables(GSLA_ANOMALY_PRODUCT);
    const nextManifest = page.waitForRequest(req => {
      const url = new URL(req.url());
      return (
        url.pathname.endsWith('/data_tiles/manifest') &&
        url.searchParams.get('dataset') === dataset &&
        url.searchParams.get('variable') === variable &&
        url.searchParams.get('datetime') === nextDaySelected
      );
    });

    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    await sliderHandle.focus();
    await page.keyboard.press('ArrowRight');

    await nextManifest;
  });
});

test.describe('ParticlesAtlasLayer / ParticlesAtlasField', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(defaultDayURL);
    await enableProduct(page, 'GSLA Ocean geostrophic current product');
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

    await page.evaluate(id => {
      const map = (window as unknown as { map?: Map }).map;
      if (!map) throw new Error('Map not found');
      if (map.getLayer(id)) map.removeLayer(id);
    }, GSLA_PARTICLE_LAYER_ID);

    await waitForLayerGone(page, GSLA_PARTICLE_LAYER_ID);
  });

  test('setVisible flips the wrapper.visible flag', async ({ page }) => {
    expect((await invokeLayerMethod(page, GSLA_PARTICLE_LAYER_ID, 'setVisible', [true])).ok).toBe(
      true,
    );
    expect((await snapshotLayer(page, GSLA_PARTICLE_LAYER_ID))!.visible).toBe(true);

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
    const { dataset, variable } = extractProductVariables(GSLA_PARTICLE_PRODUCT);
    const nextManifest = page.waitForRequest(req => {
      const url = new URL(req.url());
      return (
        url.pathname.endsWith('/data_tiles/manifest') &&
        url.searchParams.get('dataset') === dataset &&
        url.searchParams.get('variable') === variable &&
        url.searchParams.get('datetime') === nextDaySelected
      );
    });

    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    await sliderHandle.focus();
    await page.keyboard.press('ArrowRight');

    await nextManifest;
  });
});

test.describe('Field re-entrancy under rapid date changes (fetchGeneration guard)', () => {
  test('Heatmap layer survives sequential day changes without leaking the wrapper', async ({
    page,
  }) => {
    await page.goto(defaultDayURL);
    await enableProduct(page, 'GSLA sea level anomaly product');
    await waitForLayer(page, GSLA_ANOMALY_LAYER_ID);

    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    await sliderHandle.focus();

    // Two rapid forward steps — the second setSource supersedes the first; the
    // layer should still be registered and the field still present at the end.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => snapshotLayer(page, GSLA_ANOMALY_LAYER_ID)).not.toBeNull();
    const snap = await snapshotLayer(page, GSLA_ANOMALY_LAYER_ID);
    expect(snap!.hasField).toBe(true);
  });

  test('Particle layer survives sequential day changes without leaking the wrapper', async ({
    page,
  }) => {
    await page.goto(defaultDayURL);
    await enableProduct(page, 'GSLA Ocean geostrophic current product');
    await waitForLayer(page, GSLA_PARTICLE_LAYER_ID);

    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    await sliderHandle.focus();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => snapshotLayer(page, GSLA_PARTICLE_LAYER_ID)).not.toBeNull();
    const snap = await snapshotLayer(page, GSLA_PARTICLE_LAYER_ID);
    expect(snap!.hasField).toBe(true);
  });
});
