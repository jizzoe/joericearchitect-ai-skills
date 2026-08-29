# Design Brief: Owner-Approved Explore → Propose Transition

Date: 2026-08-25
Status: Direction approved (owner, 2026-08-25). Open questions resolved; ready
for Propose.

## 1. Problem and desired outcome

During M4-S4 run #2, the autonomous runner resolved a change's open design
questions unilaterally — it wrote "recommended resolutions" into `design.md` and
proceeded straight to implementation. The source design brief had marked those
resolutions **"pending owner confirmation"**, but the runner treated its own
recommendations as settled decisions. The owner never saw the questions, never
approved the recommendations, and never supplied answers.

Desired outcome: **Explore may freely think through open questions and produce
recommendations, but the lifecycle must not enter Propose (planning) until the
owner has explicitly either (a) approved the runner's recommendations or
(b) supplied the answers — and that approval is durably recorded.** This applies
to every production and every prototype run.

## 2. Evidence and key findings

- `skills/base/autonomous-goal-runner/references/human-decision-classification.md`
  already lists "missing or conflicting requirement … or governance decision" as
  a pause condition, but it does not explicitly bind the Explore → Propose
  transition to owner-approved open-question resolutions.
- `skills/base/autonomous-goal-runner/references/authorization-policy.md`
  requires "resolved product and governance decisions" before proceeding
  (Effective Authorization Check, item 4), but the Explore output is not
  enforced as a governance-decision boundary.
- `skills/base/autonomous-sdd-lifecycle/SKILL.md` step 4 runs Explore or Propose
  without a required owner-approval checkpoint for open-question resolutions.
- Run #2 is the concrete failure: open questions auto-resolved, then the strict
  reviewer repeatedly rejected the resulting unapproved decisions (protected
  branch policy, commit-grouping purpose, receipt location, active-work
  ownership contract).

## 3. Requirements

1. **Explore may run with open questions.** Its output must, for each open
   question, present: (a) the question in official terminology/jargon; (b) a
   clear plain-English translation and explanation; (c) the candidate options
   with pros, cons, and tradeoffs for each; and (d) the runner's recommendation.
2. **Propose is blocked until every open question is explicitly resolved** by
   the owner — either approving the runner's recommendation or providing the
   answer — and that resolution is durably recorded (in the OpenSpec change
   artifacts and/or the controller record).
3. **No opt-out.** The rule applies to all production and all prototype runs.

## 4. Options considered and tradeoffs

### Option A — Enforce in the canonical lifecycle skill + a dedicated reference (recommended)

Add an explicit "Explore → Propose owner-approval gate" to the canonical
`autonomous-sdd-lifecycle` skill and a new
`autonomous-goal-runner/references/open-question-resolution.md` that defines the
presentation contract and the approval/recording rule. Small, single owner, and
immediately discoverable by both assistants through the thin adapters.

Tradeoff: the rule lives in prose; it is enforced by the runner following it,
not by a machine-checkable gate.

### Option B — Also add a machine-checkable living-spec requirement (SELECTED — owner, 2026-08-25)

In addition to Option A, add a `bounded-autonomous-execution` (or new) spec
delta stating that Propose SHALL NOT proceed with unapproved open questions, so
strict `openspec validate` and the strict reviewer can cite a testable
requirement.

Tradeoff: more work, but the rule becomes durable policy with scenarios the
reviewer can check, rather than only prose guidance.

### Option C — Encode in the controller/admission machinery

Add a hard controller-level gate that refuses the Propose transition unless a
durable "open-question resolution" record exists.

Tradeoff: strongest guarantee, but significantly more machinery and migration
work; likely overkill for v1.

## 5. Scope, non-goals, constraints

- In scope: the Explore → Propose boundary for all runs; the presentation
  contract (jargon + plain English + options + tradeoffs + recommendation); the
  durable recording requirement.
- Non-goals: changing Explore itself, changing review/verify/delivery gates, or
  changing how issues/Projects are handled.
- Constraint: the rule must be owner-visible and must not be bypassable by a
  prototype profile.

## 6. Decisions (owner, 2026-08-25)

- **Option B selected — "all of the above."** The guardrail will be added in
  all four places: (1) the canonical `autonomous-sdd-lifecycle` skill at the
  Explore/Propose step, (2) the `human-decision-classification.md` "Pause For
  Human Decision" list, (3) a new `open-question-resolution.md` reference
  defining the presentation + approval + recording contract, and (4) a
  machine-checkable living-spec requirement.
- **Recording location** (confirmed — owner, 2026-08-25): the OpenSpec change's
  `design.md` "Open-question resolutions" section, each marked `owner-approved`
  with a reference, plus a note in the controller record.

## 7. Recommended next step

Owner authorizes Propose (once change #2 is also recorded, both can be delivered
as one or two OpenSpec changes). No implementation begins before the owner
approves.
