import { test, expect } from '../../fixtures/testFixtures';
import { footerRoutes, locales } from '../../utils/testData';
import { pageNotFoundHeading } from '../../utils/helpers';

test.describe('Navigation @regression @navigation', () => {
  for (const route of footerRoutes) {
    test(`footer link ${route} loads without a 404`, async ({ page, homePage }) => {
      await homePage.open();
      await homePage.footer.linkByRoute(route).click();

      await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')));
      await expect(pageNotFoundHeading(page)).toHaveCount(0);
    });
  }

  test('the Dashboard link is present and navigates without a 404', async ({ page, homePage }) => {
    await homePage.open();

    await expect(homePage.footer.dashboardLink).toBeVisible();
    await homePage.footer.dashboardLink.click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(pageNotFoundHeading(page)).toHaveCount(0);
    // The embedded Power BI report's own content is third-party and out of
    // scope — see BLOCKED_SCENARIOS.md ("/dashboard embedded Power BI report").
  });

  test('theme toggle switches to dark mode and persists across a client-side navigation', async ({
    page,
    homePage,
  }) => {
    await homePage.open();
    expect(await homePage.header.isDarkMode()).toBe(false);

    await homePage.header.toggleTheme();
    expect(await homePage.header.isDarkMode()).toBe(true);

    await homePage.footer.aboutLink.click();
    await expect(page).toHaveURL(/\/about/);
    expect(await homePage.header.isDarkMode()).toBe(true);
  });

  test('switching language updates both the UI and the URL locale prefix', async ({
    page,
    homePage,
  }) => {
    await homePage.open();

    await homePage.header.selectLanguage(locales.hindi.label);

    await expect(page).toHaveURL(new RegExp(`^.*${locales.hindi.prefix}(/|$)`));
  });

  test('browser Back restores the previous page after client-side navigation', async ({
    page,
    homePage,
  }) => {
    await homePage.open();
    await homePage.footer.aboutLink.click();
    await expect(page).toHaveURL(/\/about/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  });

  test('browser Forward re-applies a navigation undone by Back', async ({ page, homePage }) => {
    await homePage.open();
    await homePage.footer.aboutLink.click();
    await expect(page).toHaveURL(/\/about/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);

    await page.goForward();
    await expect(page).toHaveURL(/\/about/);
  });
});
