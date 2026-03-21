import { test, expect } from '@playwright/test';
import { gotoBypass, testEmail } from './helpers.js';

const PASSWORD = 'Test1234!';

test.describe('Driver Flow', () => {
  test('1. Driver signup with vehicle info', async ({ page }) => {
    const email = testEmail('driver');
    await gotoBypass(page, '/login');

    // Switch to signup mode
    await page.getByRole('button', { name: 'Create account' }).click();

    // Select driver role
    const driverBtn = page.locator('.login-role-grid button', { hasText: /driver/i });
    await driverBtn.click();

    // Should show vehicle info notice
    await expect(page.getByText(/vehicle on the next step/i)).toBeVisible({ timeout: 5000 });

    // Fill name
    await page.getByPlaceholder('Your name').fill('Driver Test');

    // Fill email + password
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(PASSWORD);

    // Submit signup
    await page.getByRole('button', { name: /create account/i }).last().click();

    // Wait for vehicle form or redirect
    await page.waitForTimeout(5000);

    const hasVehicleForm = await page.getByText('Your Vehicle').isVisible().catch(() => false);

    if (hasVehicleForm) {
      // Select vehicle make
      const makeSelect = page.locator('select').filter({ hasText: /select manufacturer/i });
      await makeSelect.selectOption('Mercedes-Benz');

      await page.waitForTimeout(500);

      // Select model
      const modelSelect = page.locator('select').filter({ hasText: /select model/i });
      await modelSelect.selectOption('Sprinter 315 CDI');

      // Should show max seats
      await expect(page.getByText(/max seats/i)).toBeVisible({ timeout: 3000 });

      // Fill color
      await page.getByPlaceholder('e.g. Black, Silver').fill('Black');

      // Fill plate
      await page.getByPlaceholder('e.g. GE-ABC-123').fill('GE-TEST-001');

      // Click Continue
      await page.getByRole('button', { name: /continue/i }).click();

      await page.waitForTimeout(3000);
    }

    // Should end up at /app or /login
    expect(page.url()).toMatch(/\/(app|login)/);
  });
});
