# MyScheme QA Automation Framework

A focused, production-style UI automation framework for **MyScheme**
(`dev.myscheme.gov.in`), built with **Playwright + TypeScript**. Built as a
QA Automation / SDET portfolio project — prioritizing reliability and honest,
verifiable coverage over test-count padding.

## Overview

MyScheme is a Government of India portal for discovering welfare/benefit
schemes — search, eligibility filters, scheme detail pages, an eligibility
wizard, and DigiLocker-based Sign In. It recently migrated from Next.js 12
to Next.js 16, which is exactly the kind of change that can quietly break
routing and hydration behavior without any application code changing.

This framework automates the highest-value user journeys — search,
filters, scheme discovery, scheme detail content, navigation, dynamic
routes, pagination, forms — using a Page Object Model, typed fixtures, and
tagged test suites runnable independently in CI, plus a dedicated suite
targeting the Next.js 12→16 migration risk specifically (routing,
hydration, query-parameter handling, locale redirection, static-resource
delivery, error-state rendering — not a repeat of the general functional
suite with a different label).

It does **not** try to automate everything. Scenarios that are genuinely
un-automatable (Aadhaar/OTP login), currently unreachable (a feature with
no UI trigger), or would be flaky by nature (a client-side timing race) are
documented with a reason and a recommended approach instead of faked — see
"Blocked & Partially-Automated Scenarios" below.

## Technology Stack

| Tool | Purpose |
|---|---|
| TypeScript | Strict-mode, statically typed test & framework code |
| Playwright + Playwright Test | Browser automation, test runner, tracing, reporting |
| Node.js / npm | Runtime & package management |
| ESLint (flat config) + `eslint-plugin-playwright` | Static analysis & Playwright-specific lint rules |
| Prettier | Formatting |
| GitHub Actions | CI: smoke on PR/push, regression & migration on demand |

No Selenium, Java, TestNG, or REST Assured — API testing lives in a
separate project.

## Why Playwright

Built-in auto-waiting removes most flake sources outright (locators retry
actionability checks automatically instead of needing manual `sleep`
calls), first-class trace/video/screenshot capture makes failures
debuggable without extra plumbing, one API surface covers Chromium/Firefox/
WebKit, and TypeScript support is first-class rather than bolted on.

## Architecture

```
Playwright Test
      ↓
Test Suites (smoke / regression / migration)
      ↓
Fixtures (fixtures/testFixtures.ts)
      ↓
Page Objects (pages/*.ts)
      ↓
Utilities / Test Data (utils/*.ts)
      ↓
MyScheme (dev.myscheme.gov.in)
      ↓
Reports / Evidence (HTML report, screenshots, video, traces)
      ↓
GitHub Actions
```

Each layer only talks to the layer directly below it — a test file never
contains a raw locator for something the app shows; it always goes through
a Page Object, so a markup change usually means fixing one file, not every
test that touches it.

## Project Structure

```
myscheme-ui-automation/
├── tests/
│   ├── smoke/          # Fast, critical-path checks (@smoke)
│   ├── regression/     # Full functional coverage (@regression)
│   └── migration/      # Next.js 12→16 regression suite (@migration)
├── pages/               # Page Object Model
├── fixtures/            # Custom Playwright fixtures wiring Page Objects
├── utils/                # Console/error monitor, test data, parsing helpers
├── global-setup.ts       # Logs into the environment-gate once, before any test
├── .github/workflows/    # smoke / regression / migration CI pipelines
└── playwright.config.ts
```

## Test Coverage

| Area | Suite(s) |
|---|---|
| Login (DigiLocker handoff) | regression |
| Search (exact/partial/empty/invalid) | smoke, regression |
| Filters (single, combined, clear) | regression |
| Scheme results validation | regression |
| Scheme details (sections, share, bookmark) | smoke, regression |
| Navigation (header/footer/theme/locale/back-forward) | regression |
| Dynamic routes (deep link/refresh/new tab) | regression, migration |
| Pagination | regression |
| Forms ("Find Schemes For You" wizard) | regression |
| Negative scenarios (404s, malformed routes) | regression |
| Next.js migration regression | migration |
| Console/hydration error monitoring | migration |

66 tests across 19 spec files, organized into smoke (6), regression (42),
and migration (18) suites.

### Known-defect tests (`test.fail()`)

Several tests intentionally encode the **desired** behavior for a
currently-open application defect and are marked with Playwright's
`test.fail()`, so they report as passing (an expected failure) today and
will loudly flip to an unexpected pass — forcing the annotation's removal —
the day the underlying bug is fixed. This keeps a known bug tracked as a
living, executable spec instead of silently ignored:

| Test | What it tracks |
|---|---|
| `regression/forms.spec.ts` → wizard dead-end guidance | The "Find Schemes For You" wizard can dead-end at zero results with no suggested alternatives or corrective guidance |
| `regression/negative.spec.ts` → malformed slug 404 | A specific encoded-slash scheme URL leaks a raw backend error instead of the branded 404 |
| `migration/query-params.spec.ts` → 3 tests | Search/filter state has no URL query-string contract at all (can't be deep-linked, refreshed, or bookmarked) |
| `migration/locale-routing.spec.ts` → bare-URL locale | A locale-neutral URL can silently render a previously-selected non-English language |
| `migration/error-handling.spec.ts` → 504 error state | A failed search API response renders identically to a genuine zero-result search |
| `migration/static-resources.spec.ts` → footer icons | 7 footer partner-logo icons are stuck on a placeholder image |

## Browser Coverage

Chromium, Firefox, and WebKit are all configured in `playwright.config.ts`.
Chromium is the primary CI suite (smoke-on-PR); Firefox/WebKit are
available via `npm run test:firefox` / `npm run test:webkit` as additional
regression coverage.

## Reporting

Playwright's built-in HTML reporter (`playwright-report/`) shows pass/fail/
skipped status, duration, browser project, and — on failure — a screenshot,
a video, and (on retry) a trace, per test. Run `npm run report` to open the
most recent report locally.

## Setup

```bash
npm install
npx playwright install        # downloads browser binaries
cp .env.example .env          # then fill in the values below
```

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `BASE_URL` | Environment under test | `https://dev.myscheme.gov.in` |
| `HEADLESS` | `true`/`false` — run browsers headed or headless | `true` |
| `ENV_GATE_USERNAME` / `ENV_GATE_PASSWORD` | Credentials for the environment-wide login gate in front of the dev environment (see "Authentication" below) | *(empty)* |
| `TEST_USERNAME` / `TEST_PASSWORD` | Reserved for a future DigiLocker test identity provider — unused today | *(empty)* |

Never commit a real `.env` — it's git-ignored, along with the saved login
session (`.auth/`).

## Authentication

Two separate logins exist here:

- **The dev environment's own access gate** — an AWS Cognito Hosted UI
  login screen in front of the entire environment, unrelated to the
  application itself. `global-setup.ts` signs in once per test run using
  `ENV_GATE_USERNAME`/`ENV_GATE_PASSWORD` and persists the session via
  Playwright's `storageState`, so individual tests never perform this
  login themselves. If those variables are unset, tests fail clearly at
  the gate (with a screenshot) instead of this setup step failing
  obscurely.
- **The application's own "Sign In"** hands off entirely to DigiLocker
  (Aadhaar + OTP/PIN) — see "Blocked & Partially-Automated Scenarios"
  below.

## Running Tests

```bash
npm test                  # full suite, all configured browsers
npm run test:smoke        # @smoke only
npm run test:regression   # @regression only
npm run test:migration    # @migration only
npm run test:headed       # run with a visible browser window
npm run test:debug        # Playwright Inspector, step through a test
npm run test:ui           # Playwright's interactive UI mode
npm run test:chromium     # Chromium project only
npm run test:firefox      # Firefox project only
npm run test:webkit       # WebKit project only
npm run test:list         # list all discoverable tests without running them
npm run lint              # ESLint
npm run format            # Prettier --write
npm run typecheck         # tsc --noEmit
npm run report            # open the last HTML report
```

## Debugging

- `npm run test:debug` opens the Playwright Inspector for step-through
  debugging.
- `npm run test:ui` opens Playwright's UI mode (time-travel through actions,
  pick locators, watch mode).
- A failed run's `playwright-report/` includes a screenshot, a video, and —
  on retry — a full trace viewable with `npx playwright show-trace <file>`.

## CI/CD

Three workflows under `.github/workflows/`:

- **smoke.yml** — runs on every PR and push to `main`: install, lint, `@smoke`
  tests, uploads the HTML report as an artifact on failure.
- **regression.yml** — manual (`workflow_dispatch`): runs `@regression`
  across all three browser projects, uploads the report.
- **migration.yml** — manual (`workflow_dispatch`): runs `@migration`,
  uploads the report.

Credentials are passed via GitHub Secrets (`BASE_URL`, `ENV_GATE_USERNAME`,
`ENV_GATE_PASSWORD`) — nothing sensitive is logged or committed.

## Current Environment Status *(read this before running against `dev`)*

This is a portfolio project and this section is deliberately literal about
what was and wasn't verified, and when:

- This dev environment sits behind an AWS Cognito Hosted UI login screen on
  *every* route — see "Authentication" above for how this framework
  handles it.
- With valid gate credentials, the full suite was run **live** against the
  real application. This surfaced real, live-only findings no static
  analysis could have caught, all fixed in this codebase:
  - The scheme-detail page's "tabs" turned out to be plain `<h3>` section
    headings, not ARIA tabs.
  - Several header controls (the homepage search entry point, the
    language switcher, the footer links) needed locator corrections once
    checked against the live DOM — each documented inline in the relevant
    Page Object.
  - A genuine race condition in this framework's own code: several Page
    Object methods returned before the app's async search/filter response
    had come back, so an immediate `.count()`/`.innerText()` read (which,
    unlike `expect(...).toBeVisible()`, doesn't auto-retry) could observe
    stale or empty content. Fixed via `utils/helpers.ts` →
    `waitForSearchResponse`, applied everywhere a result set changes.
  - The dev environment itself showed load-sensitivity under concurrent
    automated access (an intermittent empty `<main>`, one observed HTTP
    429, and the login gate itself becoming briefly unreachable
    immediately after a full-suite run) — the same *class* of issue as a
    real ~61-second API hang observed once during manual exploration.
  - Clicking a filter checkbox's row was intermittently intercepted by
    what appears to be a sticky group-header label in the filter panel's
    own scroll context — real mouse clicks (with or without Playwright's
    `force` option, which still dispatches at real screen coordinates)
    could land on the wrong element; toggling via keyboard (focus + Space)
    sidesteps coordinate-based hit-testing entirely and was confirmed
    reliable.
  - The "Total N schemes available" header text has a second, entirely
    different wording — "We found N schemes based on your preferences" —
    once a checkbox filter is applied, versus a keyword search (which
    keeps the "Total" wording); both are now matched.
  - **Final results:** `@smoke` — **6/6 passing, live, clean.**
    `@regression` — **42/42 passing, live, clean** (40 fully green plus 2
    `test.fail()`-tracked known defects correctly still failing their
    inner assertion as designed). Getting there took three live
    iterations, each fixing exactly what that run's own evidence showed,
    never a guess.
  - **Still outstanding:** `@migration` (18 tests) has not been run live
    yet — every attempt immediately after a full smoke+regression pass hit
    the same rate-limiting/login-gate symptom described above. Its
    assertions follow the same patterns already validated live in
    `@regression`, so it's expected to need at most minor follow-up fixes,
    not a rewrite — but that is an expectation, not an observed result.
- **What to do if you're picking this up next:** `@smoke` and
  `@regression` should pass as-is (6/6 + 42/42, confirmed). Run
  `npm run test:migration -- --workers=2` first, separately from the
  others, and treat whatever it finds as this framework's real first live
  migration data — not yet claimed as "should be fine."

## Known Locator Limitations

MyScheme ships no `data-testid` attributes. Locators are built, in order of
preference, from: `getByRole` + accessible name, `getByLabel`,
`getByPlaceholder`, and — only where nothing else is unique — a documented
attribute selector (e.g. the header logo link is matched by `a[href="/"]`
because both the myScheme logo and the Digital India Corporation logo share
the same generic `aria-label="Action Button"`). Every such fallback is
commented in place in the relevant Page Object rather than left unexplained.

## Blocked & Partially-Automated Scenarios

Not everything can or should be automated. Rather than fake it or skip
silently, each of these is a deliberate, documented decision:

| Scenario | Status | Why |
|---|---|---|
| Full DigiLocker (Aadhaar/OTP) login | Blocked | Requires a real Aadhaar-linked account + live OTP; no test identity provider exists. Only the redirect itself is verified (`regression/login.spec.ts`). |
| Logout / authenticated session behavior | Blocked | Depends entirely on completing the login above. |
| "Check Eligibility" questionnaire drawer | Blocked | The drawer exists in the DOM but nothing on the page currently opens it — there's no reachable trigger to automate, not a testing gap. |
| Gender pre-selection race in the eligibility wizard | Partially automatable | Reproduces intermittently (~40% of loads) — a hard pass/fail assertion on a probabilistic bug would itself be flaky. A statistical-sampling approach across N runs is the defensible alternative, kept out of the default suite. |
| Cross-browser (Firefox/WebKit) verification | Partially automatable | Configured and every spec runs unmodified on all three, but only Chromium has had a live-observed run so far. |
| Scheme feedback/star-rating submission | Partially automatable | Blocked by a backend CORS misconfiguration that silently drops the request — asserting "no success message" would be a weak, backend-dependent check that breaks the moment infra fixes it. |
| MyScheme AI chatbot | Partially automatable | Loads and is reachable, but automating a third-party conversational widget's responses is a different, less stable kind of test than this framework's structural UI checks. |
| `/dashboard` embedded Power BI report | Out of scope | Third-party iframe content with nothing MyScheme-controlled to target — only the Dashboard *link* itself is covered. |

## Future Improvements

- Extend `global-setup.ts` to also handle a DigiLocker test identity once
  one becomes available, using the same `storageState` pattern.
- Add the statistical-sampling check for the gender pre-selection race as
  an optional, separately-tagged suite rather than part of the default run.
- Get `@migration`'s first live run, and expand cross-browser coverage
  from "configured" to "observed" on Firefox/WebKit.

## Interview Talking Points

**30-second version:** "I built a Playwright + TypeScript UI automation
framework for MyScheme, a government scheme-discovery portal that recently
migrated from Next.js 12 to 16. It covers search, filters, scheme details,
navigation, and forms with 66 tests split into smoke/regression/migration
suites, plus a dedicated migration-regression suite that targets exactly
what a Next.js major-version bump changes. A few tests intentionally track
currently-open application defects using `test.fail()`, so they'll flip
green automatically the day those bugs get fixed."

The single best concrete story from building this: a live verification run
found the entire dev environment gated behind a login screen unrelated to
the app itself. After getting credentials, running the suite live for the
first time surfaced real bugs — some in the app's actual markup versus
this framework's assumptions, one a genuine race condition in this
framework's own code — each fixed from that run's own evidence, not a
guess, across three iterations to a clean 42/42 regression result.
