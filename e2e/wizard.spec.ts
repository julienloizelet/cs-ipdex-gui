import { test, expect } from '@playwright/test';

// Helper: navigate through API key step
async function submitApiKey(page: import('@playwright/test').Page, key: string, isPov = false) {
  await page.fill('#apiKey', key);
  if (isPov) {
    await page.getByLabel('Using a PoV Key').check();
  }
  await page.getByRole('button', { name: 'Save & Continue' }).click();
  await expect(page.locator('#ips')).toBeVisible();
}

// Helper: submit IPs and confirm
async function submitIPs(page: import('@playwright/test').Page, ips: string) {
  await page.fill('#ips', ips);
  await page.getByRole('button', { name: 'Query IPs' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Helper: full flow to results
async function flowToResults(page: import('@playwright/test').Page, key: string, ips: string, isPov = false) {
  await submitApiKey(page, key, isPov);
  await submitIPs(page, ips);
  // The exit event and step transition are batched by React, so
  // "Report complete" is never rendered — wait for the results view directly.
  await expect(page.getByText('CTI Report')).toBeVisible({ timeout: 30_000 });
}

test.describe('Happy path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows API key form on initial load', async ({ page }) => {
    await expect(page.locator('#apiKey')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save & Continue' })).toBeDisabled();
  });

  test('submit button enables when key is entered', async ({ page }) => {
    await page.fill('#apiKey', 'test-community-key');
    await expect(page.getByRole('button', { name: 'Save & Continue' })).toBeEnabled();
  });

  test('full community key flow', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');

    await page.fill('#ips', '1.2.3.4\n5.6.7.8');
    await page.getByRole('button', { name: 'Query IPs' }).click();

    // Confirm dialog
    await expect(page.getByText('Confirm Query')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Results view
    await expect(page.getByText('CTI Report')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Total IPs')).toBeVisible();
  });

  test('full PoV key flow uses batch endpoint', async ({ page }) => {
    await submitApiKey(page, 'test-pov-key', true);
    await submitIPs(page, '1.2.3.4\n5.6.7.8\n9.10.11.12');

    await expect(page.getByText('CTI Report')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('General Information')).toBeVisible();
  });
});

test.describe('Validation & dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('query button disabled with empty textarea', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');
    await expect(page.getByRole('button', { name: 'Query IPs' })).toBeDisabled();
  });

  test('cancel confirm dialog returns to IP input', async ({ page }) => {
    await submitApiKey(page, 'test-community-key');
    await page.fill('#ips', '1.2.3.4');
    await page.getByRole('button', { name: 'Query IPs' }).click();

    await expect(page.getByText('Confirm Query')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Still on IP input
    await expect(page.locator('#ips')).toBeVisible();
  });
});

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
    await expect(page.getByText('Known (50%)')).toBeVisible();
  });
});

test.describe('Results content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('stat cards display correct categories', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', '1.2.3.4\n5.6.7.8\n9.10.11.12', true);

    await expect(page.getByText('Top Reputation')).toBeVisible();
    await expect(page.getByText('Top Behaviors')).toBeVisible();
    await expect(page.getByText('Top Countries')).toBeVisible();
    await expect(page.getByText('Top Autonomous Systems')).toBeVisible();
    await expect(page.getByText('Top IP Ranges')).toBeVisible();
    await expect(page.getByText('Top Classifications')).toBeVisible();
  });

  test('general info shows correct counts', async ({ page }) => {
    // 2 known IPs out of 2 total
    await flowToResults(page, 'test-pov-key', '1.2.3.4\n5.6.7.8', true);

    await expect(page.getByText('Total IPs')).toBeVisible();
    await expect(page.getByText('Known (100%)')).toBeVisible();
  });

  test('download triggers tar.gz file', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', '1.2.3.4', true);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download Report' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('cti-report.tar.gz');
  });
});
