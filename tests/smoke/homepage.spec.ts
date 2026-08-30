import { test, expect } from '../../fixtures/testFixtures';

test.describe('Homepage @smoke', () => {
  test('loads successfully with header controls visible', async ({ page, homePage }) => {
    await homePage.open();

    await expect(page).toHaveTitle(/myscheme/i);
    await expect(homePage.header.searchBar).toBeVisible();
    await expect(homePage.header.signInButton).toBeVisible();
    await expect(homePage.header.languageSelect).toBeVisible();
    await expect(homePage.header.themeToggle).toBeVisible();
  });

  test('hero carousel and "Find Schemes For You" CTA are present', async ({ homePage }) => {
    await homePage.open();

    await expect(homePage.heroCarousel).toBeVisible();
    await expect(homePage.findSchemesForYouButton).toBeVisible();
  });

  test('logo click returns to homepage', async ({ page, homePage }) => {
    await homePage.open();
    await homePage.footer.aboutLink.click();
    await expect(page).toHaveURL(/\/about/);

    await homePage.header.clickLogo();
    await expect(page).toHaveURL(/\/$/);
  });
});
