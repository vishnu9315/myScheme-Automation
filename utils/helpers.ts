import type { Page, ConsoleMessage, Locator } from '@playwright/test';

/**
 * The branded 404 heading. Scoped to the heading role specifically because
 * "Page not found." also appears live in two other places on the same
 * page (the `<title>` and Next.js's route-announcer `<p>`), which makes a
 * plain `getByText` match ambiguously (confirmed via a strict-mode
 * violation).
 */
export function pageNotFoundHeading(page: Page): Locator {
  return page.getByRole('heading', { name: /page not found/i });
}

export interface CapturedConsoleError {
  type: 'console' | 'pageerror' | 'requestfailed';
  text: string;
  location?: string;
}

/**
 * Lightweight console/network error collector for the migration suite.
 * Attaches on construction; call getErrors()/getHydrationErrors() at any point.
 *
 * Playwright has no API to remove a single listener by reference across page
 * navigations reliably, so this is meant to be instantiated once per test
 * (a fresh `page` fixture already gives test isolation).
 */
export class ConsoleWatcher {
  private errors: CapturedConsoleError[] = [];

  constructor(private readonly page: Page) {
    this.page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        this.errors.push({ type: 'console', text: msg.text() });
      }
    });

    this.page.on('pageerror', (error: Error) => {
      this.errors.push({ type: 'pageerror', text: error.message });
    });

    this.page.on('requestfailed', (request) => {
      this.errors.push({
        type: 'requestfailed',
        text: `${request.failure()?.errorText ?? 'unknown'} — ${request.method()} ${request.url()}`,
      });
    });
  }

  getErrors(): CapturedConsoleError[] {
    return [...this.errors];
  }

  /**
   * React's minified hydration-mismatch codes. Known/tracked on this app
   * (see BLOCKED_SCENARIOS.md / MIG-03 — Swiper Custom Element vs. hydration
   * race on the homepage carousel). Surfaced separately so tests can report
   * on them without treating every occurrence as a fresh, unexpected defect.
   */
  getHydrationErrors(): CapturedConsoleError[] {
    return this.errors.filter((e) => /react.*#41[8]|#423|hydrat/i.test(e.text));
  }

  /**
   * Errors that are neither known hydration noise nor the environment's
   * documented Cognito/manifest CORS chatter (see DT-20 — infra-level, not
   * application-level). Useful as the primary migration-regression signal.
   */
  getUnexpectedErrors(): CapturedConsoleError[] {
    return this.errors.filter((e) => {
      const isHydration = /react.*#41[8]|#423|hydrat/i.test(e.text);
      const isKnownCognitoNoise = /cognito|manifest\.json|x-frame-options/i.test(e.text);
      return !isHydration && !isKnownCognitoNoise;
    });
  }

  clear(): void {
    this.errors = [];
  }
}

/**
 * Runs an action (a click that changes the result set) while waiting for
 * the underlying search API response it triggers, rather than reading the
 * result count immediately afterward — confirmed live as necessary:
 * clicking Search/a filter/Reset Filters updates the DOM asynchronously,
 * and a plain post-click read can race a still-in-flight request and
 * observe stale content. The endpoint pattern matches the one confirmed
 * in the source migration audit (MIG-02: `/api/apisetu/search/schemes`).
 */
export async function waitForSearchResponse(
  page: Page,
  action: () => Promise<void>,
): Promise<void> {
  const responsePromise = page
    .waitForResponse((res) => res.url().includes('/api/apisetu/search/schemes'), {
      timeout: 20_000,
    })
    .catch(() => null);
  await action();
  await responsePromise;
}

/** Parses "Total 4,946 schemes available" / "Total 4946 schemes available in Hindi" into a number. */
export function parseSchemeCount(text: string): number | null {
  const match = text.replace(/,/g, '').match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

/** Parses a filter option label like "Female (813)" into { label, count }. */
export function parseFilterOption(text: string): { label: string; count: number | null } {
  const match = text.match(/^(.*?)\s*\((\d[\d,]*)\)\s*$/);
  if (!match) {
    return { label: text.trim(), count: null };
  }
  return { label: match[1].trim(), count: Number(match[2].replace(/,/g, '')) };
}
