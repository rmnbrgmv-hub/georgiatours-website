import { test, expect } from '@playwright/test';
import { gotoBypass } from './helpers.js';

test.describe('Navigation & Public Pages', () => {
  test('1. Landing page loads', async ({ page }) => {
    await gotoBypass(page, '/');
    await expect(page.getByText(/tourbid|explore georgia|find.*guide/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('2. Under construction page shows without bypass', async ({ page }) => {
    await page.goto('http://localhost:5175/');
    await page.evaluate(() => localStorage.removeItem('tourbid-access'));
    await page.reload();
    await expect(page.getByText(/coming soon|under construction/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('3. Bypass via URL parameter works', async ({ page }) => {
    await page.goto('http://localhost:5175/');
    await page.evaluate(() => localStorage.removeItem('tourbid-access'));
    await page.goto('http://localhost:5175/?access=tourbid2026');
    await page.waitForTimeout(2000);

    const hasLanding = await page.getByText(/explore georgia|tourbid|find.*guide/i).first().isVisible().catch(() => false);
    const isNotConstruction = !(await page.getByText(/coming soon/i).isVisible().catch(() => false));
    expect(hasLanding || isNotConstruction).toBeTruthy();
  });

  test('4. Login page loads with role selector', async ({ page }) => {
    await gotoBypass(page, '/login');
    await expect(page.getByText(/sign in/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/tourist/i)).toBeVisible();
    await expect(page.getByText(/guide/i)).toBeVisible();
    await expect(page.getByText(/driver/i)).toBeVisible();
  });

  test('5. Public explore page loads', async ({ page }) => {
    await gotoBypass(page, '/explore');
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible({ timeout: 10_000 });
  });

  test('6. Unauthenticated /app redirects to login', async ({ page }) => {
    await gotoBypass(page, '/app');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
  });

  test('7. Language selector is present on login', async ({ page }) => {
    await gotoBypass(page, '/login');
    await expect(page.locator('button', { hasText: '🌐' })).toBeVisible({ timeout: 10_000 });
  });
});
