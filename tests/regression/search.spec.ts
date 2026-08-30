import { test, expect } from '../../fixtures/testFixtures';
import { searchTerms } from '../../utils/testData';

test.describe('Search @regression @search', () => {
  test('partial search narrows the result set below the unfiltered total', async ({
    searchPage,
  }) => {
    await searchPage.open();
    const unfiltered = await searchPage.getTotalCount();

    await searchPage.search(searchTerms.partial);
    await expect(searchPage.totalCountText).toBeVisible();
    const filtered = await searchPage.getTotalCount();

    expect(filtered).not.toBeNull();
    expect(unfiltered).not.toBeNull();
    expect(filtered as number).toBeLessThan(unfiltered as number);
  });

  test('quoted exact-match search returns fewer, more precise results than the unquoted query', async ({
    searchPage,
  }) => {
    await searchPage.open();

    await searchPage.search(searchTerms.exactSchemeName);
    const unquotedCount = await searchPage.getTotalCount();

    await searchPage.open();
    await searchPage.search(searchTerms.exactSchemeNameQuoted);
    const quotedCount = await searchPage.getTotalCount();

    expect(quotedCount).not.toBeNull();
    expect(unquotedCount).not.toBeNull();
    // Documents the app's own exact-match syntax (DT-05): quoting a full
    // scheme name should scope the result set down dramatically compared
    // to the unquoted, word-relevance search.
    expect(quotedCount as number).toBeLessThan(unquotedCount as number);
  });

  test('a nonsense query yields the "No Schemes Found" empty state', async ({ searchPage }) => {
    await searchPage.open();

    await searchPage.search(searchTerms.nonsense);

    await expect(searchPage.noResultsMessage).toBeVisible();
  });

  test('an empty/whitespace-only query falls back to the unfiltered list', async ({
    searchPage,
  }) => {
    await searchPage.open();
    const unfiltered = await searchPage.getTotalCount();

    await searchPage.search(searchTerms.whitespaceOnly);
    const afterWhitespaceSearch = await searchPage.getTotalCount();

    expect(afterWhitespaceSearch).toBe(unfiltered);
  });
});
