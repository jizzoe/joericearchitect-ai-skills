# M3-S3 Explore Output — Exact-Head Review and Correction

Date: 2026-08-24
Change: `bind-autonomous-review-to-code-head`
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Context

M3-S3 binds review and bounded correction to the exact Apply evidence, package,
artifacts, assurance contract, and code head, so closeout can reuse exact-head
assurance without re-reviewing unchanged code, while any review-relevant change
invalidates and forces fresh exact-head rereview. M3-S2 (admission + dispatcher)
is delivered/archived; this slice's hard dependency is satisfied.

## Open question resolutions (owner-confirmed 2026-08-24)

### Review-reuse policy — Option C (exact-head reuse)
Review binds to the exact code head plus a defined invalidation set. Reuse is
allowed for closeout while the set is unchanged; any change invalidates and
requires fresh exact-head rereview. This is neither "review every transition"
nor "review once per run."

### Q1 — Review-relevant invalidation set
A review SHALL be invalidated by any change to:

1. the sealed package digest;
2. the exact code head;
3. the artifact manifest digest;
4. the Apply-evidence digest;
5. the findings-dispositions digest;
6. the policy-gate digest; and
7. the reviewer identity or assurance level.

### Q2 — Closeout reuse boundary (non-code)
Merge, Sync, Archive, cleanup, issue-close, and project-done MAY reuse the
review when the head and the Q1 set are unchanged. Sync/Archive move spec/docs/
metadata, NOT production code, so they do NOT invalidate.

### Correction budget — reuse the existing budget
The correction budget is `correctionBudgetPerFailureSignature` (default 3, only
narrowable, enforced in `check-operation-authorization.mjs`, `checkpoint.mjs`,
and the `bounded-autonomous-execution` / `sdd-lifecycle` living specs). M3-S3
adds only the binding rule: each objective correction changes the head,
invalidates the prior review, and requires a fresh exact-head rereview; the
existing 3-try ceiling bounds the re-reviews, and an exhausted signature blocks
rather than resets.

## Authorization

Explore is planning-only. Implementation requires a new exact owner
authorization; delivery runs in the pre-v2/interactive lane (v2 controller stays
not activated).
