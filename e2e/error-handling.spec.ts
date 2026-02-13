import { test, expect } from '@playwright/test';
import { flowToResults } from './helpers.js';

test.describe('Error handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('invalid API key shows error on query', async ({ page }) => {
    await page.fill('#apiKey', 'invalid-key');
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    await expect(page.locator('#ips')).toBeVisible();
    await page.fill('#ips', '1.2.3.4');
    await page.getByRole('button', { name: 'Query IPs' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText(/Invalid API key|unauthorized/i)).toBeVisible({ timeout: 15_000 });
  });

  test('unknown IP shows partial results', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', '1.2.3.4\n192.168.1.1', true);
    // 2 total, 1 known = 50%
    await expect(page.getByText('In CTI (50%)')).toBeVisible();
  });
});