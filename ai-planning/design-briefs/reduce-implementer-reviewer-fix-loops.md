# Design Brief: Reduce Implementer–Reviewer Fix Loops

Date: 2026-08-25
Status: Direction approved (owner, 2026-08-25). Open questions resolved; ready
for Propose.

## 1. Problem and desired outcome

During M4-S4 run #2, the implementer and the strict reviewer looped ~11 times,
exhausting the per-signature correction budget and failing closed. The goal is
**not** to end the loop while issues remain — it is to make each round more
comprehensive so genuine issues are flushed out in **fewer** rounds, and the
budget is not consumed by avoidable back-and-forth.

## 2. Evidence and key findings (research)

- **Google eng-practices** ("How to do a code review", "CL author's guide"):
  long-established practices are (a) keeping changes small, (b) reviewing against
  a fixed set of dimensions, and (c) the author self-reviewing before requesting
  review — all to reduce reviewer back-and-forth.
- **Self-Refine (arXiv:2303.17651)**: a single LLM can generate output, critique
  its own output, and refine it iteratively, improving quality ~20% on average
  with no external reviewer. This is the empirical basis for "implementer
  self-review before the reviewer" and for "iterative self-feedback" loops.
- **Root-cause note**: run #2's loop was driven by *unresolved design questions*
  (see the companion brief `explore-to-propose-owner-approval.md`), not by
  reviewer thoroughness. The two changes are complementary: change #1 removes the
  unresolved-decision loops; this change makes the *genuine code-defect* loops
  fewer and cheaper.

## 3. Candidate techniques (organized by prompt / context / token)

### Implementer-side — flush issues before they reach the reviewer
- **T1 Self-review pre-flight.** The implementer runs the *same structured review
  checklist* against its own diff and fixes what it finds before invoking the
  reviewer. (Self-Refine; Google author self-review.)
- **T2 Requirements-traceability pre-flight.** Map every spec requirement +
  scenario to code + test before review; gaps are caught by the implementer.

### Reviewer-side — make each pass comprehensive
- **T3 Structured categorical prompt.** Fixed checklist (security, edge cases,
  error handling, spec compliance, secret handling, concurrency, data integrity,
  portability) with "report ALL findings in EVERY category in one pass."
- **T4 Two-pass review with a completeness prompt.** After the first findings,
  prompt: "re-review the SAME diff for anything you missed; do NOT repeat prior
  findings; be exhaustive." (Matches the owner's example.)
- **T5 Spec-traceability review prompt.** "For each requirement/scenario, verify
  it is satisfied; report every unmet requirement."

### Context & token management
- **T6 Identical review package.** Full spec + design + requirements mapping +
  diff, so implementer and reviewer share the same context (already partially
  exists via `buildReviewPackage`).
- **T7 Machine-checkable acceptance criteria.** Tests + `openspec validate`
  catch mechanical issues, so the reviewer focuses only on what validators
  cannot catch (design, security, edge cases).
- **T8 Focused diffs.** Review only changed files; avoid re-sending unchanged
  context each loop (fewer loops = fewer tokens).

## 4. Options considered and tradeoffs

### Option A — T1 + T3 (self-review pre-flight + structured reviewer prompt)

Smallest, highest-leverage pair. Tradeoff: a single reviewer pass may still miss
a second category of issues.

### Option B — A + T4 (add the reviewer "completeness" second pass)

Directly answers the owner's example; one round becomes two passes without a new
implementer loop. Tradeoff: extra reviewer tokens per round.

### Option C — B + best-of-N (multiple review runs, union findings)

Maximal coverage. Tradeoff: most expensive in tokens; likely overkill for v1.

### Selected approach (owner, 2026-08-25)

Refined Option B: a shared canonical checklist used by both the implementer
self-review and the reviewer; the reviewer applies the checklist plus a
*material-only* freeform pass ("anything else material?"), tags every finding
`material` or `advisory`, and uses the completeness second pass only as an
escalation (see section 7).

## 5. Scope, non-goals, constraints

- In scope: implementer self-review pre-flight, structured/completeness reviewer
  prompts, and (if selected) best-of-N, for all production and prototype runs.
- Non-goals: changing the strict-review *authority* (it remains the gate), or
  weakening the correction budget.
- Constraint: whatever is added must be efficient in prompts, context, and
  tokens.

## 6. Decisions (owner, 2026-08-25)

- **Approach: refined Option B** — shared canonical checklist + the owner's
  "checklist plus material freeform" idea, with the completeness second pass as
  an escalation only (loop contract in section 7).
- **Shared checklist:** yes — one canonical checklist asset used by BOTH the
  implementer self-review and the reviewer, to guarantee alignment.
- **Severity tagging:** the reviewer tags every finding `material` (correctness,
  security, spec violation) or `advisory` (nitpick). Only material findings drive
  the next loop; advisory findings are recorded and non-blocking.
- **Completeness second pass:** part of the single sealed review (same reviewer,
  same package, an explicit second prompt), used only as an escalation — after
  two consecutive rounds still produce material findings.
- **Correction budget:** three materially-different fixes per failure signature,
  then fail-closed pause to the owner. Never silently accept while material
  findings remain.

## 7. The review loop (final contract)

For each round:

1. **Implementer self-review** — run the shared canonical checklist against the
   diff and fix what it finds; in round 2+, also verify the prior fix resolved
   its finding and check for regressions.
2. **Reviewer review** — apply the shared checklist, then a *material-only*
   freeform pass ("anything else material?"); tag every finding `material` or
   `advisory`.
3. **Zero material findings** → the review passes; the loop ends. Advisory
   findings are recorded, non-blocking.
4. **Material findings** → the implementer fixes them and the next round begins.
   - If the same failure signature still has material findings after three
     materially-different fixes → **fail-closed pause to the owner**.
   - Escalation: after two consecutive rounds still produce material findings,
     add the reviewer completeness second pass to the next round.

## 8. Recommended next step

Owner authorizes Propose (the two changes are delivered as one combined OpenSpec
change, `harden-autonomous-sdd-governance-and-review`). No implementation begins
before the owner approves.
