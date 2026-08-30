# MyScheme QA Automation Framework

A production-style UI automation framework for **MyScheme** (`dev.myscheme.gov.in`), built with **Playwright + TypeScript**.

## Overview

MyScheme is a Government of India portal for discovering welfare and benefit schemes — featuring keyword search, eligibility filters, detailed scheme views, an eligibility wizard, and DigiLocker authentication handoff.

This framework automates critical user journeys using the Page Object Model (POM), custom Playwright fixtures, and isolated test suites:
- **Smoke Suite (`@smoke`):** Fast, critical-path sanity checks.
- **Regression Suite (`@regression`):** Broad functional test coverage across discovery, navigation, forms, and error states.
- **Migration Suite (`@migration`):** Targeted regression tests for Next.js 12 to 16 platform upgrade risks (routing, hydration, query parameters, locale handling, error rendering).

## Technology Stack

| Tool | Purpose |
|---|---|
| **TypeScript** | Strict static typing for test logic and page objects |
| **Playwright Test** | End-to-end browser automation, parallel execution, trace recording, and reporting |
| **Node.js / npm** | Package management and execution runtime |
| **ESLint + Prettier** | Code style consistency and Playwright-specific linting |
| **GitHub Actions** | CI pipelines for smoke, regression, and migration runs |

## Architecture

```
Playwright Test Runner
      ↓
Test Suites (Smoke / Regression / Migration)
      ↓
Fixtures (fixtures/testFixtures.ts)
      ↓
Page Objects (pages/*.ts)
      ↓
Utilities & Helpers (utils/*.ts)
      ↓
Target App (dev.myscheme.gov.in)
      ↓
HTML Reports & Failure Artifacts (Screenshots, Videos, Traces)
```

## Project Structure

```
myscheme-ui-automation/
├── tests/
│   ├── smoke/          # Fast, critical-path checks (@smoke)
│   ├── regression/     # Full functional coverage (@regression)
│   └── migration/      # Next.js 12→16 regression suite (@migration)
├── pages/               # Page Object Model classes
├── fixtures/            # Custom test fixtures wiring page objects
├── utils/                # Network helpers, wait utilities, test data
├── global-setup.ts       # Single-sign-on handling for environment gate
├── .github/workflows/    # CI workflow definitions
└── playwright.config.ts  # Playwright configuration
```

## Test Coverage

| Functional Area | Target Suite |
|---|---|
| Login & DigiLocker Handoff | regression |
| Search (Exact, Partial, Empty, Invalid) | smoke, regression |
| Scheme Filters (Single, Combined, Reset) | regression |
| Scheme Result Grid Validation | regression |
| Scheme Details (Content, Sections, Bookmarks, Share) | smoke, regression |
| Global Navigation (Header, Footer, Theme, Locale) | regression |
| Dynamic Routing (Deep Linking, Refresh, New Tab) | regression, migration |
| Pagination Controls | regression |
| Eligibility Wizard ("Find Schemes For You") | regression |
| Negative Scenarios & Error Pages (404/500 Handling) | regression, migration |
| Next.js Migration (Hydration, Query String Sync) | migration |

### Known Defect Tracking (`test.fail()`)

Known open issues in the target environment are tracked using Playwright's native `test.fail()` annotation. These tests run as expected failures and will immediately alert the pipeline once the underlying bug is fixed:

| Test | Defect Tracked |
|---|---|
| `regression/forms.spec.ts` | Wizard dead-ends at zero results without corrective guidance |
| `regression/negative.spec.ts` | Malformed URL slugs expose backend stack traces instead of 404 views |
| `migration/query-params.spec.ts` | Search and filter states lack two-way URL query synchronization |
| `migration/locale-routing.spec.ts` | Root path visits persist previous non-English locale selections unexpectedly |
| `migration/error-handling.spec.ts` | Search API 504 gateway timeouts render indistinguishably from zero-result searches |
| `migration/static-resources.spec.ts` | Partner logo assets resolve to placeholder images |

## Browser Support

- **Chromium** (Default CI target)
- **Firefox** (`npm run test:firefox`)
- **WebKit** (`npm run test:webkit`)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
# Clone the repository and install dependencies
npm install

# Download required browser binaries
npx playwright install

# Configure environment variables
cp .env.example .env
```

### Environment Configuration

Configure the following variables in `.env`:

| Variable | Description | Default |
|---|---|---|
| `BASE_URL` | Base URL of the environment under test | `https://dev.myscheme.gov.in` |
| `HEADLESS` | Run tests in headless mode (`true` / `false`) | `true` |
| `ENV_GATE_USERNAME` | Cognito access gate username | *(required for dev)* |
| `ENV_GATE_PASSWORD` | Cognito access gate password | *(required for dev)* |

## Authentication Setup

The development deployment uses an AWS Cognito Hosted UI gate in front of the application:

- `global-setup.ts` authenticates once per run using `ENV_GATE_USERNAME` and `ENV_GATE_PASSWORD`.
- The authenticated state is saved to `.auth/` and reused across test workers to prevent repeated login overhead.
- DigiLocker authentication handoff is validated at the redirect level; downstream OTP authentication is mocked or isolated from automated functional suites.

## Test Execution

```bash
# Run all tests across configured browsers
npm test

# Run specific suites by tag
npm run test:smoke
npm run test:regression
npm run test:migration

# Interactive & Debugging modes
npm run test:ui           # Playwright UI Mode
npm run test:debug        # Playwright Inspector step-through
npm run test:headed       # Run tests with visible browser window

# Project-specific runs
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Code quality & reporting
npm run lint              # Static analysis
npm run typecheck         # TypeScript verification
npm run report            # View latest HTML test report
```

## CI/CD Integration

Automated pipelines are configured via GitHub Actions in `.github/workflows/`:

- **`smoke.yml`:** Triggers on pull requests and pushes to `main`. Runs `@smoke` against Chromium and captures failure artifacts.
- **`regression.yml`:** Manual dispatch (`workflow_dispatch`) for full regression runs across Chromium, Firefox, and WebKit.
- **`migration.yml`:** Targeted validation for framework and Next.js upgrade checks.

## Locators Strategy

Where `data-testid` attributes are absent, locators follow standard user-facing priority:
1. Role-based accessible queries (`page.getByRole(...)`)
2. Form-associated labels (`page.getByLabel(...)`)
3. Placeholder attributes (`page.getByPlaceholder(...)`)
4. Explicit, documented CSS/XPath fallbacks encapsulated within Page Objects
