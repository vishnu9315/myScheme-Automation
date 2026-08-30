import { test, expect } from '../../fixtures/testFixtures';
import { pageNotFoundHeading } from '../../utils/helpers';

/**
 * Error-handling regression checks for the migration. The malformed-slug
 * raw-error-leak case (MIG-05/DT-21) lives in
 * tests/regression/negative.spec.ts since it isn't migration-specific
 * routing behavior on its own; this file covers the two migration-audit
 * findings that are.
 */
test.describe('Error handling @migration', () => {
  test('an invalid route consistently shows the branded 404, not a framework error page', async ({
    page,
  }) => {
    await page.goto('/this-route-does-not-exist-abc123');

    await expect(pageNotFoundHeading(page)).toBeVisible();
  });

  test('a failed search API response should show a distinct error state, not the zero-results UI (MIG-02)', async ({
    page,
    searchPage,
  }) => {
    // Known, currently-open issue: a real ~61s hang -> HTTP 504 on
    // /api/apisetu/search/schemes was observed rendering the exact same
    // "No Schemes Found!" empty state used for a genuine zero-result
    // search — a user cannot tell "nothing matched" from "the server
    // didn't respond". Reproduced deterministically here via route
    // mocking (rather than waiting on a real backend timeout). This test
    // encodes the desired behavior and is expected to fail until MIG-02
    // is fixed; see BLOCKED_SCENARIOS.md.
    test.fail(true, 'Tracks open defect MIG-02 — see BLOCKED_SCENARIOS.md');

    await page.route('**/api/apisetu/search/schemes**', (route) =>
      route.fulfill({ status: 504, body: 'Gateway Timeout' }),
    );

    await searchPage.open();

    // Desired: a distinct error/retry indicator — not the same copy used
    // for a real empty result set.
    await expect(page.getByText(/something went wrong|try again|unable to load/i)).toBeVisible();
    await expect(searchPage.noResultsMessage).toHaveCount(0);
  });
});
