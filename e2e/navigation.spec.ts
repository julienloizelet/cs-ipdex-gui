import { test, expect } from '@playwright/test';
import { submitApiKey, flowToResults } from './helpers.js';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('back from IP input returns to API key form', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('#apiKey')).toBeVisible();
  });

  test('new query from results returns to IP input', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', '1.2.3.4', true);
    await page.getByRole('button', { name: 'New Query' }).click();
    await expect(page.locator('#ips')).toBeVisible();
  });

  test('back from results returns to IP input', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', '1.2.3.4', true);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('#ips')).toBeVisible();
  });
});