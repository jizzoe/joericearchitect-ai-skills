# Scoped work-unit context orchestration

Date: 2026-08-17

Status: Evidence-derived recommendation based on the owner's stated desire for
smaller task contexts. Detailed enforcement choices remain unapproved.

## 1. Problem and desired outcome

An autonomous lifecycle phase can be too broad for one model context. A large
context lets requirements, implementation choices, verification, and prior
self-assessment blur together; prompt instructions alone cannot prove that one
role avoided another role's files or that a handoff used current evidence.

The desired outcome is to express coherent tasks as typed work units. Each unit
receives a sealed minimal package, a fresh context when reasoning is needed, a
narrow tool/write boundary, and a structured result. Evidence—not chat memory
or “done”—unlocks dependent units. Independent review becomes the strongest
assurance profile on the same graph, not the only task that can benefit from a
separate context.

## 2. Evidence and key findings

- The superseded [combined runtime/work-unit brief](archived/autonomy/autonomous-sdd-durable-execution-and-isolated-work-units.md)
  established the domain objects and a concrete tests-first graph.
- The [harness landscape](../research/autonomous-agent-harness-landscape-2026/findings.md)
  supports prompt chaining, orchestrator-worker patterns, bounded tools, and
  computational verification before inferential review.
- Current [independent-review requirements](../../openspec/specs/isolated-independent-review/spec.md)
  already prove that sealed packages, fresh actors, pinned views, immutable
  results, and exact-head lineage can be enforced for one specialized unit.
- The current repository does not yet define a general work-unit schema,
  context attestation, per-unit write-set enforcement, or dependency
  invalidation graph.

## 3. Options considered and tradeoffs

1. **Ask one context to role-play every phase.** Low overhead, but no enforced
   context, authority, or artifact separation.
2. **Launch a new agent for every small action.** Strong fragmentation, but
   high latency and incoherent evidence boundaries.
3. **Use typed work units at meaningful objective/evidence boundaries.** Adds
   explicit packaging and validation while keeping deterministic commands out
   of unnecessary model contexts. This is recommended.

## 4. Recommended design

A `WorkUnitDefinition` contains a stable ID/type/role/objective; prerequisite
units and evidence; immutable input references/digests; context and actor
separation policy; allowed tools, commands, network, and mutation classes;
read/write/forbidden paths; result and evidence schemas; completion predicate;
freshness/invalidation triggers; retry budget; outcome dispositions; and
interruption reconciliation.

A sealed `WorkPackage` carries only the objective, exact artifact references,
base/head identities, constraints, permitted operations, result location, and
digest. It excludes prior transcripts. An `ExecutionAttempt` records the
context/actor identity, applied capability profile, package digest, derived
authority, source state, and validated outcome.

Use three separation levels:

| Profile | Guarantee | Typical use |
| --- | --- | --- |
| `fresh-scoped` | New context, sealed package, narrow capabilities/write set, structured result; same provider is allowed. | Test authoring, implementation, documentation, migration, focused research. |
| `producer-separated` | Fresh-scoped plus a different attempt and no authority to validate or approve its own output. | Tests versus implementation, implementation versus verification, competing analyses. |
| `independent-assurance` | Distinct reviewer identity, pinned read-only view, immutable exact-head package, no implementation authority, durable result contract. | Production independent review and other explicitly high-assurance judgments. |

### Tests-first vertical slice

```text
requirements snapshot
        |
        v
 author-tests -- red evidence + test digest --> implement
       ^                                          |
       | test-contract-challenge                  | exact head
       +------------------------------------------+
                                                  v
                                             verify-green
                                                  |
                                      exact-head green evidence
                                                  v
                                      independent-review
                                      when profile requires it
```

- `author-tests` may write only declared test-owned paths. It produces a test
  manifest/digest, command, and red evidence proving the target behavior fails
  for the expected reason against the base implementation.
- `implement` receives the immutable test package and may write only production
  paths. It proves the test digest is unchanged. A defective or underspecified
  test produces `test-contract-challenge`; it never authorizes a silent test
  edit.
- `verify-green` is source-read-only. It executes the declared verification
  plan against the exact implementation head and test digest, proves source
  cleanliness, and returns structured results. It cannot fix what it evaluates.
- `independent-review`, when required, consumes the current Apply and verifier
  evidence but retains the existing distinct-actor, pinned-view, and read-only
  assurance boundary.

A requirements, test, implementation-head, command, configuration, or policy
digest change invalidates all dependent evidence and selects the earliest
affected unit. Red and green evidence must describe the target behavior;
unrelated baseline failures or an unbound passing suite do not satisfy a gate.

Start serially. Parallel work is permitted only for read-only units or units
with proven disjoint worktrees/write sets, explicit merge ownership, and
complete invalidation rules. This same model can later isolate documentation,
migration, security analysis, focused investigation, and correction work.

## 5. Scope, non-goals, constraints, dependencies, and risks

The first scope is the work-unit/package/attempt/evidence schema, context
dispatch attestation, deterministic mutation validation, serial tests-first
graph, invalidation, restart reconciliation, and integration with current
independent review.

It does not claim that a fresh context is independent review, create an agent
for every command, permit one unit to silently edit another unit's artifacts,
or introduce arbitrary parallel writers or cross-repository scheduling.

Packages and receipts must remain secret-free and treat requirements, source,
test output, review output, and external content as untrusted data. Every write
requires run authorization, runtime permission, and the unit's narrower
capability. The largest risks are hidden context inheritance, prompt-only write
sets, weak tests, excessive context cost, and invalid evidence reuse; require
platform attestation, sandbox/diff enforcement, requirement-bound red evidence,
coherent unit sizing, and digest-derived invalidation.

## 6. Open questions and blocking decisions

- Confirm that implementation contexts cannot edit test-owned files and must
  use `test-contract-challenge`.
- Define what Claude and Codex must attest to prove fresh context and applied
  permissions; a context ID alone may be insufficient.
- Select sandbox enforcement, detached-worktree post-run diff rejection, or a
  combination for the first write-set boundary.
- Decide which other task graphs merit first-class templates after the
  tests-first slice is proven.

## 7. Recommended next step

Refine and approve the serial tests-first vertical slice before generalizing
the graph. Its acceptance evidence should include red-before-implementation,
immutable tests during implementation, exact-head green verification,
invalidation after every relevant input change, interrupt/resume, concurrent
runner refusal, and consumption by the current review contract.
