# Base Skills: Implementation Quality

Date: 2026-08-11
Status: Implementation-ready design brief draft. Create an OpenSpec proposal
only after the owner accepts this scope.

## Decision

Create two assistant-neutral canonical skills: `base-code-review` and
`base-verification-loop`. They provide local implementation evidence and do not
replace OpenSpec Verify, CI, or independent review. They depend on the shared
contract defined in `base-skill-contracts-and-guardrails.md`.

## `base-code-review`

### Trigger and Scope

Use to review a bounded code/document/configuration change against relevant
requirements, design, tests, and local conventions. It is advisory and
read-only by default. Do not use it as an approval bypass, a substitute for
tests, or an automatic refactoring tool.

### Inputs

- target repository/workspace and change scope;
- relevant requirement/design/task/brief paths;
- test and validation evidence already available;
- optional risk areas and delivery profile;
- execution mode; autonomous mode is read-only unless a separate authorized
  `local-implementation` correction run is invoked.

### Output

Report findings first, ordered by severity, with file/path evidence, impact,
and corrective recommendation. Then report missing-test/risk gaps, assumptions,
and a concise scope summary. Classify each finding as `objective-fix`,
`human-decision`, `warning`, or `false-positive` with evidence.

The review does not change code. A caller may separately authorize a bounded
objective correction and require a new focused review after the correction.

Findings use both a severity and a disposition. Severity is `blocker`, `high`,
`medium`, or `low`. A blocker prevents the selected verification/delivery
profile from passing; high means likely material correctness, security, or
data-integrity impact; medium is a credible defect/risk needing follow-up; low
is a limited improvement. The independent disposition is `objective-fix`,
`human-decision`, `warning`, or `false-positive`, matching the existing
autonomous-runner review matrix.

### Required Review Areas

- requirements and observable behavior;
- regression and edge-case risk;
- tests/evals and test quality;
- input validation, error handling, data integrity, and recovery;
- secrets, PII, authorization, untrusted input, dependencies, and supply chain;
- portability, configuration ownership, generated artifacts, and unrelated
  changes;
- mobile/web accessibility, responsive layout, and interaction risk when
  applicable.

## `base-verification-loop`

### Trigger and Scope

Use while implementing a bounded change to establish evidence that the chosen
behavior works. Do not use it to silently widen scope, skip a failing check, or
claim OpenSpec completion.

### Inputs

- intended behavior and acceptance evidence;
- failure/reproduction case or identified risk;
- changed paths and test/validation commands;
- delivery profile: `prototype-rapid` or `production-rapid`;
- execution mode and, when autonomous, the approved local implementation
  profile.

### Output

Produce an evidence record covering selected tests, results, browser/device
checks when applicable, reviewed changed paths, unresolved gaps, recovery
steps, and whether the work is ready for OpenSpec Verify or needs another
implementation cycle.

### Required Loop

1. Identify intended observable behavior and smallest reproduction/critical
   path.
2. Select focused deterministic checks and proportional broader checks.
3. Implement only the approved scope.
4. Run focused checks, then the required profile checks.
5. Run code/security review and classify findings.
6. Apply only behavior-preserving objective fixes within the correction budget.
7. Re-run affected evidence and report remaining risk.

Prototype-rapid requires focused unit/integration checks plus one critical
browser/mobile path when a UI exists. Production-rapid adds appropriate
regression coverage, browser/device matrix, repeatability, operational checks,
and stronger release evidence. Both retain guardrails, core data integrity,
and critical-flow verification.

For web-first UI work, the initial contract uses Playwright on Chromium at
desktop `1440x900` and mobile `390x844`. Layout-changing work requires a
current screenshot at each applicable viewport and an interaction assertion for
the critical path. New or materially changed UI also runs axe-core through the
Playwright integration; automated accessibility results do not replace manual
keyboard/semantic review where the change needs it. Native mobile testing is a
later extension, not a hidden first-release requirement.

Evidence is emitted through `skill-result-v1`: each command/test/screenshot/
review has a stable id, type, subject, result, and reference. A production-rapid
change requires CI evidence tied to the exact reviewed commit and an independent
review channel (a separate reviewer agent, non-interactive reviewer, or an
equivalent configured repository control). If those are unavailable, the work
must pause or use the prototype-rapid profile; it cannot claim production-rapid
completion.

Delivery-profile selection does not weaken the shared approval policy. In
interactive `production-rapid` work, merge, merged-topic-branch deletion, and
OpenSpec Archive require just-in-time approval after their evidence gates pass.
A selected `prototype-rapid` one-change delivery may replace only that routine
prompt with an exact, time-bounded preapproval; all target, evidence, recovery,
and runtime-permission gates remain required.

Playwright, Chromium, and axe-core are implementation prerequisites whenever a
UI change requires browser/accessibility evidence. Missing tools never justify
silently skipping required verification. In interactive mode, the skill reports
the missing prerequisite and requests installation or an approved environment;
in autonomous mode it pauses. A prototype-rapid change may omit browser checks
only when it has no UI behavior. A production-rapid UI change is blocked until
the required browser/accessibility evidence is available.

## Evaluation Requirements

Fixture scenarios cover: review trigger/non-trigger, severity ordering,
evidence-backed finding, missing-test report, no-auto-fix default, prototype
critical-path verification, production-profile broader-check selection,
objective correction and retry limit, untrusted content, secret scan, failed
validation pause, and browser/mobile evidence reporting. Use synthetic test
applications and no real user data.

## Implementation Commitments

- None for this design brief. Tool versions and project-specific commands are
  implementation/repository configuration, not reusable policy.
