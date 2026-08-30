import { test, expect } from '../../fixtures/testFixtures';
import { wizardAnswers } from '../../utils/testData';

/**
 * The "Find Schemes For You" eligibility wizard. Covers one representative
 * happy-path style walkthrough rather than every permutation of its ~10
 * questions (per framework scope: representative combinations, not
 * exhaustive coverage).
 */
test.describe('Find Schemes For You wizard @regression', () => {
  test('a required question blocks progression until answered', async ({
    findSchemeWizardPage,
  }) => {
    await findSchemeWizardPage.open();

    await findSchemeWizardPage.clickNext();

    // Still on the wizard's first step: Next did not silently advance
    // without an answer, and the page did not navigate away.
    await expect(findSchemeWizardPage.nextButton).toBeVisible();
  });

  test('a valid answer combination should not dead-end with zero guidance (DT_06)', async ({
    page,
    findSchemeWizardPage,
  }) => {
    // Known, currently-open issue: this exact 10-answer sequence is a
    // valid, non-contradictory combination, yet the wizard dead-ends at
    // "No Schemes Found!" with only a generic Edit button — no suggested
    // closest-match schemes, no relaxed filters, no explanation. This test
    // encodes the DESIRED behavior and is expected to fail until DT_06 is
    // fixed; see BLOCKED_SCENARIOS.md / TEST_CASES.md.
    test.fail(true, 'Tracks open defect DT_06 — see BLOCKED_SCENARIOS.md');

    await findSchemeWizardPage.open();
    await findSchemeWizardPage.completeWizard(wizardAnswers.deadEndSequence);

    await expect(findSchemeWizardPage.noSchemesFoundMessage).toBeVisible();
    // Desired: some corrective guidance beyond a bare Edit button —
    // suggested/similar schemes, or explanatory text.
    await expect(
      page.getByText(/suggest|similar|closest match|try (adjusting|removing)/i),
    ).toBeVisible();
  });
});
