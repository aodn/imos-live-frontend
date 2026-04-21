import {
  MEASURE_POINTS_LAYER_ID,
  GSLA_RASTER_LAYER_ID,
  GSLA_PARTICLE_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
} from '@/constants';
import type { VectoryLayerInterface } from '@/layers';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { type Map } from 'mapbox-gl';
import { genData, toCompassStandard } from '../test-data/gsla';

type LngLat = [number, number];

type Product =
  | 'GSLA Ocean geostrophic current product'
  | 'GSLA sea level anomaly product'
  | 'Wave buoys product';

type OceanCurrentPopupContent = {
  speed: string;
  direction: string;
  bearing: string;
};

type SeaLevelAnomalyPopupContent = {
  gsla: string;
};

type PopupContent =
  | OceanCurrentPopupContent
  | SeaLevelAnomalyPopupContent
  | (OceanCurrentPopupContent & SeaLevelAnomalyPopupContent);

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
          const layer = map?.getLayer(layerID) as VectoryLayerInterface;
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
          if ('visible' in layer) {
            return layer.visible === false;
          }
          if ('layout' in layer && layer.layout && 'visibility' in layer.layout) {
            return layer.layout.visibility === 'none';
          }

          throw new Error('Unknown layer type');
        }, layerID),
      )
      .toBeTruthy();
  },
  getSourceURL: async (page: Page, layerID: string): Promise<string | undefined> => {
    return page.evaluate(
      ({ layerID }) => {
        const map = (window as any).map as Map | undefined;
        if (!map) throw new Error('Map not found');
        const layer = map.getLayer(layerID);
        if (!layer) throw new Error('Layer not found');

        // In Mapbox GL v3, custom layers are wrapped in CustomStyleLayer;
        // the original CustomLayerInterface is at .implementation
        const sourceId =
          (layer as any).implementation?.sourceId ??
          (layer as any).sourceId ??
          (layer as any).source;

        let url: string | undefined;
        if (sourceId) {
          const source = map.getSource(sourceId as string);
          if (source) url = (source as any).url as string | undefined;
        }
        return url;
      },
      { layerID },
    );
  },
  getTilesURL: async (page: Page, layerID: string): Promise<string | undefined> => {
    return page.evaluate(
      ({ layerID }) => {
        const map = (window as any).map as Map | undefined;
        if (!map) throw new Error('Map not found');
        const layer = map.getLayer(layerID);
        if (!layer) throw new Error('Layer not found');

        const sourceId =
          (layer as any).implementation?.sourceId ??
          (layer as any).sourceId ??
          (layer as any).source;

        let url: string | undefined;
        if (sourceId) {
          url = (map.getSource(sourceId as string) as any).tiles?.[0] as string | undefined;
        }
        return url;
      },
      { layerID },
    );
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
      await expect(page.getByLabel('Ocean surface current details')).toBeVisible();
      await expect(page.getByLabel('Ocean surface current details')).toContainText(
        `Ocean geostrophic current direction:${content.bearing}° (${content.direction}) @ ${content.speed} m/s`,
      );
    }
    if ('gsla' in content) {
      await expect(page.getByLabel('Sea level anomaly details')).toBeVisible();
      await expect(page.getByLabel('Sea level anomaly details')).toContainText(
        `Sea level anomaly:${content.gsla} m`,
      );
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
const defaultDaySelected = '2025-07-02';
const nextDaySelected = '2025-07-03';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: currentDate });

  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('REQUEST') === 'GetFeatureInfo') {
      if (url.pathname.includes('OceanCurrent_HV_20250702')) {
        await route.fulfill({
          body: `
          <FeatureInfoResponse>
          <longitude>165.45967031250007</longitude>
          <latitude>4.687731976914243</latitude>
          <Feature>
          <layer>GSLA</layer>
          <FeatureInfo>
          <id>GSLA</id>
          <value>3.00</value>
          </FeatureInfo>
          </Feature>
          </FeatureInfoResponse>
          `,
        });
      } else {
        await route.fulfill({
          body: `
          <FeatureInfoResponse>
          <longitude>165.45967031250007</longitude>
          <latitude>4.687731976914243</latitude>
          <Feature>
          <layer>GSLA</layer>
          <FeatureInfo>
          <id>GSLA</id>
          <value>4.00</value>
          </FeatureInfo>
          </Feature>
          </FeatureInfoResponse>
          `,
        });
      }
    } else {
      await route.continue();
    }
  });

  await page.route('*/**/GSLA/' + defaultDaySelected + '/gsla_data.json*', async route => {
    await route.fulfill({ json: genData([1, 2, 3]) });
  });
  await page.route('*/**/GSLA/' + nextDaySelected + '/gsla_data.json*', async route => {
    await route.fulfill({ json: genData([2, 3, 4]) });
  });

  await page.route(
    '/api/v1/ogc/collections/b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc/items/wave_buoy_first_data_available?datetime=2025-07-01T14:00:00.000Z',
    async route => {
      const buoyLocations = {
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
            geometry: {
              coordinates: buoys.HOBARITO.coordinates,
              type: 'Point',
            },
          },
        ],
      };
      await route.fulfill({ json: buoyLocations });
    },
  );

  await page.route(
    '/api/v1/ogc/collections/b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc/items/wave_buoy_first_data_available?datetime=2025-07-02T14:00:00.000Z',
    async route => {
      const buoyLocations = {
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
            geometry: {
              coordinates: buoys.DARWIN.coordinates,
              type: 'Point',
            },
          },
        ],
      };
      await route.fulfill({ json: buoyLocations });
    },
  );

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
    await sidebarComponent.deselectProduct(page, 'GSLA sea level anomaly product');
    await sidebarComponent.deselectProduct(page, 'Wave buoys product');
    await mapComponent.waitUntilLayerLoaded(page, GSLA_PARTICLE_LAYER_ID);
  });

  test('User can see particle patterns of different days', async ({ page }) => {
    await expect
      .poll(() => mapComponent.getSourceURL(page, GSLA_PARTICLE_LAYER_ID))
      .toContain(`/${defaultDaySelected}/`);
    // Wait for auto-scroll to complete and slider to be stable
    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    await sliderHandle.focus();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(() => mapComponent.getSourceURL(page, GSLA_PARTICLE_LAYER_ID))
      .toContain(`/${nextDaySelected}/`);
  });

  test('User can see the current value from a map particle of different days', async ({ page }) => {
    await mapComponent.expectPopupToHaveContent(page, {
      speed: '1.00',
      direction: 'E',
      bearing: `${toCompassStandard(2.0).toFixed(0)}`,
    });

    // Wait for auto-scroll to complete and slider to be stable
    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    await sliderHandle.focus();
    await page.keyboard.press('ArrowRight');

    await mapComponent.waitUntilIdle(page);
    await mapComponent.openPopup(page);

    await mapComponent.expectPopupToHaveContent(page, {
      speed: '2.00',
      direction: 'E',
      bearing: `${toCompassStandard(3.0).toFixed(0)}`,
    });
  });
});

test.describe('Anomaly sea levels and Ocean Current', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?date=${defaultDaySelected}`);
    await sidebarComponent.deselectProduct(page, 'Wave buoys product');
  });

  test('User can see the current value from a map particle of different days', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, GSLA_RASTER_LAYER_ID);
    await mapComponent.expectPopupToHaveContent(page, {
      gsla: '3.00',
      speed: '1.00',
      direction: 'E',
      bearing: `${toCompassStandard(2.0).toFixed(0)}`,
    });

    // Wait for auto-scroll to complete and slider to be stable
    const sliderHandle = page.getByRole('slider', { name: 'point handle' });
    await sliderHandle.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    await sliderHandle.focus();
    await page.keyboard.press('ArrowRight');

    await mapComponent.waitUntilIdle(page);
    await mapComponent.openPopup(page);

    await mapComponent.expectPopupToHaveContent(page, {
      gsla: '4.00',
      speed: '2.00',
      direction: 'E',
      bearing: `${toCompassStandard(3.0).toFixed(0)}`,
    });
  });
});

test.describe('Wave Buoys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?date=${defaultDaySelected}`);
    await sidebarComponent.deselectProduct(page, 'GSLA Ocean geostrophic current product');
    await sidebarComponent.deselectProduct(page, 'GSLA sea level anomaly product');
  });

  test.skip('User can read the latest observation of a specific buoy', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);
    await mapComponent.clickOnBuoy(page, buoys.HOBARITO.name);

    const latestObservation = page.getByTestId('latest-observation-timestamp');
    await expect(latestObservation).toContainText('7/24/2025, 12:00:00 AM');

    await expect(page.getByTestId('latest-observation-label')).toHaveText([
      'sea surface wave spectral significant height (m)',
      'spectral sea surface wave mean direction (Degrees)',
      'sea surface wave spectral mean period (s)',
    ]);
    await expect(page.getByTestId('latest-observation-value')).toHaveText(['1', '1', '1']);
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

  test('All the products are selected by default', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, GSLA_PARTICLE_LAYER_ID);
    await mapComponent.waitUntilLayerLoaded(page, GSLA_RASTER_LAYER_ID);
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);
  });

  test('User can deselect all the products', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, GSLA_PARTICLE_LAYER_ID);
    await mapComponent.waitUntilLayerLoaded(page, GSLA_RASTER_LAYER_ID);
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);

    await sidebarComponent.deselectProduct(page, 'GSLA Ocean geostrophic current product');
    await sidebarComponent.deselectProduct(page, 'GSLA sea level anomaly product');
    await sidebarComponent.deselectProduct(page, 'Wave buoys product');

    await mapComponent.waitUntilLayerNotLoaded(page, GSLA_PARTICLE_LAYER_ID);
    await mapComponent.waitUntilLayerNotLoaded(page, GSLA_RASTER_LAYER_ID);
    await mapComponent.waitUntilLayerNotLoaded(page, WAVE_BUOYS_LAYER_ID);
  });
});
