import { test, expect } from '../../fixtures/testFixtures';

test.describe('Search @smoke', () => {
  test('search bar navigates to the search page', async ({ page, homePage }) => {
    await homePage.open();
    await homePage.clickSearchBar();

    await expect(page).toHaveURL(/\/search/);
  });

  test('search page lists a non-zero total scheme count', async ({ searchPage }) => {
    await searchPage.open();

    const total = await searchPage.getTotalCount();
    expect(total).not.toBeNull();
    expect(total).toBeGreaterThan(0);
  });
});
