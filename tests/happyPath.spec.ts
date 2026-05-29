import {
  MEASURE_POINTS_LAYER_ID,
  PRODUCT,
  PRODUCTS,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
} from '@/constants';
import type { Page, Route } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { type Map } from 'mapbox-gl';

const GSLA_PARTICLE_PRODUCT = PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT;
const GSLA_ANOMALY_PRODUCT = PRODUCT.GSLA_ANOMALY_SEA_LEVELS;
const GSLA_ANOMALY_LAYER_ID = PRODUCTS[GSLA_ANOMALY_PRODUCT].layerId;
const GSLA_PARTICLE_LAYER_ID = PRODUCTS[GSLA_PARTICLE_PRODUCT].layerId;
const WAVE_BUOYS_LAYER_ID = PRODUCTS[PRODUCT.WAVE_BUOYS].layerId;

type LngLat = [number, number];

type Product =
  | 'GSLA Ocean geostrophic current product'
  | 'GSLA sea level anomaly product'
  | 'Wave buoys product';

type OceanCurrentPopupContent = {
  speed: string;
  direction: string;
  degree: string;
};

type SeaLevelAnomalyPopupContent = {
  gsla: string;
};

type PopupContent =
  | OceanCurrentPopupContent
  | SeaLevelAnomalyPopupContent
  | (OceanCurrentPopupContent & SeaLevelAnomalyPopupContent);

// aria-labels emitted by ClickedMapPopupContent are derived from PRODUCTLEGENDS[product].label
// — keep these in sync if the legend labels change.
const OCEAN_CURRENT_POPUP_LABEL = 'ocean current speed (m/s) details';
const SEA_LEVEL_ANOMALY_POPUP_LABEL = 'sea level anomaly (m) details';

const mapComponent = {
  waitUntilIdle: async (page: Page) => {
    await page.waitForFunction(() => {
      const map = (window as any).map as Map | undefined;
      return map?.idle();
    });
  },
  waitUntilLayerLoaded: async (page: Page, layerID: string) => {
    await expect
      .poll(() =>
        page.waitForFunction(layerID => {
          const map = (window as any).map as Map | undefined;
          const layer = map?.getLayer(layerID);
          return layer;
        }, layerID),
      )
      .toBeDefined();
  },
  waitUntilLayerNotLoaded: async (page: Page, layerID: string) => {
    await expect
      .poll(() =>
        page.waitForFunction(layerID => {
          const map = (window as any).map as Map | undefined;
          const layer = map?.getLayer(layerID);
          if (!layer) return true;

          // Atlas CustomLayerInterface wrappers expose `visible` on the layer or
          // on the `.implementation` Mapbox attaches when registering the layer.
          if ('visible' in layer) {
            return (layer as any).visible === false;
          }
          if ('implementation' in layer && 'visible' in (layer as any).implementation) {
            return (layer as any).implementation.visible === false;
          }
          if ('layout' in layer && layer.layout && 'visibility' in layer.layout) {
            return layer.layout.visibility === 'none';
          }

          throw new Error('Unknown layer type');
        }, layerID),
      )
      .toBeTruthy();
  },
  openPopup: async (page: Page, coordinates?: LngLat) => {
    await expect(async () => {
      const point = await page.evaluate(coords => {
        const map = (window as any).map as Map | undefined;
        if (!map) throw new Error('Map not found');

        // Temporarily remove the world-land-fill-layer to allow clicks for testing
        // This layer is used in production to prevent clicks on land
        const landLayerId = 'world-land-fill-layer';
        if (map.getLayer(landLayerId)) {
          map.removeLayer(landLayerId);
        }

        // Use provided coordinates or find a point in the center of the data bounds
        const targetCoords = coords ?? [150.0, -30.0];
        return map.project(targetCoords as [number, number]);
      }, coordinates);

      await page
        .getByRole('region', { name: 'Map' })
        .click({ position: { x: point.x, y: point.y } });
      await expect(page.getByLabel('Current value from coordinates')).toBeVisible();
    }).toPass();
  },
  closePopup: async (page: Page) => {
    await page.getByRole('button', { name: 'Close popup' }).click();
    await expect(page.getByLabel('Current value from coordinates')).not.toBeVisible();
  },
  expectPopupToHaveContent: async (page: Page, content: PopupContent) => {
    await mapComponent.openPopup(page);
    if ('speed' in content) {
      const oceanCurrent = page.getByLabel(OCEAN_CURRENT_POPUP_LABEL);
      await expect(oceanCurrent).toBeVisible();
      await expect(oceanCurrent).toContainText(
        `${content.degree}° (${content.direction}) @ ${content.speed} m/s`,
      );
    }
    if ('gsla' in content) {
      const seaLevel = page.getByLabel(SEA_LEVEL_ANOMALY_POPUP_LABEL);
      await expect(seaLevel).toBeVisible();
      await expect(seaLevel).toContainText(`${content.gsla} m`);
    }

    await mapComponent.closePopup(page);
  },
  clickOnBuoy: async (page: Page, buoyName: string) => {
    const point = await page.evaluate(
      ({ layer, buoyName }) => {
        const map = (window as any).map as Map | undefined;
        if (!map) throw new Error('Map not found');

        const buoy = map
          ?.queryRenderedFeatures(undefined as any, { layers: [layer] })
          ?.find(f => f.properties?.buoy === buoyName);
        if (!buoy) throw new Error('No features found');

        const coordinates = buoy.geometry.type === 'Point' && buoy.geometry.coordinates;
        if (!coordinates) throw new Error('Coordinates not found');
        if (coordinates.length !== 2) throw new Error('Invalid coordinates length');

        return map.project(coordinates as LngLat);
      },
      { layer: UNCLUSTERED_WAVE_BUOYS_LAYER_ID, buoyName },
    );

    await page.getByRole('region', { name: 'Map' }).click({ position: { x: point.x, y: point.y } });
    await expect(
      page.getByLabel('Interactive chart', { exact: true }).getByText(buoyName),
    ).toBeVisible();
  },
};

const sidebarComponent = {
  selectProduct: async (page: Page, productName: Product) => {
    await page.getByLabel(productName).getByRole('button', { name: 'Add to map' }).click();
    await expect(
      page.getByLabel(productName).getByRole('button', { name: 'Add to map' }),
    ).not.toBeVisible();
    await expect(
      page.getByLabel(productName).getByRole('button', { name: 'Remove from map' }),
    ).toBeVisible();
  },
  deselectProduct: async (page: Page, productName: Product) => {
    await page.getByLabel(productName).getByRole('button', { name: 'Remove from map' }).click();
    await expect(
      page.getByLabel(productName).getByRole('button', { name: 'Remove from map' }),
    ).not.toBeVisible();
    await expect(
      page.getByLabel(productName).getByRole('button', { name: 'Add to map' }),
    ).toBeVisible();
  },
};

const buoys = {
  HOBARITO: {
    name: 'HOBARITO',
    coordinates: [147.33, -42.88] satisfies LngLat,
  },
  DARWIN: {
    name: 'DARWIN',
    coordinates: [130.78, -12.1] satisfies LngLat,
  },
};

const currentDate = new Date('2025-08-01T00:00:00.000Z');
const defaultDaySelected = '2025-07-01';
const nextDaySelected = '2025-07-02';

// Minimal manifests the atlas system accepts: one 256×256 LOD1 tile covering
// the Australasian bounds the dev data uses. Tile PNGs are aborted by a
// separate route — the layer flips to error state, which is fine for these
// tests since they only assert layer registration and popup data flow.
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

// u=N, v=0 gives a due-east vector with speed N and Cartesian degree 0 — keeps
// the test expectations trivial to read.
function particlePointForDate(date: string) {
  const speed = date === defaultDaySelected ? 1 : 2;
  return {
    lat: -30,
    lon: 150,
    variables: {
      UCUR: { value: speed, units: 'm/s' },
      VCUR: { value: 0, units: 'm/s' },
    },
  };
}

function gslaPointForDate(date: string) {
  const value = date === defaultDaySelected ? 3 : 4;
  return {
    lat: -30,
    lon: 150,
    variables: {
      GSLA: { value, units: 'm' },
    },
  };
}

function parseDateFromTileUrl(url: string): string | undefined {
  return url.match(/\/(\d{4}-\d{2}-\d{2})\//)?.[1];
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: currentDate });

  // Tile manifests — return product-shape-appropriate stubs.
  await page.route('**/data_tiles/**/manifest.json', async (route: Route) => {
    const url = route.request().url();
    if (url.includes(GSLA_PARTICLE_PRODUCT)) {
      await route.fulfill({ json: PARTICLE_MANIFEST });
    } else {
      await route.fulfill({ json: SCALAR_MANIFEST });
    }
  });

  // Tile PNGs aren't needed for these tests — abort so the atlas falls into
  // error state quickly rather than retrying against the unreachable origin.
  await page.route(/data_tiles\/.+\/\d+\/\d+\/\d+\.png$/, route => route.abort());

  // Per-point lookup powering the click popup.
  await page.route('**/data_tiles/**/point*', async (route: Route) => {
    const url = route.request().url();
    const date = parseDateFromTileUrl(url) ?? defaultDaySelected;
    if (url.includes(GSLA_PARTICLE_PRODUCT)) {
      await route.fulfill({ json: particlePointForDate(date) });
    } else if (url.includes(GSLA_ANOMALY_PRODUCT)) {
      await route.fulfill({ json: gslaPointForDate(date) });
    } else {
      // Other tile products (SST mosaic, MCS category) aren't exercised here.
      await route.fulfill({ json: { lat: -30, lon: 150, variables: {} } });
    }
  });

  // The frontend serialises `datetime` in nanosecond UTC format
  // (`localToUTC` → `YYYY-MM-DDTHH:mm:ss.000000000Z`), so we match by glob on the
  // ISO date prefix rather than pinning the exact suffix. Whatever local day the
  // app converts maps to one of two UTC days (Sydney is +10/+11), so we serve the
  // HOBARITO feature for `2025-06-30` (= 2025-07-01 local) and DARWIN for
  // `2025-07-01` (= 2025-07-02 local).
  await page.route(
    /\/api\/.+\/items\/wave_buoy_first_data_available\?datetime=2025-06-30T/,
    async route => {
      await route.fulfill({
        json: {
          type: 'FeatureCollection',
          metadata: {},
          features: [
            {
              type: 'Feature',
              properties: {
                date: defaultDaySelected,
                buoy: buoys.HOBARITO.name,
                year: 2025,
                timestamp: defaultDaySelected + 'T00:10:00',
              },
              geometry: { coordinates: buoys.HOBARITO.coordinates, type: 'Point' },
            },
          ],
        },
      });
    },
  );

  await page.route(
    /\/api\/.+\/items\/wave_buoy_first_data_available\?datetime=2025-07-01T/,
    async route => {
      await route.fulfill({
        json: {
          type: 'FeatureCollection',
          metadata: {},
          features: [
            {
              type: 'Feature',
              properties: {
                date: nextDaySelected,
                buoy: buoys.DARWIN.name,
                year: 2025,
                timestamp: nextDaySelected + 'T00:10:00',
              },
              geometry: { coordinates: buoys.DARWIN.coordinates, type: 'Point' },
            },
          ],
        },
      });
    },
  );

  // WaveBuoyChart gates its timeseries fetch on `wave_buoy_latest_date` resolving.
  // Without this, the chart stays in "Loading..." forever in tests.
  await page.route(/\/api\/.+\/items\/wave_buoy_latest_date(?:\?|$)/, async route => {
    await route.fulfill({ json: defaultDaySelected + 'T00:00:00.000000000Z' });
  });

  // `getLatestWaveBuoySites` powers the "all sites" base layer used by
  // mergeAndFilterBuoyFeatures. Serve a list that includes both test buoys so
  // either one can be present after the merge.
  await page.route(/\/api\/.+\/items\/wave_buoy_all(?:\?|$)/, async route => {
    await route.fulfill({
      json: {
        type: 'FeatureCollection',
        metadata: {},
        features: [
          {
            type: 'Feature',
            properties: { date: defaultDaySelected, buoy: buoys.HOBARITO.name, year: 2025 },
            geometry: { coordinates: buoys.HOBARITO.coordinates, type: 'Point' },
          },
          {
            type: 'Feature',
            properties: { date: nextDaySelected, buoy: buoys.DARWIN.name, year: 2025 },
            geometry: { coordinates: buoys.DARWIN.coordinates, type: 'Point' },
          },
        ],
      },
    });
  });

  await page.route(
    '/api/v1/ogc/collections/b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc/items/wave_buoy_timeseries*',
    async route => {
      const req = route.request();
      const url = req.url();

      const timeseriesURL = new URL(url, `http://${req.headers().host}`);

      const buoyName = timeseriesURL.searchParams.get('waveBuoy') ?? '';
      expect(buoyName).toBe(buoys.HOBARITO.name);
      const [from, to] = timeseriesURL.searchParams.get('datetime')?.split('/') || [];

      const properties = {
        SSWMD: [] as [number, number][],
        WPFM: [] as [number, number][],
        WSSH: [] as [number, number][],
      };
      const current = new Date(from);
      current.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(0, 0, 0, 0);
      let iterations = 0;
      while (current <= end) {
        properties['SSWMD'].push([current.getTime(), Math.random() * 360 - iterations * 10]);
        properties['WPFM'].push([current.getTime(), Math.random() * 50 - iterations * 2]);
        properties['WSSH'].push([current.getTime(), Math.random() * 100 - iterations * 5]);
        current.setDate(current.getDate() + 1);
        iterations++;
      }

      properties['SSWMD'].push([current.getTime(), 1]);
      properties['WPFM'].push([current.getTime(), 1]);
      properties['WSSH'].push([current.getTime(), 1]);

      const data = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [143.72338, -38.75365],
        },
        properties,
      };

      await route.fulfill({
        json: data,
      });
    },
  );
});

test.describe('Ocean Current', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?date=${defaultDaySelected}`);
    // Only Wave Buoys is enabled by default — switch the selection over to
    // Ocean Current for these tests.
    await sidebarComponent.selectProduct(page, 'GSLA Ocean geostrophic current product');
    await sidebarComponent.deselectProduct(page, 'Wave buoys product');
    await mapComponent.waitUntilLayerLoaded(page, GSLA_PARTICLE_LAYER_ID);
  });

  test('User can see particle patterns of different days', async ({ page }) => {
    // The atlas particle layer is a Mapbox CustomLayerInterface (no source), so
    // the date-change behaviour is verified via the manifest fetch the layer
    // hook fires when the date changes. The initial load is already covered by
    // `waitUntilLayerLoaded` + `selectProduct` in beforeEach.

    // Wait for auto-scroll to complete and slider to be stable
    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);

    const nextDateManifest = page.waitForRequest(
      req =>
        req.url().includes(GSLA_PARTICLE_PRODUCT) &&
        req.url().includes(`/${nextDaySelected}/manifest.json`),
    );
    await sliderHandle.focus();
    await page.keyboard.press('ArrowRight');
    await nextDateManifest;
  });

  test('User can see the current value from a map particle of different days', async ({ page }) => {
    await mapComponent.expectPopupToHaveContent(page, {
      speed: '1.00',
      direction: 'E',
      degree: '0',
    });

    // Wait for auto-scroll to complete and slider to be stable
    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    await sliderHandle.focus();
    await page.keyboard.press('ArrowRight');

    await mapComponent.waitUntilIdle(page);

    await mapComponent.expectPopupToHaveContent(page, {
      speed: '2.00',
      direction: 'E',
      degree: '0',
    });
  });
});

test.describe('Anomaly sea levels and Ocean Current', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?date=${defaultDaySelected}`);
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

    // Wait for auto-scroll to complete and slider to be stable
    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    await sliderHandle.focus();
    await page.keyboard.press('ArrowRight');

    await mapComponent.waitUntilIdle(page);

    await mapComponent.expectPopupToHaveContent(page, {
      gsla: '4.00',
      speed: '2.00',
      direction: 'E',
      degree: '0',
    });
  });
});

test.describe('URL state restore', () => {
  // The store is persisted via `partialize` + a URL-backed storage adapter
  // (see src/store/useMapUIStore.ts → hashStorage). Deep-linking with state in
  // the query string is the only mechanism users have to share map views, so
  // it gets its own regression test outside the unit-level serialization spec.

  test('restores `date` from the URL on load', async ({ page }) => {
    const deepLinkDate = '2025-07-15';
    await page.goto(`/?date=${deepLinkDate}`);

    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });

    // The slider auto-scrolls to position over the persisted date; the URL should
    // continue to reflect the restored value after hydration. Match across either
    // the bare or URL-encoded type tag (`s:` vs `s%3A`).
    await expect(page).toHaveURL(new RegExp(`date=(?:s(?::|%3A))?${deepLinkDate}`));
  });

  test('restores `productEnabled` from the URL on load (only sea-level anomaly enabled)', async ({
    page,
  }) => {
    // Legacy bare-JSON form is accepted by deserialize() — see serialization.ts's
    // legacy fallback branch. Using it here keeps the URL human-readable.
    const productEnabled = {
      [GSLA_PARTICLE_PRODUCT]: false,
      [GSLA_ANOMALY_PRODUCT]: true,
      [PRODUCT.WAVE_BUOYS]: false,
      [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: false,
      [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: false,
      [PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY]: false,
    };
    const encoded = encodeURIComponent(JSON.stringify(productEnabled));
    await page.goto(`/?date=${defaultDaySelected}&productEnabled=${encoded}`);

    await mapComponent.waitUntilLayerLoaded(page, GSLA_ANOMALY_LAYER_ID);

    // The sidebar should reflect the restored state — Add/Remove buttons swap
    // based on `productEnabled`, so this is a single end-to-end assertion that
    // the store hydrated from the URL.
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

test.describe('Style switching', () => {
  // `setStyle` triggers a full Mapbox style reload — every source and layer is
  // torn down, and the layer hooks must re-register them via their style.load
  // listeners. This is a well-known regression hotspot in Mapbox apps, so we
  // keep one E2E to guard the re-registration path.

  test.beforeEach(async ({ page }) => {
    await page.goto(`/?date=${defaultDaySelected}`);
  });

  test('Wave buoys layer survives a map style change', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);

    await page.getByRole('menuitem', { name: 'Maps' }).click();
    // The dropdown trigger button shows the currently-selected style as its
    // accessible name ("Streets" by default).
    await page.getByRole('button', { name: 'Streets' }).click();
    await page.getByRole('button', { name: 'Dark' }).click();

    await mapComponent.waitUntilIdle(page);
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);
  });
});

test.describe('Measurement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  test('User can measure distance', async ({ page }) => {
    await page.getByRole('menuitem', { name: 'Options' }).click();
    await page.getByTestId('switch-distancemeasurementEnabled').click();

    await mapComponent.waitUntilLayerLoaded(page, MEASURE_POINTS_LAYER_ID);

    // get bounding box of the map to ensure the click points are within the map bounds
    const bbox = await page.getByRole('region', { name: 'Map' }).boundingBox();
    expect(bbox).toBeDefined();

    const measurementPopup = page.getByLabel('Distance measurement');
    // click at two points to create a measurement
    await page.getByRole('region', { name: 'Map' }).click({ position: { x: bbox!.x, y: bbox!.y } });
    await expect(measurementPopup).toBeVisible();
    await expect(measurementPopup.getByRole('button', { name: 'clear' })).not.toBeVisible();
    await page
      .getByRole('region', { name: 'Map' })
      .click({ position: { x: bbox!.x + 10, y: bbox!.y } });
    await expect(measurementPopup.getByRole('button', { name: 'clear' })).toBeVisible();

    await expect(measurementPopup.getByText(/^\d+(\.\d+)? km$/)).toBeVisible();
    await measurementPopup.getByRole('button', { name: 'clear' }).click();
    await expect(measurementPopup.getByRole('button', { name: 'clear' })).not.toBeVisible();
    await expect(measurementPopup).toBeVisible();
  });
});

test.describe('Ocean Current, Anomaly sea levels and Wave Buoys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?date=${defaultDaySelected}`);
  });

  test('User can deselect all the products', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, GSLA_PARTICLE_LAYER_ID);
    await mapComponent.waitUntilLayerLoaded(page, GSLA_ANOMALY_LAYER_ID);
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);

    // Default URL only enables Wave Buoys, so opt the other two in first to
    // verify the deselect flow takes each one back down to hidden.
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
