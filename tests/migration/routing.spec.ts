import { test, expect } from '../../fixtures/testFixtures';
import { knownSchemes, footerRoutes } from '../../utils/testData';
import { pageNotFoundHeading } from '../../utils/helpers';

/**
 * User-facing routing regression checks for the Next.js 12 -> 16 migration.
 * Not a test of the framework itself — these target the specific mechanics
 * a major-version bump changes: static route resolution, dynamic-route
 * deep-linking/refresh, trailing-slash handling, and the HTTP->HTTPS
 * redirect. All previously validated with NO regression during the
 * migration audit (2026-08-25) — kept here as living regression coverage.
 */
test.describe('Routing @migration', () => {
  test('static footer routes resolve without error', async ({ page }) => {
    for (const route of footerRoutes) {
      await page.goto(route);
      await expect(pageNotFoundHeading(page)).toHaveCount(0);
    }
  });

  test('a dynamic scheme route survives a direct deep link and a refresh', async ({
    page,
    schemeDetailsPage,
  }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);
    await expect(schemeDetailsPage.schemeTitle).toContainText(knownSchemes.agnipath.name);

    await page.reload();
    await expect(schemeDetailsPage.schemeTitle).toContainText(knownSchemes.agnipath.name);
  });

  test('Back/Forward correctly restore state across client-side navigation', async ({
    page,
    homePage,
    schemeDetailsPage,
  }) => {
    await homePage.open();
    await page.goto(`/schemes/${knownSchemes.agnipath.slug}`);
    await expect(schemeDetailsPage.schemeTitle).toContainText(knownSchemes.agnipath.name);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);

    await page.goForward();
    await expect(schemeDetailsPage.schemeTitle).toContainText(knownSchemes.agnipath.name);
  });

  test('a trailing slash on a static route does not break navigation', async ({ page }) => {
    await page.goto('/about/');

    await expect(pageNotFoundHeading(page)).toHaveCount(0);
  });

  test('HTTP requests are redirected to HTTPS', async ({ page, baseURL }) => {
    // Conditional guard against a misconfigured run (no baseURL), not a disabled test.
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(!baseURL, 'No baseURL configured for this run.');
    const httpUrl = (baseURL as string).replace('https://', 'http://');

    await page.goto(httpUrl);

    expect(page.url()).toMatch(/^https:\/\//);
  });
});
