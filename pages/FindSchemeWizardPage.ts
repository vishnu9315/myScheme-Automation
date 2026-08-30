import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The "Find Schemes For You" multi-step eligibility wizard at /find-scheme:
 * Gender -> Age -> State/Residence -> Category -> Disability -> Minority ->
 * Student -> Employment Status -> Government Employee -> Income -> Submit.
 *
 * Known limitation (DT-16, Medium, intermittent ~40% reproduction): on a
 * fresh load, "Female" is sometimes pre-selected with zero user interaction.
 * Because this is a timing race rather than a deterministic bug, it is
 * intentionally NOT asserted against in the main suite (a hard assertion
 * here would itself be flaky) — see BLOCKED_SCENARIOS.md.
 */
export class FindSchemeWizardPage extends BasePage {
  readonly nextButton: Locator;
  readonly submitButton: Locator;
  readonly editButton: Locator;
  readonly noSchemesFoundMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.nextButton = page.getByRole('button', { name: /^next$/i });
    this.submitButton = page.getByRole('button', { name: /^submit$/i });
    this.editButton = page.getByRole('button', { name: /^edit$/i });
    this.noSchemesFoundMessage = page.getByText(/no schemes found/i);
  }

  async open(): Promise<void> {
    await this.goto('/find-scheme');
  }

  async selectOption(label: string): Promise<void> {
    await this.page.getByRole('radio', { name: label }).check();
  }

  /**
   * Answers whatever control type the current wizard step renders (radio,
   * selectable option/button, or free-text input) with the given value.
   * The wizard's exact control type per question was not confirmed live in
   * this session — this tries the documented options in order rather than
   * assuming one.
   */
  async answerCurrentStep(value: string): Promise<void> {
    const radio = this.page.getByRole('radio', { name: value });
    if ((await radio.count()) > 0) {
      await radio.first().check();
      return;
    }
    const option = this.page.getByRole('option', { name: value });
    if ((await option.count()) > 0) {
      await option.first().click();
      return;
    }
    const selectableButton = this.page.getByRole('button', { name: value, exact: true });
    if ((await selectableButton.count()) > 0) {
      await selectableButton.first().click();
      return;
    }
    const textbox = this.page.getByRole('textbox');
    if ((await textbox.count()) > 0) {
      await textbox.first().fill(value);
      return;
    }
    throw new Error(`No matching control found for wizard answer "${value}"`);
  }

  async isGenderPreSelected(): Promise<boolean> {
    const female = this.page.getByRole('radio', { name: 'Female' });
    return (await female.count()) > 0 && (await female.isChecked());
  }

  async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Clicks Submit if this is the final step, otherwise Next. */
  async proceed(): Promise<void> {
    if (await this.submitButton.isVisible()) {
      await this.submit();
    } else {
      await this.clickNext();
    }
  }

  /** Walks the full wizard, answering each step in sequence, then submits. */
  async completeWizard(answers: readonly string[]): Promise<void> {
    for (const answer of answers) {
      await this.answerCurrentStep(answer);
      await this.proceed();
    }
  }
}
