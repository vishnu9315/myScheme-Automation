import { test, expect } from '../../fixtures/testFixtures';

/**
 * Full authentication is BLOCKED: MyScheme delegates Sign In to DigiLocker
 * (meripehchaan.gov.in) and requires a real Aadhaar-linked account plus
 * OTP/PIN, neither of which is available in this environment. See
 * BLOCKED_SCENARIOS.md. These tests verify only what is reachable without
 * credentials: that the handoff itself is correct.
 */
test.describe('Login (DigiLocker handoff) @regression @login', () => {
  test('Sign In redirects to the DigiLocker identity provider', async ({
    page,
    loginPage,
    homePage,
  }) => {
    await homePage.open();
    await loginPage.clickSignIn();

    await page.waitForURL(/digilocker|meripehchaan/i, { timeout: 15_000 });
    expect(loginPage.isOnIdentityProvider(page.url())).toBe(true);
  });
});
