import { test, expect } from '../../fixtures/testFixtures';

test.describe('Scheme results @regression', () => {
  test('search results render scheme cards with non-empty names', async ({
    searchPage,
    schemeListingPage,
  }) => {
    await searchPage.open();

    const count = await schemeListingPage.resultCount();
    expect(count).toBeGreaterThan(0);

    const firstName = await schemeListingPage.schemeNameAt(0);
    expect(firstName.length).toBeGreaterThan(0);
  });

  test('the displayed total count is consistent across repeated refreshes', async ({
    page,
    searchPage,
  }) => {
    await searchPage.open();
    const first = await searchPage.getTotalCount();

    await page.reload();
    const second = await searchPage.getTotalCount();
    await page.reload();
    const third = await searchPage.getTotalCount();

    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  test('opening a result leads to a detail page for that same scheme', async ({
    searchPage,
    schemeListingPage,
    schemeDetailsPage,
  }) => {
    await searchPage.open();
    const name = await schemeListingPage.schemeNameAt(0);

    await schemeListingPage.openSchemeAt(0);

    await expect(schemeDetailsPage.schemeTitle).toContainText(name, { timeout: 10_000 });
  });
});
