# Ship-SDD Design-Brief Goal Trigger

Date: 2026-08-18
Status: Owner-directed; ready for OpenSpec Explore or Propose. This brief does
not itself change the current request parser or runtime behavior.

## 1. Problem and desired outcome

The delivered autonomous prototype flow has a complete `ship-sdd` shorthand,
but its deterministic parser currently accepts only a change name or ordered
queue:

```text
ship-sdd <change-or-ordered-queue> <prod|prototype> [duration]
```

That syntax makes the caller translate a design brief into an OpenSpec change
name before starting the Goal. Related planning also exposes the internal
authorization-profile name `sdd-delivery`, which can be mistaken for another
permission statement the owner must repeat.

The desired owner experience is one self-contained command:

```text
/goal propose and implement <design-brief-path>. ship-sdd, rapid prototype, expire in 4h
```

That command alone must resolve the exact design brief, derive and validate its
change name, select bounded autonomous `prototype-rapid`, apply the complete
normal SDD lifecycle authorization bundle, and continue without routine human
approval pauses until terminal evidence proves the change closed and its
exact-owned resources cleaned. The caller must not enumerate every lifecycle
operation or restate a separate mutation-authorization paragraph.

## 2. Evidence and key findings

- The delivered [frictionless prototype brief](autonomous-prototype-frictionless-quality-loop.md)
  already removes routine Plan-to-Apply and Verified-to-Close prompts while
  retaining continuous quality work, correction, evidence, and stopping
  conditions.
- The [concise SDD request contract](../../skills/base/autonomous-goal-runner/references/sdd-delivery-request.md)
  already defines the complete lifecycle authorization bundle, but exposes
  `sdd-delivery` as an internal profile name and requires an explicit change or
  queue target.
- The [request resolver](../../scripts/sdd/resolve-sdd-delivery-request.mjs)
  already maps `ship-sdd <change> prototype 4h` to autonomous
  `prototype-rapid`, `same-session-local`, a four-hour expiration, no blocking
  approval gates, required quality actions, terminal evidence predicates, and
  bounded lifecycle mutations.
- The [SDD workflow](../../docs/sdd-workflow.md) defines `ship-sdd` as complete
  bounded delivery and distinguishes it from standalone Propose, Apply,
  Verify, Sync, and Archive actions.
- The [Goal prerequisites plan](../plans/codex-goal-autonomy-prerequisites-implementation-plan.md)
  correctly separates runtime permission from workflow authorization, but its
  PRE-6 rehearsal wording still asks for a verbose external-mutation statement.
  That wording conflicts with the desired named-bundle experience and should
  be superseded for resolved `ship-sdd` requests.
- `/goal` supplies long-running execution semantics; it does not by itself
  create host credentials, widen the sandbox, or override repository policy.
  The combined recognized command supplies the bounded workflow grant, while
  active host permissions remain an independent prerequisite.

## 3. Options considered and tradeoffs

1. **Add deterministic design-brief normalization to `ship-sdd`.** This is
   recommended. It preserves the existing lifecycle controller and presets
   while making the owner's design brief the exact source and target.
2. **Require the existing change-name syntax.** This needs no implementation,
   but fails the requested experience and forces the owner to perform naming
   and authorization translation manually.
3. **Accept unrestricted natural-language Goal requests.** This is flexible,
   but risks inferring the wrong brief, target, profile, or mutation boundary.
   A canonical sentence with deterministic field extraction is safer.
4. **Rename the internal `authorizationProfile` value immediately.** This
   makes every layer say `ship-sdd`, but unnecessarily invalidates durable
   authorization digests and admitted-run state. The public command should
   change now; an internal schema rename, if useful, should be a separate
   versioned migration.

## 4. Decisions, assumptions, and decision owner

### Owner-directed decisions

Decision owner: Joe Rice

1. The canonical design-brief trigger is:

   ```text
   /goal propose and implement <design-brief-path>. ship-sdd, rapid prototype, expire in 4h
   ```

2. That trigger alone selects bounded autonomous prototype delivery and
   supplies the complete normal SDD lifecycle authorization bundle. The owner
   does not enumerate its individual permitted operations.
3. `ship-sdd` replaces `sdd-delivery` as the user-facing term. Existing
   internal compatibility identifiers may remain versioned implementation
   details and must not be required in the prompt.
4. The run continues through proposal, implementation, verification, delivery,
   Sync, Archive, closure, and exact-owned cleanup without routine approval
   pauses. It stops only when a defined stopping condition prevents safe,
   truthful, authorized continuation.

Decision evidence:

- Approved by: Joe Rice
- Approved at: `2026-08-18T21:19:51.000Z`
- Decision SHA-256: `3021d2f13c2849e6e7cdcebd72d68f96c62269b43a15f9578f56776d78769ce1`
- Digest input: decision owner, the four ordered decisions above, and the
  recommendation in section 7.

### Meaning of `ship-sdd`

`ship-sdd` means **complete and converge one bounded Specification-Driven
Development lifecycle**. For a design-brief-sourced prototype request, it is a
user-facing command verb and named authorization bundle with this expansion:

```text
resolve exact brief and repository
  -> derive and validate change name
  -> capture brief provenance
  -> create or reuse linked issue and Project item when configured
  -> Propose and perform planning review
  -> Apply with continuous tests and bounded correction
  -> same-session local review and formal Verify
  -> implementation PR and merge
  -> Sync living specifications by PR and merge
  -> Archive by PR and merge
  -> close the issue and set Project state to Done
  -> remove only confirmed merged, change-owned branches/worktrees
  -> prove no required owned state remains
```

`ship` does not mean deploy or release software to an environment. The bundle
does not authorize deployments, releases, credential or permission changes,
secret access, force pushes, unrelated external messages or records, unsafe or
destructive workarounds, or cleanup without exact ownership and delivery
evidence.

### Deterministic normalization

The canonical trigger must normalize to the same effective authorization as:

```text
/goal ship-sdd <derived-change-name> prototype 4h
```

The runtime must:

- require one exact workspace-relative Markdown design-brief path;
- verify that the path exists inside the configured design-brief root;
- derive the candidate change name from the filename without `.md`;
- require that the derived name satisfies the OpenSpec kebab-case identifier
  contract and does not conflict with another active or archived change;
- bind the exact source path and digest as proposal provenance;
- resolve `rapid prototype` to `prototype-rapid` plus
  `reviewPolicy: same-session-local`;
- resolve `ship-sdd` to autonomous mode and the complete bounded SDD lifecycle
  bundle;
- resolve `expire in 4h` from the Goal start time;
- persist and report the normalized effective authorization before mutation;
- resume a matching existing change, or create its proposal when it does not
  yet exist; and
- reject missing, ambiguous, conflicting, outside-workspace, or changed inputs
  instead of guessing.

### Pause semantics

The trigger removes routine conversational approvals; it does not suppress
stopping conditions. The run performs bounded diagnosis and self-correction
first, then pauses with durable evidence when continuation would require a
material product decision, unavailable authority or runtime permission, an
unsafe or excluded action, correction beyond its budget, resolution of stale
or conflicting state, recovery from an unrepairable external failure, or work
beyond the expiration. These conditions are terminal intervention needs for
the current run, not ordinary approval checkpoints.

### Assumptions

- The current repository is the target repository unless the command names a
  different authorized repository explicitly.
- Repository configuration supplies applicable GitHub repository, Project,
  default branch, labels, and lifecycle conventions without putting
  product-specific constants into reusable global assets.
- The Goal session already has the required host profile, sandbox, network,
  credentials, and tools. The command creates no platform permission.
- Existing admitted runs retain their stored schema, authorization digest, and
  user-facing input record.

## 5. Scope, non-goals, constraints, dependencies, and risks

### Scope

- Add the canonical design-brief trigger and deterministic normalization.
- Treat `ship-sdd` as the sole required user-facing lifecycle-bundle name.
- Bind the exact design brief and derived change name before any mutation.
- Expand the shorthand into the existing prototype preset, lifecycle
  operations, quality actions, evidence predicates, correction policy,
  exclusions, and stopping rules.
- Update the request resolver, canonical skill guidance, living specifications,
  Goal prerequisites plan, user documentation, and deterministic tests.
- Replace the PRE-6 verbose per-run mutation statement with evidence that the
  owner selected a resolved, unexpired `ship-sdd` bundle. Preserve a separate
  first-live rehearsal of host permissions and recovery behavior.

Acceptance evidence must prove:

1. The exact canonical sentence resolves without clarification when its brief
   exists, its derived change name is valid, and runtime prerequisites pass.
2. The resulting effective authorization equals the existing canonical
   `ship-sdd <change> prototype 4h` authorization.
3. No separate `sdd-delivery` input or lifecycle-operation enumeration is
   requested from the owner.
4. A missing, ambiguous, invalid, conflicting, or out-of-scope brief pauses
   before mutation with one actionable explanation.
5. Propose begins when the derived change is absent; a matching durable change
   resumes from its first incomplete evidenced checkpoint.
6. Routine Plan-to-Apply, issue-publication, correction/rereview, and
   Verified-to-Close prompts do not appear when exact bindings and host
   permission remain current.
7. Completion remains impossible until delivery, Sync, Archive, issue/Project
   convergence, and exact-owned cleanup evidence are current.
8. Existing change-name `ship-sdd` syntax and admitted-run recovery remain
   compatible.

### Non-goals

- Making `/goal` alone a permission change.
- Treating ordinary natural language as permission when the canonical fields
  cannot be resolved deterministically.
- Renaming stored authorization-profile values without a versioned migration.
- Weakening evidence, review, validation, safety, expiration, correction, or
  ownership requirements.
- Deploying, releasing, changing credentials, widening access, or mutating
  unrelated records.
- Changing `production-rapid` assurance or owner-checkpointed behavior.

### Constraints and dependencies

- The existing `ship-sdd` resolver, selected-entry controller, prototype
  quality loop, lifecycle reconciliation, and exact-owned cleanup remain the
  implementation foundation.
- Authorization, runtime permission, evidence, and stopping decisions remain
  separate controls.
- The brief path and provenance digest must be bound before issue, OpenSpec,
  branch, or GitHub mutation.
- Reusable canonical behavior remains under `skills/base`; assistant wrappers
  remain thin.
- Governed implementation must pass focused resolver and lifecycle tests plus
  `openspec validate --all --strict`.

### Risks

- **Natural-language drift:** punctuation or synonyms could bypass the
  deterministic parser. Publish one canonical form and explicitly test allowed
  variations.
- **Wrong target derivation:** two briefs or historical changes could map to
  the same name. Fail closed on collision and never choose by modification
  time.
- **Authorization/permission confusion:** the shorthand could be described as
  granting host access. Always report that it authorizes workflow operations
  only within current platform permission.
- **`ship` could imply deployment:** keep deployment and release explicitly
  excluded from the definition and effective authorization.
- **Compatibility break:** an eager internal rename could invalidate durable
  state. Keep compatibility identifiers or migrate them explicitly by schema
  version.

## 6. Open questions and blocking decisions

No owner decision blocks OpenSpec Explore.

Implementation should settle two non-product details without widening the
contract:

1. Which harmless punctuation and case variants of the canonical sentence are
   accepted before normalization?
2. Whether the current internal `authorizationProfile: sdd-delivery` value is
   retained indefinitely or deprecated through a later schema migration. It
   must not remain a user-required prompt term either way.

## 7. Recommended next step

Proceed to OpenSpec Explore, then Propose one bounded change that implements
deterministic design-brief-trigger normalization and aligns the Goal
prerequisites plan. Preserve the existing lifecycle kernel and map the new
sentence to the already implemented `ship-sdd` prototype authorization rather
than creating a second delivery controller or a broader permission model.
