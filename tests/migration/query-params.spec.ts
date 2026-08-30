import { test, expect } from '../../fixtures/testFixtures';
import { pageNotFoundHeading } from '../../utils/helpers';

/**
 * Query-string / URL-state contract for /search. This is the single
 * highest-risk area surfaced by the migration audit (MIG-01/DT-13, High):
 * Next.js's routing APIs for reading/writing query state changed materially
 * between the Pages Router runtime in Next 12 and Next 16, and this app's
 * `router.query`/shallow-routing wiring appears to have been dropped
 * entirely — the UI works, but the URL and the UI have no relationship in
 * either direction.
 */
test.describe('Query parameters @migration', () => {
  test('a foreign/unknown query parameter is preserved without crashing the page', async ({
    page,
  }) => {
    await page.goto('/search?utm_source=qa-automation');

    expect(page.url()).toContain('utm_source=qa-automation');
    await expect(pageNotFoundHeading(page)).toHaveCount(0);
  });

  test('a manually-added ?q= parameter should filter the search results (MIG-01)', async ({
    page,
    searchPage,
  }) => {
    test.fail(true, 'Tracks open defect MIG-01 / DT-13 — see BLOCKED_SCENARIOS.md');

    await page.goto('/search?q=Agnipath');

    const total = await searchPage.getTotalCount();
    expect(total).not.toBeNull();
    // Desired: the query-scoped result set should be a small, filtered
    // subset — not the full unfiltered catalog.
    expect(total as number).toBeLessThan(100);
  });

  test('typing a search in the UI should be reflected in the URL (MIG-01)', async ({
    page,
    searchPage,
  }) => {
    test.fail(true, 'Tracks open defect MIG-01 / DT-13 — see BLOCKED_SCENARIOS.md');

    await searchPage.open();
    await searchPage.search('Agnipath');

    expect(page.url()).toMatch(/[?&]q=/);
  });

  test('search/filter state does not survive a page refresh (MIG-01)', async ({
    page,
    searchPage,
  }) => {
    test.fail(true, 'Tracks open defect MIG-01 / DT-13 — see BLOCKED_SCENARIOS.md');

    await searchPage.open();
    await searchPage.search('Agnipath');
    const filteredCount = await searchPage.getTotalCount();

    await page.reload();
    const afterRefreshCount = await searchPage.getTotalCount();

    expect(afterRefreshCount).toBe(filteredCount);
  });
});
