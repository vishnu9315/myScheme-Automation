import { test, expect } from '../../fixtures/testFixtures';

test.describe('Pagination @regression', () => {
  test('Next advances the page and shows a different first result', async ({
    searchPage,
    schemeListingPage,
  }) => {
    await searchPage.open();
    const firstPageFirstResult = await schemeListingPage.schemeNameAt(0);

    await schemeListingPage.goToNextPage();

    const secondPageFirstResult = await schemeListingPage.schemeNameAt(0);
    expect(secondPageFirstResult).not.toBe(firstPageFirstResult);
  });

  test("Previous returns to the prior page's result set", async ({
    searchPage,
    schemeListingPage,
  }) => {
    await searchPage.open();
    const firstPageFirstResult = await schemeListingPage.schemeNameAt(0);

    await schemeListingPage.goToNextPage();
    await schemeListingPage.goToPreviousPage();

    const backOnFirstPageResult = await schemeListingPage.schemeNameAt(0);
    expect(backOnFirstPageResult).toBe(firstPageFirstResult);
  });

  test('jumping directly to page 3 shows a result set consistent with two Next clicks', async ({
    searchPage,
    schemeListingPage,
  }) => {
    await searchPage.open();
    await schemeListingPage.goToNextPage();
    await schemeListingPage.goToNextPage();
    const viaNextClicks = await schemeListingPage.schemeNameAt(0);

    await searchPage.open();
    await schemeListingPage.goToPage(3);
    const viaDirectJump = await schemeListingPage.schemeNameAt(0);

    expect(viaDirectJump).toBe(viaNextClicks);
  });
});
