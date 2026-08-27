# Batch 4 — runtime distribution, durable dispatch, and bootstrap preparation

## Implemented

- The capture, capsule, and adapter-dispatch entrypoints are declared by the
  runtime manifest with thin wrappers where the reusable contract requires
  one. Runtime build, install, content-verification, wrapper, and active-worktree
  exclusion tests cover their installed distribution.
- One immutable-snapshot resolver allowlists the Codex and Claude adapter IDs
  and binds request construction, strict and authorized-degraded operation,
  launcher recovery, runtime helper and receipt, reviewer class, and accepted
  result. Production dispatch selects only keyed implementations and rejects
  direct or mismatched substitution.
- The canonical protocol now distinguishes the bounded capsule and Codex JSONL
  transport from accepted host-owned findings, specifies terminal-event and
  hard-link publication rules, records the narrow retry policy, and describes
  durable adapter dispatch and the N-1 Claude bootstrap boundary. Claude and
  Codex discovery wrappers remain thin and unchanged.
- Product configuration temporarily selects
  `claude-detached-restricted-v1`. The bootstrap-binding contract binds one
  exact package, transition, review policy, expiry, owner-authorization digest,
  installed N-1 runtime, Claude executable and capability probe, distinct
  implementer and reviewer identities, adapter binding, and recomputed
  prepared worktree lifecycle request. It explicitly excludes candidate Codex
  capture evidence.
- Tracking now inventories every implementation path and records issue #247 as
  the prerequisite that must be merged, archived, and installed before PR #246
  is rebased or reviewed. No PR #246 or paused-controller mutation was made.

## Focused evidence

- Batch 4A runtime distribution: 56 focused tests passed; isolated runtime
  build/install/content verification found no active-worktree import path.
- Batch 4B durable dispatch: 98 focused tests passed after adding explicit
  runtime-helper binding and deep-freezing the nested adapter definition.
- Batch 4C bootstrap/protocol/configuration: 71 focused tests passed for
  bootstrap, dispatch, lifecycle, adapter, orchestration, recovery, and wrapper
  drift. Runtime configuration resolved to the Claude adapter binding.
- `git diff --check` passed.
- `openspec validate --all --strict` passed with 48 items and zero failures.
- Validated local rereviews:
  - `/private/tmp/repair-strict-review-batch-4a-local-review.json`
  - `/private/tmp/repair-strict-review-batch-4b-local-review.json`
  - `/private/tmp/repair-strict-review-batch-4c-local-review.json`

## Review corrections

1. Durable dispatch now binds the exact installed helper and deep-freezes the
   nested receipt-source list.
2. Bootstrap validation compares the expected Claude executable identity rather
   than accepting any shape-valid digest.
3. Bootstrap validation recomputes the complete prepared lifecycle request
   digest instead of trusting digest-shaped fields.
4. Bootstrap records are deeply immutable and bind transition, policy, and
   distinct implementer/reviewer identities before launch.

## Remaining delivery gates

Task 4.1 remains open until the final candidate head is rebuilt and installed
into an isolated target with its exact digest recorded. Task 4.4 remains open
until that final head and its one canonical package produce the durable exact
bootstrap record. Task 4.5 remains open until the read-only PR #246 and paused
controller baseline comparison is repeated immediately before runtime
installation. The real installed-Codex acceptance probe, complete regressions,
OpenSpec Verify, exact-head CI, and N-1 Claude independent review remain Batch 5
gates and are not claimed here.
