# Requirements Mapping and Apply Review

Date: 2026-08-13
Change: `add-base-implementation-quality-skills`

## Requirements mapping

| Capability requirement | Implementation | Evidence |
|---|---|---|
| Review activation is bounded and advisory | `skills/base/base-code-review/SKILL.md` and `references/review-contract.md` | Canonical-skill boundary assertions and adversarial source fixtures |
| Findings are evidence-backed, ordered, and independently classified | `scripts/validation/lib/implementation-quality.mjs` finding validator, sorter, and renderer | Valid, misordered, duplicate, unsafe-path, unsupported-severity, and findings-first tests |
| Severity and disposition retain distinct meanings | Canonical review contract and separate validator enums | Independent severity/disposition sort test and material-decision skill assertions |
| Review coverage is proportional and explicit | Canonical review skill coverage list and structured coverage/gap validation | Valid review fixture plus missing-evidence and scenario mapping tests |
| Review results use the shared result contract | Implementation-quality validator delegates to `validateSkillResult` and validates only `details` | Valid and malformed result fixtures and CLI validation |
| Canonical review behavior remains portable | Canonical skill, thin Claude/Codex wrappers, second-workspace fixture | Adapter-drift, wrapper-size, scenario parity, and portability tests |
| Verification starts from explicit behavior and authority | Canonical verification required inputs and `authorizeVerificationOperation` | Exact target, unexpected target, runtime gap, and reserved-operation tests |
| Loop progresses through evidence-gated stages | `verificationStages` and `evaluateVerificationLoop` | Ordered, idempotent, stale-evidence, and completion tests |
| Delivery profiles select proportional evidence | `selectVerificationChecks` and profile reference | Prototype, production, UI, and non-UI selection tests |
| Initial web UI evidence is deterministic | Profile selector and profile reference | Exact `1440x900`, `390x844`, screenshot, interaction, axe-core, and manual-review assertions |
| Missing verification tools fail visibly | Profile selector returns `needs-authorization` or `paused` | Interactive and autonomous missing-prerequisite tests |
| Objective corrections and rereview are bounded | State evaluator plus existing durable local-operation checker | Narrower-budget, three-attempt, stale-binding, and durable correction tests |
| Production readiness retains current strict review gates | `evaluateProductionReadiness` and structured production gate summary | Strict pass, unavailable, malformed, wrong-head, stale CI, non-strict assurance, and self-review tests |
| Verification results are structured and lifecycle-limited | Verification details validator and renderer | Prototype/production results, paused result, readiness-overclaim, and no-delivery-overclaim tests |
| Canonical verification behavior remains portable | Canonical skill, thin wrappers, structured product check definitions | Second-workspace, trusted-argv, adapter-drift, and cross-assistant tests |

All 30 delta-spec scenarios are mapped in
`evals/skills/implementation-quality/scenarios.json` and checked dynamically
against the two delta specs.

## Changed-path review

Reviewed implementation scope:

- canonical skills and progressive references under
  `skills/base/base-code-review/` and `skills/base/base-verification-loop/`;
- four thin wrappers under `.agents/skills/` and `.claude/skills/`;
- `scripts/validation/lib/implementation-quality.mjs` and its CLI;
- implementation-quality fixtures, scenario mapping, requirements map, and
  Node tests under `evals/skills/implementation-quality/`;
- the narrow adapter-drift inventory addition and CI fixture-suite registration;
  and
- this OpenSpec change's planning, task, and evidence files.

Concurrent `add-authorized-degraded-independent-review` and
`add-base-skills-research-and-planning` work remains in the original checkout.
The issue #85 delivery worktree starts from current `origin/main` and excludes
those changes and the original checkout's untracked `tmp/` directory.

## Findings and dispositions

### IQ-R1 — medium / objective-fix

The malformed production-gate branch returned a boolean while its caller
expected `{ valid, ready }`, which could throw instead of returning structured
validation issues. The return shape was made consistent and a malformed-gate
regression test now passes.

### IQ-R2 — medium / objective-fix

Verification-local findings initially reused field validation without enforcing
duplicate IDs or deterministic ordering. The collection now enforces both and a
misordered local-review regression test passes.

### IQ-R3 — low / objective-fix

The first fixture run expected an obsolete correction error code, matched text
across a Markdown line without whitespace tolerance, and treated a duplicated
scenario name as a missing scenario. Expectations were aligned to the current
durable operation checker and occurrence-based scenario coverage; all focused
tests pass.

### IQ-R4 — low / warning

Browser evidence in this repository is synthetic because this change adds
reusable policy and selectors, not a UI product. The fixtures prove exact
viewport, screenshot, interaction, accessibility, and missing-tool selection;
real product invocations must supply Playwright, Chromium, and axe-core evidence
when the skill selects those checks.

### IQ-R5 — low / objective-fix

The strict review package rejected a synthetic credential-shaped fixture even
though it contained no real secret. The fixture now stores only a redacted
placeholder, while the runtime test assembles a synthetic sensitive value from
non-secret-shaped source fragments and still proves that result validation
rejects and omits it.

### IQ-R6 — high / objective-fix

Fresh strict review found that referenced check evidence did not carry a
machine-validated current workspace or commit and changed-path binding. The
verification details contract now requires a unique binding record for every
completed selected-check evidence ID and local-finding evidence reference.
Prototype and production regressions prove stale focused, profile, local-review,
CI, and strict-review evidence cannot support readiness.

### IQ-R7 — high / objective-fix

Fresh strict review found that a latest failed or exhausted correction history
did not affect readiness. The details contract now records a one-to-three
attempt correction budget, prevents readiness while any latest correction is
failed, and requires blocked result status and readiness when a failed signature
reaches its budget. Full-budget and narrower-budget regressions pass.

### IQ-R8 — high / objective-fix

Fresh strict review found that selected-check results could disagree with their
referenced top-level evidence results. Completed checks now require exact result
agreement, and focused regressions reject passed checks backed by failed or
informational evidence.

### IQ-R9 — high / objective-fix

Fresh strict review found that unresolved local findings did not affect
readiness. Every local finding now carries a resolution matched to its
disposition. Corrected objective findings link a current passed correction;
human decisions remain unresolved; false positives retain evidence; warnings
are accepted only as advisory, and blocker/high warnings still prevent
readiness. Focused regressions cover unresolved, corrected, warning, severe
warning, and human-decision states.

### IQ-R10 — high / objective-fix

Fresh strict review found that readiness did not require the complete profile
minimum. Verification details now record explicit non-UI or web UI scope plus
layout and material-change flags. The validator requires focused, critical-flow,
and local-review checks for both profiles; every production minimum; and all
applicable viewport, interaction, screenshot, and accessibility checks. Negative
regressions remove every mandatory check one at a time and fail deterministically.

### IQ-R11 — objective-fix / objective-fix

Fresh strict review found that a corrected finding could cite current but
unrelated evidence. A corrected finding's resolution evidence must now equal
the latest passed correction attempt's evidence set. A regression proves an
unrelated current local-review record cannot substantiate a different
correction.

No blocker, high, human-decision, unresolved objective-fix, or false-positive
finding remains.

## Security and supply chain

- No new dependency, package, executable, network call, credential, or external
  state was introduced.
- Trusted checks require structured argument arrays from invocation or product
  configuration; the validator imports no process-execution API.
- Untrusted check sources, unexpected paths, reserved lifecycle operations,
  runtime permission gaps, secret-like values, credential fields, and explicit
  PII fields fail closed in focused tests.
- Canonical skills link the existing shared guardrails exactly once.
- CI retains read-only permissions and receives only one additional local Node
  fixture suite.

## Portability, attribution, and recovery

The second-workspace fixture uses different relative paths and commands and
contains no repository owner, GitHub URL, absolute machine path, credential, or
product constant. Claude and Codex wrappers point to the same canonical assets.
No third-party code or asset was copied; Playwright, Chromium, and axe-core are
documented interoperability prerequisites only.

Recovery rereads authorization, runtime permission, changed paths, bindings,
evidence, correction records, and the strict-review gate, then resumes at the
first incomplete stage. Rollback removes only new implementation-quality assets
and their narrow validation registrations; shared contracts and independent-
review implementation remain unchanged.

## Current review status

Focused tests after IQ-R1 through IQ-R9: 19 passed, 0 failed. The complete
current-main Node suite passes 187 tests. Syntax checks, whitespace checks,
adapter drift, metadata, guardrail linkage, secret and product-constant scans,
artifact quality, tracking, and selected and repository-wide strict OpenSpec
validation pass. A fresh exact-head strict independent review is the next gate.
