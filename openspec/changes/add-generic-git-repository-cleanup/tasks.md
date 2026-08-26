## 1. Canonical skill and runtime helper

- [ ] 1.1 Add `skills/base/generic-git-repository-cleanup/SKILL.md` describing
  the read-only audit phase and the confirmation-gated apply phase, composing
  existing Git inspection, topic-branch, commit-authoring, and SDD lifecycle
  evidence. Depends on: none.
- [ ] 1.2 Add the runtime helper `scripts/sdd/generic-git-repository-cleanup.mjs`
  with a `--stdin`/`--input` payload wrapper exposing `audit` and (planning-only)
  `apply-plan` operations, and register it in `scripts/runtime/manifest.json`.
  Depends on: 1.1.
- [ ] 1.3 Add thin Claude and Codex discovery adapters under `.claude/skills/`
  and `.agents/skills/` pointing to the canonical skill without duplicating
  policy. Depends on: 1.1.

## 2. Classification and selection

- [ ] 2.1 Implement deterministic retire-eligibility classification (delivered to
  discovered default branch, no active-change claim, non-primary/unlocked/
  registered/clean worktree, no remaining ref). Depends on: 1.2.
- [ ] 2.2 Implement conservative commit-candidate grouping (out-of-scope,
  non-conflicted/non-submodule, no detected secret, common purpose) and the
  unresolved/blocked classifier with evidence gaps. Depends on: 1.2.
- [ ] 2.3 Implement the fresh-reinspection gate and exact Git command adapters
  (worktree-before-branch removal, `-d` vs evidence-gated `-D`, selected-path
  commit, post-commit push check). Depends on: 2.1, 2.2.

## 3. Receipt and configuration discovery

- [ ] 3.1 Implement the durable, non-sensitive receipt in a configurable
  external/Git-metadata location that is not itself a cleanup candidate.
  Depends on: 1.2.
- [ ] 3.2 Implement repository-policy discovery (default branch, remote,
  active-change location, protected-branch rules) from inspected configuration
  or explicit input. Depends on: 1.2.

## 4. Regression coverage

- [ ] 4.1 Add fixtures for squash-merge delivery, stale remote-tracking refs,
  dirty/ambiguous worktrees, secret-like files, and active-change overlap.
  Depends on: 2.1, 2.2, 2.3.
- [ ] 4.2 Add focused tests covering audit non-mutation, retire/commit/unresolved
  classification, fresh-reinspection, and least-destructive apply ordering.
  Depends on: 4.1.

## 5. Verification evidence

- [ ] 5.1 Map every delta requirement scenario to implementation and test
  evidence, run a bounded local review, and run formal OpenSpec Verify.
  Depends on: 4.2.
- [ ] 5.2 Run `openspec validate --all --strict`, inspect the final diff for
  scope and secrets, and record local delivery evidence. Depends on: 5.1.

## 6. Owner-approved resolution deltas (2026-08-25)

- [ ] 6.1 Implement conditional remote-branch deletion: a retire-eligible local
  branch's remote counterpart is deleted only after its changes are proven
  merged to the remote default branch; otherwise the remote branch is left
  intact and reported. Depends on: 2.1, 2.3.
- [ ] 6.2 Implement the spec/non-spec direct-commit split: spec-governed content
  (OpenSpec changes/specs and governed skills/scripts/schemas/workflow docs)
  routes through a topic branch, while non-spec files (design briefs, research,
  notes) may commit directly to the default branch. Depends on: 2.2, 2.3.
- [ ] 6.3 Add regression coverage for remote-merge gating and the spec/non-spec
  split. Depends on: 6.1, 6.2.
