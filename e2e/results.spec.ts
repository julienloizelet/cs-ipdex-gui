import { test, expect } from '@playwright/test';
import { flowToResults } from './helpers.js';

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

test.describe('See more / Show less', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Query 8 IPs to get 8 unique behaviors (more than 5)
  const manyIPs = '1.2.3.4\n5.6.7.8\n9.10.11.12\n10.0.0.1\n10.0.0.2\n10.0.0.3\n10.0.0.4\n10.0.0.5';

  test('see more button appears when section has more than 5 items', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', manyIPs, true);

    // Behaviors section should have 8 items, so "See more" should appear
    const behaviorsCard = page.locator('.card', { has: page.getByText('Top Behaviors') });
    await expect(behaviorsCard.getByText(/See more/)).toBeVisible();
  });

  test('see more button shows hidden count', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', manyIPs, true);

    // 8 behaviors total, showing 5, so 3 hidden
    const behaviorsCard = page.locator('.card', { has: page.getByText('Top Behaviors') });
    await expect(behaviorsCard.getByText('See more (+3)')).toBeVisible();
  });

  test('clicking see more expands to show all items', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', manyIPs, true);

    const behaviorsCard = page.locator('.card', { has: page.getByText('Top Behaviors') });

    // Initially should show 5 items
    await expect(behaviorsCard.locator('> div.space-y-2 > div')).toHaveCount(5);

    // Click "See more"
    await behaviorsCard.getByText('See more (+3)').click();

    // Now should show all 8 items
    await expect(behaviorsCard.locator('> div.space-y-2 > div')).toHaveCount(8);
  });

  test('button changes to show less after expanding', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', manyIPs, true);

    const behaviorsCard = page.locator('.card', { has: page.getByText('Top Behaviors') });

    await behaviorsCard.getByText('See more (+3)').click();
    await expect(behaviorsCard.getByText('Show less')).toBeVisible();
  });

  test('clicking show less collapses back to 5 items', async ({ page }) => {
    await flowToResults(page, 'test-pov-key', manyIPs, true);

    const behaviorsCard = page.locator('.card', { has: page.getByText('Top Behaviors') });

    // Expand
    await behaviorsCard.getByText('See more (+3)').click();
    await expect(behaviorsCard.locator('> div.space-y-2 > div')).toHaveCount(8);

    // Collapse
    await behaviorsCard.getByText('Show less').click();
    await expect(behaviorsCard.locator('> div.space-y-2 > div')).toHaveCount(5);
    await expect(behaviorsCard.getByText('See more (+3)')).toBeVisible();
  });

  test('sections with 5 or fewer items do not show see more button', async ({ page }) => {
    // Query only 3 IPs - each section will have at most 3 items
    await flowToResults(page, 'test-pov-key', '1.2.3.4\n5.6.7.8\n9.10.11.12', true);

    const behaviorsCard = page.locator('.card', { has: page.getByText('Top Behaviors') });
    await expect(behaviorsCard.getByText(/See more/)).not.toBeVisible();
  });
});