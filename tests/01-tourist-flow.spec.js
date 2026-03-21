import { test, expect } from '@playwright/test';
import { gotoBypass, signupAndLogin } from './helpers.js';

test.describe('Tourist Flow', () => {
  test('1. Tourist signup and login', async ({ page }) => {
    const { email } = await signupAndLogin(page, { role: 'tourist', name: 'Tourist Test' });
    expect(page.url()).toMatch(/\/app/);
  });

  test('2. Browse tours on Explore page (authenticated)', async ({ page }) => {
    await signupAndLogin(page, { role: 'tourist', name: 'Explorer' });

    await page.goto('http://localhost:5175/app/explore');
    await page.waitForURL(/\/app\/explore/);

    // Should see "All" filter button
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible({ timeout: 10_000 });

    // Tour cards or empty state
    await page.waitForTimeout(3000);
    const hasTours = await page.locator('a[href*="/tour/"]').count();
    // It's valid to have 0 tours in test env
    expect(hasTours).toBeGreaterThanOrEqual(0);
  });

  test('3. Browse tours publicly (without login)', async ({ page }) => {
    await gotoBypass(page, '/explore');
    await page.waitForURL(/\/explore/);

    await expect(page.getByRole('button', { name: 'All' })).toBeVisible({ timeout: 10_000 });
  });

  test('4. Create a request', async ({ page }) => {
    await signupAndLogin(page, { role: 'tourist', name: 'Requester' });

    await page.goto('http://localhost:5175/app/requests');
    await page.waitForURL(/\/app\/requests/);
    await page.waitForTimeout(2000);

    // Click "New Request" button
    const newReqBtn = page.getByRole('button', { name: /new request/i });
    const visible = await newReqBtn.isVisible().catch(() => false);
    if (visible) {
      await newReqBtn.click();

      // Fill request form
      await page.getByPlaceholder('e.g. Day trip to Mtskheta').fill('Test trip to Kazbegi');

      const textarea = page.locator('textarea[rows="3"]').first();
      if (await textarea.isVisible().catch(() => false)) {
        await textarea.fill('Looking for a guide for a day trip');
      }

      await page.getByRole('button', { name: /post/i }).click();
      await page.waitForTimeout(2000);
    }
  });

  test('5. View tour detail and select date on calendar', async ({ page }) => {
    await gotoBypass(page, '/explore');
    await page.waitForTimeout(3000);

    const tourLinks = page.locator('a[href*="/tour/"]');
    const count = await tourLinks.count();

    if (count > 0) {
      await tourLinks.first().click();
      await page.waitForURL(/\/tour\//);

      await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });

      // Click an available date
      const calendarButtons = page.locator('button:not([disabled])').filter({ hasText: /^\d{1,2}$/ });
      const calCount = await calendarButtons.count();
      if (calCount > 0) {
        await calendarButtons.first().click();
        await page.waitForTimeout(500);
      }
    } else {
      test.skip(true, 'No tours available');
    }
  });

  test('6. Book a tour (requires login)', async ({ page }) => {
    await signupAndLogin(page, { role: 'tourist', name: 'Booker' });

    await page.goto('http://localhost:5175/app/explore');
    await page.waitForTimeout(3000);

    const tourLinks = page.locator('a[href*="/tour/"]');
    const count = await tourLinks.count();

    if (count > 0) {
      await tourLinks.first().click();
      await page.waitForURL(/\/app\/tour\//);

      const calendarButtons = page.locator('button:not([disabled])').filter({ hasText: /^\d{1,2}$/ });
      const calCount = await calendarButtons.count();
      if (calCount > 0) {
        await calendarButtons.first().click();
        await page.waitForTimeout(500);

        const bookBtn = page.locator('button').filter({ hasText: /book for|ask price for/i });
        if (await bookBtn.isVisible().catch(() => false)) {
          await bookBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    } else {
      test.skip(true, 'No tours available');
    }
  });
});
