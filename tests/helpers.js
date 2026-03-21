/**
 * Shared helpers for Playwright E2E tests.
 *
 * The site has an "under construction" gate that checks localStorage for
 * `tourbid-access === 'granted'`.  Every test must bypass it before navigating.
 */

/** Bypass the under-construction gate and navigate to `path`. */
export async function gotoBypass(page, path = '/') {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('tourbid-access', 'granted'));
  await page.goto(path);
}

/** Generate a unique email for test isolation. */
export function testEmail(prefix = 'test') {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}+${ts}${rand}@test-tourbid.com`;
}

/**
 * Sign up AND log in a new user in one go.
 * Returns { email, password, name }.
 * After return, the page should be on /app/* (or /login if rate-limited).
 */
export async function signupAndLogin(page, { role = 'tourist', name = 'Test User', password = 'Test1234!' } = {}) {
  const email = testEmail(role);
  await gotoBypass(page, '/login');

  // Switch to signup mode
  await page.getByRole('button', { name: 'Create account' }).click();

  // Select role
  const roleButton = page.locator('.login-role-grid button', { hasText: new RegExp(role, 'i') });
  await roleButton.click();

  // Fill name
  await page.getByPlaceholder('Your name').fill(name);

  // Fill email + password
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Submit
  await page.getByRole('button', { name: /create account/i }).last().click();

  // Wait for redirect to /app or back to /login
  await page.waitForURL(/\/(app|login)/, { timeout: 20_000 });

  // If redirected to /login, sign in
  if (page.url().includes('/login')) {
    await page.getByRole('button', { name: 'Sign in' }).first().click();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: /sign in/i }).last().click();
    await page.waitForURL(/\/app/, { timeout: 15_000 });
  }

  return { email, password, name };
}

/** Log in an existing user via the UI. */
export async function loginUser(page, { email, password = 'Test1234!' }) {
  await gotoBypass(page, '/login');

  // Make sure we're on Sign in tab
  await page.getByRole('button', { name: 'Sign in' }).first().click();

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Click submit
  await page.getByRole('button', { name: /sign in/i }).last().click();
}

/** Wait for app layout to be visible (user is logged in and in /app). */
export async function waitForApp(page) {
  await page.waitForURL(/\/app/, { timeout: 15_000 });
}
