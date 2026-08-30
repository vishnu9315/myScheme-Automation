import { test, expect } from '../../fixtures/testFixtures';
import { knownSchemes } from '../../utils/testData';
import { AUTH_STATE_PATH } from '../../global-setup';

test.describe('Dynamic scheme routes @regression', () => {
  test('a scheme page opened via direct URL loads correctly', async ({ schemeDetailsPage }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);

    await expect(schemeDetailsPage.schemeTitle).toContainText(knownSchemes.agnipath.name);
  });

  test('refreshing a scheme page keeps showing the same scheme', async ({
    page,
    schemeDetailsPage,
  }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);
    await expect(schemeDetailsPage.schemeTitle).toContainText(knownSchemes.agnipath.name);

    await page.reload();

    await expect(schemeDetailsPage.schemeTitle).toContainText(knownSchemes.agnipath.name);
  });

  test('opening a scheme in a new tab (simulated via direct navigation) works independently', async ({
    browser,
  }) => {
    // A manually-created context doesn't inherit playwright.config.ts's
    // `use.storageState` — without passing it explicitly here, this would
    // hit the Cognito environment gate (BLOCKED_SCENARIOS.md -> ENV-01)
    // instead of the app.
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    const page = await context.newPage();

    await page.goto(`/schemes/${knownSchemes.agnipath.slug}`);
    // The shared header renders its own empty-text <h1> on every page —
    // see pages/SchemeDetailsPage.ts for the same, documented fix.
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /.+/ })).toContainText(
      knownSchemes.agnipath.name,
    );

    await context.close();
  });

  test('Back from a scheme page to search preserves the browser history stack', async ({
    page,
    searchPage,
    schemeListingPage,
  }) => {
    await searchPage.open();
    await schemeListingPage.openSchemeAt(0);
    await expect(page).toHaveURL(/\/schemes\//);

    await page.goBack();
    await expect(page).toHaveURL(/\/search/);
  });
});
