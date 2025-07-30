import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('is map available', async ({ page }) => {
  const map = await page.evaluate(() => {
    // Check if the map object is available in the global window object
    return !!(window as any).map;
  });
  expect(map).toBeTruthy();
});
