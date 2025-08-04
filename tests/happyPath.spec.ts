import {
  OVERLAY_LAYER_ID,
  PARTICLE_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
} from '@/constants/map';
import { VectoryLayerInterface } from '@/layers';
import { expect, Page, test } from '@playwright/test';
import { type Map } from 'mapbox-gl';
import { genBuoyData } from '../test-data/buoy';
import { genData } from '../test-data/gsla';

type PopupContent = Partial<{
  speed: string;
  direction: string;
  bearing: string;
  gsla: string;
}>;

const mapComponent = {
  waitUntilIdle: async (page: Page) => {
    await page.waitForFunction(() => {
      const map = (window as any).map as Map | undefined;
      return map?.idle();
    });
  },
  waitUntilLayerLoaded: async (page: Page, layerID: string) => {
    await page.waitForFunction(layerID => {
      const map = (window as any).map as Map | undefined;
      const layer = map?.getLayer(layerID) as VectoryLayerInterface;
      return layer;
    }, layerID);
    await mapComponent.waitUntilIdle(page);
  },
  openPopup: async (page: Page) => {
    await page.getByRole('region', { name: 'Map' }).click();
    await expect(page.getByLabel('Current value from coordinates')).toBeVisible();
  },
  closePopup: async (page: Page) => {
    await page.getByRole('button', { name: 'Close popup' }).click();
    await expect(page.getByLabel('Current value from coordinates')).not.toBeVisible();
  },
  expectPopupToHaveContent: async (page: Page, content: PopupContent) => {
    await mapComponent.openPopup(page);

    if (content.speed) await expect(page.getByLabel('Particle speed')).toContainText(content.speed);
    if (content.direction)
      await expect(page.getByLabel('Particle direction')).toContainText(content.direction);
    if (content.bearing)
      await expect(page.getByLabel('Particle bearing')).toContainText(content.bearing);
    if (content.gsla) await expect(page.getByLabel('Particle gsla')).toContainText(content.gsla);

    await mapComponent.closePopup(page);
  },
};

type LngLat = [number, number];
type Product = 'GSLA Ocean current product' | 'GSLA Anomaly sea levels' | 'Wave buoys product';

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

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2025-08-01T00:00:00.000Z'));
  await page.route('*/**/GSLA/2025-07-23/gsla_data.json', async route => {
    await route.fulfill({ json: genData([1, 2, 3]) });
  });
  await page.route('*/**/GSLA/2025-07-24/gsla_data.json', async route => {
    await route.fulfill({ json: genData([2, 3, 4]) });
  });
  await page.route('*/**/BUOY/buoy_locations/buoy_locations_2025-07-23.geojson', async route => {
    const buoyLocations = {
      type: 'FeatureCollection',
      metadata: {},
      features: [
        {
          type: 'Feature',
          properties: {
            date: '2025-07-23',
            buoy: buoys.HOBARITO.name,
            year: 2025,
            timestamp: '2025-07-23T00:10:00',
          },
          geometry: {
            coordinates: buoys.HOBARITO.coordinates,
            type: 'Point',
          },
        },
      ],
    };
    await route.fulfill({ json: buoyLocations });
  });

  await page.route('*/**/BUOY/buoy_locations/buoy_locations_2025-07-24.geojson', async route => {
    const buoyLocations = {
      type: 'FeatureCollection',
      metadata: {},
      features: [
        {
          type: 'Feature',
          properties: {
            date: '2025-07-24',
            buoy: buoys.DARWIN.name,
            year: 2025,
            timestamp: '2025-07-24T00:10:00',
          },
          geometry: {
            coordinates: buoys.DARWIN.coordinates,
            type: 'Point',
          },
        },
      ],
    };
    await route.fulfill({ json: buoyLocations });
  });

  await page.route('*/**/BUOY/buoy_details/*.geojson', async route => {
    const dateMatch = route
      .request()
      .url()
      .match(/BUOY\/buoy_details\/([^_]+)_(\d{4}-\d{2}-\d{2})\.geojson/);
    if (dateMatch) {
      const buoyName = dateMatch[1];
      const dataDate = new Date(dateMatch[2]);
      await route.fulfill({
        json: genBuoyData(
          { name: buoyName, dataDate },
          {
            sswmd: (date: Date) => {
              const dateTime = new Date(date);
              dateTime.setHours(0, 0, 0, 0);
              return [[dateTime.getTime(), 180]];
            },
            wpfm: (date: Date) => {
              const dateTime = new Date(date);
              dateTime.setHours(0, 0, 0, 0);
              return [[dateTime.getTime(), 40]];
            },
            wssh: (date: Date) => {
              const dateTime = new Date(date);
              dateTime.setHours(0, 0, 0, 0);
              return [[dateTime.getTime(), 80]];
            },
          },
        ),
      });
    }
  });
});

test.describe('Ocean Current', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await sidebarComponent.selectProduct(page, 'GSLA Ocean current product');
  });

  test('User can see the current value from a map particle of different days', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, PARTICLE_LAYER_ID);
    await mapComponent.expectPopupToHaveContent(page, {
      speed: '1.00 m/s',
      direction: 'E',
      bearing: '2.00°',
    });

    await page.getByRole('slider', { name: 'point handle' }).click();
    await page.keyboard.press('ArrowRight');

    await mapComponent.waitUntilIdle(page);
    await mapComponent.openPopup(page);

    await mapComponent.expectPopupToHaveContent(page, {
      speed: '2.00 m/s',
      direction: 'E',
      bearing: '3.00°',
    });
  });
});

test.describe('Anomaly sea levels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await sidebarComponent.selectProduct(page, 'GSLA Anomaly sea levels');
  });

  test('User can see the current value from a map particle of different days', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, OVERLAY_LAYER_ID);
    await mapComponent.expectPopupToHaveContent(page, {
      gsla: '3.00 m',
    });

    await page.getByRole('slider', { name: 'point handle' }).click();
    await page.keyboard.press('ArrowRight');

    await mapComponent.waitUntilIdle(page);
    await mapComponent.openPopup(page);

    await mapComponent.expectPopupToHaveContent(page, {
      gsla: '4.55 m',
    });
  });
});

test.describe('Anomaly sea levels and Ocean Current', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await sidebarComponent.selectProduct(page, 'GSLA Anomaly sea levels');
    await sidebarComponent.selectProduct(page, 'GSLA Ocean current product');
  });

  test('User can see the current value from a map particle of different days', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, OVERLAY_LAYER_ID);
    await mapComponent.expectPopupToHaveContent(page, {
      gsla: '3.00 m',
      speed: '1.00 m/s',
      direction: 'E',
      bearing: '2.00°',
    });

    await page.getByRole('slider', { name: 'point handle' }).click();
    await page.keyboard.press('ArrowRight');

    await mapComponent.waitUntilIdle(page);
    await mapComponent.openPopup(page);

    await mapComponent.expectPopupToHaveContent(page, {
      gsla: '4.55 m',
      speed: '2.00 m/s',
      direction: 'E',
      bearing: '3.00°',
    });
  });
});

test.describe('Wave Buoys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await sidebarComponent.selectProduct(page, 'Wave buoys product');
  });

  test('User can see the see the bouy`s historical by clicking at the buoy', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);

    const point = await page.evaluate(layer => {
      const map = (window as any).map as Map | undefined;
      if (!map) throw new Error('Map not found');

      const features = map?.queryRenderedFeatures(undefined as any, { layers: [layer] });
      if (!features || features.length === 0) throw new Error('No features found');
      const [buoy] = features;

      const coordinates = buoy.geometry.type === 'Point' && buoy.geometry.coordinates;
      if (!coordinates) throw new Error('Coordinates not found');
      if (coordinates.length !== 2) throw new Error('Invalid coordinates length');

      return map.project(coordinates as LngLat);
    }, UNCLUSTERED_WAVE_BUOYS_LAYER_ID);

    await page.getByRole('region', { name: 'Map' }).click({ position: { x: point.x, y: point.y } });
    await expect(
      page.getByLabel('Interactive chart', { exact: true }).getByText('HOBARITO'),
    ).toBeVisible();
  });

  test('User can see the see the bouys location of different days', async ({ page }) => {
    await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);

    await page.waitForFunction(
      ({ layer, expectedBuoyName }) => {
        const map = (window as any).map as Map | undefined;
        if (!map) throw new Error('Map not found');

        return map?.queryRenderedFeatures(undefined as any, { layers: [layer] }).some(feature => {
          return feature.properties?.buoy === expectedBuoyName;
        });
      },
      { layer: UNCLUSTERED_WAVE_BUOYS_LAYER_ID, expectedBuoyName: buoys.HOBARITO.name },
    );

    await page.getByRole('slider', { name: 'point handle' }).click();
    await page.keyboard.press('ArrowRight');

    await page.waitForFunction(
      ({ layer, expectedBuoyName }) => {
        const map = (window as any).map as Map | undefined;
        if (!map) throw new Error('Map not found');

        return map?.queryRenderedFeatures(undefined as any, { layers: [layer] }).some(feature => {
          return feature.properties?.buoy === expectedBuoyName;
        });
      },
      { layer: UNCLUSTERED_WAVE_BUOYS_LAYER_ID, expectedBuoyName: buoys.DARWIN.name },
    );

    await page.waitForTimeout(5000);
  });
});

test('User can select all the three products ( Ocean Current, Anomaly sea levels, Wave Buoys )', async ({
  page,
}) => {
  await page.goto('/');
  await sidebarComponent.selectProduct(page, 'GSLA Ocean current product');
  await sidebarComponent.selectProduct(page, 'GSLA Anomaly sea levels');
  await sidebarComponent.selectProduct(page, 'Wave buoys product');

  await mapComponent.waitUntilLayerLoaded(page, PARTICLE_LAYER_ID);
  await mapComponent.waitUntilLayerLoaded(page, OVERLAY_LAYER_ID);
  await mapComponent.waitUntilLayerLoaded(page, WAVE_BUOYS_LAYER_ID);
});
