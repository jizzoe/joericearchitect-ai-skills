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

### IQ-R12 — objective-fix / objective-fix

Fresh strict review found that required checks could report `not-applicable`
without the scope reason promised by the design, including checks derived as
applicable by the selected profile. Selected checks now accept an applicability
reason only for `not-applicable`, require that reason to be non-empty, and
prevent any derived profile or UI minimum from using `not-applicable` to support
readiness. Regressions cover an unjustified common check, a reasoned but still
applicable UI check, and reasoned browser evidence that is genuinely outside an
explicit non-UI scope.

### IQ-R13 — objective-fix / objective-fix

Fresh strict review found that the verification helper supplied both aggregate
and per-failure-signature correction counts while the shared operation checker
enforced only the aggregate count. Objective-correction authorization now
requires a named failure signature and a non-negative per-signature count,
rejects a missing or aggregate-lower-than-per-signature count, and applies the
three-attempt ceiling only to the named signature. Asymmetric regressions prove
that an exhausted signature is rejected while a fresh signature remains
authorized after three aggregate attempts.

### IQ-R14 — high / objective-fix

Fresh strict review found that objective-correction authorization enforced a
hard-coded ceiling but ignored a lower budget in the exact authorization. The
operation checker now requires a configured integer budget from one through
three and blocks when the named signature count reaches that budget. Focused
regressions cover budgets of one and two plus invalid configuration.

### IQ-R15 — objective-fix / objective-fix

Fresh strict review found that check selection required axe-core for any UI even
though the requirement applies it only to new or materially changed UI. The
selector now always requires Playwright and Chromium for UI and conditionally
requires axe-core for material UI. A regression proves non-material UI is ready
without axe-core while retaining browser and interaction checks.

### IQ-R16 — objective-fix / objective-fix

Fresh strict review found that the compact loop state treated any final-budget
attempt as exhausted even when it passed. Per-signature loop state now includes
the attempt count and latest result. Only a failed attempt at the budget (or any
count beyond it) blocks; a passed final permitted attempt continues normally.
Regressions cover passed, failed, and malformed final-attempt state.

### IQ-R17 — objective-fix / objective-fix

Fresh strict review found that generic passed evidence could satisfy the
production CI gate. Production-gate details now require `exact-head-ci`
provenance and a CI head equal to the production head, while the referenced
top-level evidence must be validation evidence. Adversarial regressions reject
review evidence, a different CI head, and a non-CI source.

### IQ-R18 — objective-fix / objective-fix

Fresh strict review found that every preserved correction attempt was required
to match the final current binding. Correction evidence is now checked against
the binding recorded by its own attempt, while only the latest passed attempt
for each signature must bind to current evidence for readiness. A regression
proves that a failed old-head attempt followed by a passed current-head attempt
is valid and that falsifying the historical binding is rejected.

### IQ-R19 — high / objective-fix

Fresh strict review found that readiness accepted an empty or partial
`reviewedPaths` set despite requiring local review of changed implementation.
Readiness now requires the unique reviewed-path set to cover every changed path.
Focused regressions reject empty, partial, stale-path, and duplicate review
coverage.

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

Focused tests after IQ-R1 through IQ-R19: 23 passed, 0 failed. The complete
current-main Node suite passes 191 tests. Syntax checks, whitespace checks,
adapter drift, metadata, guardrail linkage, secret and product-constant scans,
artifact quality, tracking, and selected and repository-wide strict OpenSpec
validation pass. A fresh exact-head strict independent review is the next gate.
