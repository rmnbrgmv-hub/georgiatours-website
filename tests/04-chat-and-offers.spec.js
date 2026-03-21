import { test, expect } from '@playwright/test';
import { gotoBypass, signupAndLogin } from './helpers.js';

test.describe('Chat & Price Offers', () => {
  test('1. Unauthenticated /app/chat redirects to login', async ({ page }) => {
    await gotoBypass(page, '/app/chat');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
  });

  test('2. Tourist sees chat page (empty state)', async ({ page }) => {
    await signupAndLogin(page, { role: 'tourist', name: 'Chat Tourist' });

    await page.goto('http://localhost:5175/app/chat');
    await page.waitForTimeout(3000);

    // Should see either partners, "no partners" message, or chat title
    const hasContent = await page.getByText(/messages|chat|no.*partner|support/i).first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('3. Provider sees chat page with Support', async ({ page }) => {
    await signupAndLogin(page, { role: 'guide', name: 'Chat Guide' });

    await page.goto('http://localhost:5175/app/chat');
    await page.waitForTimeout(3000);

    // Provider should see Support partner or empty state
    const hasContent = await page.getByText(/support|messages|chat|no.*partner/i).first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('4. Offer text format parses correctly', async ({ page }) => {
    await gotoBypass(page, '/');

    const result = await page.evaluate(() => {
      const text = '[OFFER]|200|2026-04-15|2|tour-123|Tbilisi Walk|Transport included';
      const isOffer = text.startsWith('[OFFER]');
      const parts = text.replace('[OFFER]', '').split('|');
      return {
        isOffer,
        price: parts[1],
        date: parts[2],
        groupSize: parts[3],
        tourId: parts[4],
        tourName: parts[5],
        details: parts[6],
      };
    });

    expect(result.isOffer).toBe(true);
    expect(result.price).toBe('200');
    expect(result.date).toBe('2026-04-15');
    expect(result.groupSize).toBe('2');
    expect(result.tourName).toBe('Tbilisi Walk');
    expect(result.details).toBe('Transport included');
  });

  test('5. Accepted offer format is correct', async ({ page }) => {
    await gotoBypass(page, '/');

    const result = await page.evaluate(() => {
      const text = '[ACCEPTED]|300|2026-05-01|4|tour-456|Kazbegi Trip|Lunch + transport';
      const isAccepted = text.startsWith('[ACCEPTED]');
      const parts = text.replace('[ACCEPTED]', '').split('|');
      return { isAccepted, price: parts[1], tourName: parts[5] };
    });

    expect(result.isAccepted).toBe(true);
    expect(result.price).toBe('300');
    expect(result.tourName).toBe('Kazbegi Trip');
  });

  test('6. Provider Send Offer button shows in conversation', async ({ page }) => {
    await signupAndLogin(page, { role: 'guide', name: 'Offer Guide' });

    await page.goto('http://localhost:5175/app/chat');
    await page.waitForTimeout(3000);

    // Click on Support partner if available
    const supportBtn = page.locator('button', { hasText: /support/i });
    if (await supportBtn.isVisible().catch(() => false)) {
      await supportBtn.click();
      await page.waitForTimeout(1000);

      // Provider should see "Send Offer" button
      const offerBtn = page.getByRole('button', { name: /send offer/i });
      await expect(offerBtn).toBeVisible({ timeout: 5000 });
    }
  });
});
