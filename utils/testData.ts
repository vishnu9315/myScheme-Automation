/**
 * Synthetic test data only. No real personal information.
 * Scheme names/slugs below are public government scheme identifiers
 * observed on dev.myscheme.gov.in during manual exploration — not
 * user data.
 */

export const knownSchemes = {
  /** Agnipath Yojana — stable, well-populated scheme detail page used across suites. */
  agnipath: { slug: 'ay', name: 'Agnipath Yojana' },
  /** Odia-translated scheme, used for locale/dynamic-route checks. */
  nreis: { slug: 'nreis' },
};

export const searchTerms = {
  exactSchemeName: 'Chhattisgarh Yuva Suchna Kranti Yojana',
  /** The app documents quoted input as its exact-match syntax. */
  exactSchemeNameQuoted: '"Chhattisgarh Yuva Suchna Kranti Yojana"',
  partial: 'Agnipath',
  common: 'scholarship',
  nonsense: 'zzzznonexistentschemequery12345',
  whitespaceOnly: '   ',
};

/**
 * State/UT is a free-text/typeahead select box rather than a checkbox
 * list (confirmed live — see pages/FilterPanel.ts), so the second
 * filter-combination dimension uses Scheme Category instead, which — like
 * Gender — is a real checkbox-list group.
 */
export const filters = {
  gender: { group: 'Gender', option: 'Female' },
  category: { group: 'Scheme Category', option: 'Women and Child' },
};

export const invalidRoutes = {
  nonExistentScheme: '/schemes/this-scheme-does-not-exist-xyz123',
  /** Encoded-slash traversal-style slug — known to leak a raw error (DT-21/MIG-05) instead of the branded 404. */
  malformedSlugEncodedSlash: '/schemes/ay%2F..%2F..%2Fetc%2Fpasswd',
  nonExistentPage: '/this-page-does-not-exist-xyz123',
};

export const locales = {
  english: { prefix: '', code: 'en', label: 'English' },
  hindi: { prefix: '/hi', code: 'hi', label: 'Hindi' },
  odia: { prefix: '/or', code: 'or', label: 'Odia' },
};

export const footerRoutes = [
  '/about',
  '/faqs',
  '/contact',
  '/screen-reader',
  '/accessibility-statement',
  '/disclaimer',
  '/terms-conditions',
] as const;

/**
 * "Find Schemes For You" wizard answer sequences. Both are representative
 * (not exhaustive) combinations manually verified in prior QA passes —
 * not every permutation of the wizard's ~10 questions.
 */
export const wizardAnswers = {
  /** A broad, general-eligibility combination expected to surface results. */
  broadEligibility: ['Male', '30', 'Delhi', 'Urban', 'General'],

  /**
   * The exact 10-answer sequence from DT_06/TC-016: a valid, non-contradictory
   * combination that nonetheless dead-ends at "No Schemes Found!" with no
   * suggested alternatives, relaxed filters, or corrective guidance.
   */
  deadEndSequence: ['Male', '30', 'Delhi', 'Urban', 'General', 'No', 'No', 'No', 'Employed', 'Yes'],
};
