import { test, expect } from '../../fixtures/testFixtures';
import { invalidRoutes } from '../../utils/testData';
import { pageNotFoundHeading } from '../../utils/helpers';

test.describe('Negative scenarios @regression', () => {
  test('an invalid top-level route shows the branded 404 page', async ({ page }) => {
    await page.goto(invalidRoutes.nonExistentPage);

    await expect(pageNotFoundHeading(page)).toBeVisible();
  });

  test('a non-existent scheme slug shows the branded 404 page', async ({ page }) => {
    await page.goto(invalidRoutes.nonExistentScheme);

    await expect(pageNotFoundHeading(page)).toBeVisible();
  });

  test('a malformed (encoded-slash) scheme slug should show the branded 404, not a raw backend error (DT-21)', async ({
    page,
  }) => {
    // Known, currently-open issue: this input class renders the raw string
    // "Request failed with status code 403" inside normal site chrome
    // instead of the branded 404 used for an ordinary invalid slug. This
    // test encodes the desired behavior and is expected to fail until
    // DT-21/MIG-05 is fixed; see BLOCKED_SCENARIOS.md.
    test.fail(true, 'Tracks open defect DT-21 / MIG-05 — see BLOCKED_SCENARIOS.md');

    await page.goto(invalidRoutes.malformedSlugEncodedSlash);

    await expect(pageNotFoundHeading(page)).toBeVisible();
    await expect(page.getByText(/status code 403/i)).toHaveCount(0);
  });
});
