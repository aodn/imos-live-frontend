import { OVERLAY_LAYER_ID, PARTICLE_LAYER_ID } from '@/constants/map';
import { VectoryLayerInterface } from '@/layers';
import { expect, Page, test } from '@playwright/test';
import { type Map } from 'mapbox-gl';
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

type Product = 'GSLA Ocean current product' | 'GSLA Anomaly sea levels';

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

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2025-08-01T00:00:00.000Z'));
  await page.route('*/**/GSLA/2025-07-23/gsla_data.json', async route => {
    await route.fulfill({ json: genData([1, 2, 3]) });
  });
  await page.route('*/**/GSLA/2025-07-24/gsla_data.json', async route => {
    await route.fulfill({ json: genData([2, 3, 4]) });
  });
});

test.describe('Ocean Current', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await sidebarComponent.selectProduct(page, 'GSLA Ocean current product');
  });

  test('User can see the current value from a map particle', async ({ page }) => {
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

  test('User can see the current value from a map particle', async ({ page }) => {
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

  test('User can see the current value from a map particle', async ({ page }) => {
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
