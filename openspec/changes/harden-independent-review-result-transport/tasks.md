## 1. Transport diagnostics

- [x] 1.1 Define a safe, deterministic staged diagnostic record for Codex
  parent-result consumption, including artifact presence, byte count, digest,
  parse/payload/validation/binding classification, and cleanup outcome.
  Depends on: none.
  Evidence: `scripts/sdd/platform-review-adapters.mjs` result-artifact inspection and diagnostics.
- [x] 1.2 Refactor the parent consumer to return stable stage-specific
  unavailable codes, retain no raw reviewer output, and preserve the existing
  accepted normalized-result shape. Depends on: 1.1.
  Evidence: `scripts/sdd/platform-review-adapters.mjs` staged unavailable results and focused adapter test.

## 2. Restricted runtime reliability

- [x] 2.1 Provide the minimal platform-owned deterministic command path for
  restricted Codex review inspection without inheriting ambient credentials or
  broad environment state.
  Depends on: none.
  Evidence: deterministic Codex `PATH` test in `scripts/sdd/test/platform-review-adapters.test.mjs`.
- [x] 2.2 Verify final-result handling accepts only the owned final artifact
  and never transcript/stdout or intermediate structured output. Depends on:
  1.2.
  Evidence: transcript/final-artifact mismatch fixture in `scripts/sdd/test/platform-review-adapters.test.mjs`.

## 3. Deterministic evidence

- [x] 3.1 Add focused adapter fixtures for valid final `passed`/`failed`
  artifacts and each artifact, parse, payload, sealing, binding, and cleanup
  failure classification. Depends on: 1.2.
  Evidence: artifact and staged-consumer fixtures in `scripts/sdd/test/platform-review-adapters.test.mjs`.
- [x] 3.2 Add a faithful intermediate-output/final-capture fixture and a
  portable restricted-environment fixture that confirm no credential, network,
  or mutation capability expansion. Depends on: 2.1, 2.2.
  Evidence: focused transport fixture and restricted-environment assertions in `scripts/sdd/test/platform-review-adapters.test.mjs`.

## 4. Verification and delivery evidence

- [x] 4.1 Run focused transport tests, the full Node test suite, adapter drift,
  artifact/tracking validation, `openspec validate harden-independent-review-result-transport --strict`,
  `openspec validate --all --strict`, and whitespace/scope review; record
  non-sensitive results. Depends on: 3.1, 3.2.
  Evidence: all recorded checks passed in `evidence/verification.md`.
- [ ] 4.2 Open the owner-authorized human-reviewed bootstrap PR after local
  validation, clearly linking this change and documenting that the exception is
  limited to this repair; do not waive independent review for
  `add-base-skills-research-and-planning`. Depends on: 4.1.
  Evidence: pending GitHub issue and PR URL.
