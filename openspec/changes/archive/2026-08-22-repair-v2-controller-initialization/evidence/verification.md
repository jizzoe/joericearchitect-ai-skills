# Verification evidence

Reviewed implementation base: `7e989ab2` on
`repair/v2-controller-initialization`, before the implementation commit.

## Requirements mapping

| Requirement | Evidence |
|---|---|
| One typed controller-first initializer | The controller derives a deterministic controller/parent/work-unit/claim identity, persists a schema-5 pending checkpoint, admits the exact v2 bundle, then writes an admitted binding. Focused success and resume tests pass. |
| Safe interruption and recovery | The injected-admission-stop test leaves a non-operational pending checkpoint, creates no v2 claim, and rejects phase, resource, and queue mutations. |
| Exact conflict protection | Existing checkpoint, authorization, expiry, repository, provider, legacy, and active-admission conflicts return a pause without changing unrelated durable state. |
| Installed runtime and canonical skills | The declared `initialize-v2-delivery` runtime verb dispatches through the wrapper; both canonical lifecycle skills name it and generated adapters remain thin. |
| Plain-English future handoff | The workflow, foundation operations, lifecycle guide, blocker register, and roadmap state that the released runtime must be installed before a separately authorized M1-S2 repair starts through the initializer. |

## Checks

- Focused admission/controller/runtime contract suite: 13 passed, 0 failed.
- Full SDD Node suite: 198 passed, 0 failed.
- Validation Node suite: 42 passed, 0 failed.
- Runtime Node suite: 66 passed, 0 failed.
- Runtime-completeness evaluation: 3 passed, 0 failed.
- `node scripts/validation/validate-skill-metadata.mjs`: passed.
- `node scripts/validation/validate-shared-guardrails.mjs`: passed.
- `node scripts/validation/validate-runtime-references.mjs`: passed.
- `node scripts/sdd/check-adapter-drift.mjs`: valid with no issues.
- `openspec validate --all --strict`: 39 passed, 0 failed.
- `git diff --check`: passed.
- Secret-pattern scan of changed files: no credential-shaped values found.

The runtime tests intentionally exercise non-Git temporary directories. Their
expected classification checks print harmless `not a git repository`
diagnostics; all 66 runtime tests passed.

## Review correction

The broad suite first revealed that an old permitted-path fixture had reached
its fixed expiry. The fixture now uses an intentionally distant test-only
expiry, while separate tests retain real expiry rejection. During local review,
the pending-record guard was extended to queue advancement as well as normal
phase and resource mutation. Focused tests and strict validation were rerun
after both corrections.

## Post-Archive handoff

This repair does not start M1-S2. After the implementation, Sync, and Archive
resources are merged, the released runtime must be installed. A newly
authorized `repair-m1-s2-v2-terminalization` run must then call
`initialize-v2-delivery`, reread its durable records, and proceed only from its
first incomplete checkpoint when its controller and v2 admission identities
match exactly.
