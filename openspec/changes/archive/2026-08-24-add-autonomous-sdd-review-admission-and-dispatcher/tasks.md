## 1. Admission module

- [x] 1.1 Create `scripts/sdd/autonomous-sdd-review-admission.mjs` with a pure `admitReviewReadiness` entry that returns one typed result over the strict host-captured transport
- [x] 1.2 Implement the mandatory capability checks (exact adapter identity, parent transport, detached view, multi-step artifact path, inspection capability, runtime permission, deadline budget, cleanup destination) each with a distinct typed failure code
- [x] 1.3 Implement the exact-head-bound, time-bounded freshness window (`observedAt` + TTL hard-capped by the run deadline, consumed once per admission-to-Apply transition)

## 2. Dispatcher module

- [x] 2.1 Create `scripts/sdd/autonomous-sdd-review-dispatcher.mjs` owning launch, receipt consumption, transport recovery, classification, allowed degraded eligibility, and terminal evidence
- [x] 2.2 Implement typed-code classification (never transcript/stdout/repository content) and exact resume/pause on mid-run reviewer loss
- [x] 2.3 Implement degraded eligibility only under a separately valid authorization, and the inspection-environment fallback only on a typed inspection-capability/environment failure

## 3. Integration

- [x] 3.1 Wire `scripts/sdd/autonomous-sdd-vertical-slice.mjs` `thinReviewLoop` to route the production review step through admission plus the dispatcher (new `reviewDispatch` callback), leaving the prototype path unchanged

## 4. Tests

- [x] 4.1 Add focused admission tests: each missing capability fails closed; a genuine multi-step probe passes; a `command -v`-only check is not evidence; head/manifest change and expired TTL invalidate
- [x] 4.2 Add focused dispatcher tests: single owner (no competing path); typed classification; degraded eligibility only under valid policy; fallback only on typed semantic-tool insufficiency; exact resume/pause on reviewer loss

## 5. Verification

- [x] 5.1 Run the focused admission/dispatcher test files and the full `scripts/sdd/test` suite
- [x] 5.2 Run `openspec validate --all --strict` and confirm the new delta validates

