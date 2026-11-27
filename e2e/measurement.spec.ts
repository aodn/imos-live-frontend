import { expect, test } from './fixtures';
import { MEASURE_POINTS_LAYER_ID } from '@/constants';
import { mapComponent } from './utils/mapComponent';

test.describe('Measurement', () => {
  test('User can measure distance', async ({ page }) => {
    await page.goto('/');
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

  test('User can close the measure panel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('menuitem', { name: 'Options' }).click();
    const measureSwitch = page.getByTestId('switch-distancemeasurementEnabled');
    await measureSwitch.click();

    const measurementPopup = page.getByLabel('Distance measurement', { exact: true });
    await expect(measurementPopup).toBeVisible();
    await expect(measureSwitch).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: 'Close measure panel' }).click();
    await expect(measurementPopup).not.toBeVisible();
    await expect(measureSwitch).toHaveAttribute('aria-checked', 'false');
  });
});
