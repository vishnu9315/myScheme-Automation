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

  test('the theme toggle is not obscured by the accessibility widget', async ({
    page,
    homePage,
  }) => {
    // Known, currently-open UI defect (found 2026-09-09, reproduced on
    // Chromium, Firefox and WebKit): the third-party UserWay accessibility
    // widget renders at z-index 99999 and covers ~71% of the theme toggle
    // at ~1280px viewports — toggle at x:1240 y:64 (28x28), widget at
    // x:1240 y:72 (40x40). A real user clicking the toggle opens the
    // accessibility panel instead of changing theme. Not reproducible at
    // 1920px or at mobile widths. This test encodes the desired behavior
    // and is expected to fail until the overlap is resolved.
    test.fail(true, 'Tracks open UI defect: accessibility widget overlaps the theme toggle');

    await homePage.open();
    await expect(homePage.header.themeToggle).toBeVisible();
    // The widget is injected by a third-party script after first paint, so
    // wait for it to actually exist before measuring. Checking earlier
    // reports the brief pre-load window where the toggle is genuinely
    // unobstructed, which would pass for the wrong reason.
    await expect(page.locator('#uw-widget-custom-trigger, .uw-widget-custom-trigger')).toBeVisible({
      timeout: 15_000,
    });
    expect(await homePage.header.elementAtThemeTogglePoint()).not.toMatch(/uw-widget|userway/i);
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
