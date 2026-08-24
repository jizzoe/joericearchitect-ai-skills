## 1. Strict transport hardening

- [x] 1.1 Implement deterministic exactly-once terminalization in the host/recovery
  flow (single guarded terminal write keyed by launchId + requestDigest; exit
  before/after result creation each resolve to one terminal record).
- [x] 1.2 Enforce wrong-package rejection via canonical binding validation on
  expectedPackage + base/head.
- [x] 1.3 Extend cleanup to retain an actionable recovery record on unconfirmed
  removal (identity + required cleanup, no review content or secrets).

## 2. Vertical-slice strict review wiring

- [x] 2.1 Route the production-profile review step through the strict host-captured
  transport; prototype keeps same-session-local.
- [x] 2.2 Add focused tests for minimal, large-read, and multi-step reviews.
- [x] 2.3 Add fault-injection tests: exit before/after result, transcript-only,
  wrong-package, cleanup failure, exactly-once terminalization.

## 3. Validation and evidence

- [x] 3.1 Run the focused suite and the full SDD suite; run
  `openspec validate --all --strict`.
- [x] 3.2 Record completion evidence; keep the result contract-only/audit.

