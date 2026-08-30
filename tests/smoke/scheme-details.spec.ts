import { test, expect } from '../../fixtures/testFixtures';
import { knownSchemes } from '../../utils/testData';

test.describe('Scheme details @smoke', () => {
  test('a known scheme detail page loads with its name and core sections', async ({
    schemeDetailsPage,
  }) => {
    await schemeDetailsPage.open(knownSchemes.agnipath.slug);

    await expect(schemeDetailsPage.schemeTitle).toContainText(knownSchemes.agnipath.name);
    await expect(schemeDetailsPage.sectionHeading('Details')).toBeVisible();
    await expect(schemeDetailsPage.sectionHeading('Eligibility')).toBeVisible();
    await expect(schemeDetailsPage.sectionHeading('Benefits')).toBeVisible();
  });
});
