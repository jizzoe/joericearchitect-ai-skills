## 1. Recovery-policy contract

- [x] 1.1 Add the exact Codex strict artifact-missing unavailable code to the
  configured recoverable-failure set and normalize its sealed strict precursor
  without changing any other launcher.
- [x] 1.2 Update the isolated-review recovery guidance to distinguish this
  `authorized-degraded` path from strict-only behavior.

## 2. Verification

- [x] 2.1 Add deterministic preflight coverage for the exact artifact-missing
  code and canonical precursor, proving it preserves the existing sealed
  recovery bindings.
- [x] 2.2 Add regression coverage proving a nearby unsupported strict
  unavailable code creates neither a degraded view nor launch request.
- [x] 2.3 Run the focused independent-review suites, strict OpenSpec
  validation, security/portability/attribution review, and current-head review
  evidence.
