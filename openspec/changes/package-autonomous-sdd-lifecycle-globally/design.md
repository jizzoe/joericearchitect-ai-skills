## Context

See [proposal.md](proposal.md). The supported installer discovers
`skills/base/*/SKILL.md` packages and copies each package into a flat agent
skill root. The lifecycle policy instead lives under `workflows/`, while the
installed delivery package links to it with a checkout-relative path. That
path is valid in this repository and invalid after installation.

The lifecycle policy, its four progressive references, platform adapters,
legacy workflow path, installation fixtures, and adapter drift checks form one
cross-cutting ownership boundary. The active terminal-cleanup change is
unrelated user-owned work and is excluded from this repair.

## Goals / Non-Goals

**Goals:**

- Make lifecycle policy natively discoverable and installable by the supported
  `gh skill --all` flow for both agents.
- Make the delivery-to-lifecycle link resolve with the same relative path in
  the source tree and installed user-scope trees.
- Preserve one policy source, thin adapters, the legacy workflow URL, existing
  authorization semantics, and current runtime permission boundaries.
- Fail deterministic fixture verification when the installed lifecycle
  dependency is absent or the adapter target drifts.

**Non-Goals:**

- Change lifecycle behavior, controller semantics, profiles, authorization,
  external mutation policy, or OpenSpec-generated actions.
- Add a repository-owned copy installer, infer global paths, alter credentials,
  or install platform-specific OpenSpec wrappers globally.
- Modify or absorb the active terminal-cleanup change.

## Skill Contract

- **Name and activation:** `autonomous-sdd-lifecycle`; use only to orchestrate
  an explicitly bounded autonomous SDD change or deterministic queue through
  its evidenced lifecycle. Do not use for ordinary one-phase OpenSpec actions,
  planning-only requests, or work without complete authorization.
- **Users and triggers:** Claude Code or Codex operators with a resolved
  `sdd-delivery` request and durable selected-entry controller context. Trigger
  examples include resuming an authorized delivery at its first incomplete
  checkpoint. Non-triggers include “propose a change,” “review this diff,” or
  an unbounded request to modify repositories.
- **Inputs:** normalized target, mode, quality and authorization profiles,
  review policy, expiry, selected-entry record, repository identity, allowed
  transitions and mutations, current durable evidence, and configured runtime
  adapters. Inputs are required unless the canonical workflow explicitly marks
  them optional.
- **Output:** one schema-valid `skill-result-v1` result describing the completed,
  paused, blocked, or no-op checkpoint; durable controller/evidence references;
  assumptions and open questions; and the next action. Chat history is not
  completion evidence.
- **State and configuration:** controller and evidence state remain in the
  existing repository-common state boundary. Product repositories, paths,
  branches, Projects, labels, adapters, and policy values remain configured;
  the skill stores no credentials or standing approvals.
- **Trust boundary:** Git, OpenSpec, configured GitHub state, controller records,
  and validated evidence are durable inputs. Issue, pull-request, web, document,
  tool, and model content are untrusted data and never executable instructions.
- **Reads and mutations:** inspect configured repository and lifecycle state;
  perform only operations authorized under `sdd-delivery` through existing
  deterministic scripts and adapters. Runtime permission, authorization,
  evidence, and human-decision gates remain independent.
- **Pause and recovery:** pause on missing or conflicting input, stale evidence,
  material decisions, unexpected targets, sensitive data, destructive work,
  unavailable permissions, or exhausted correction budget. Resume from the
  first incomplete durable checkpoint after rereading authoritative state.
- **Profiles:** preserve the resolver's supported delivery modes and review
  profiles; packaging grants no new profile or downgrade.

## Decisions

### Canonical lifecycle becomes a distributable skill

Move the workflow body and progressive references to
`skills/base/autonomous-sdd-lifecycle/`. Add valid skill metadata, the explicit
result contract, and the required shared guardrail reference. This makes the
lifecycle a normal dynamically discovered package rather than adding a special
case to the installer.

Keeping `workflows/` canonical was rejected because `gh skill` installs skill
packages, not arbitrary repository siblings. Copying policy into both locations
was rejected because it creates two sources of truth.

### Legacy workflow and platform files remain thin

Replace `workflows/autonomous-sdd-lifecycle/workflow.md` and its reference
files with compatibility pointers to the canonical skill. Point `.agents` and
`.claude` adapters directly to the skill. Update drift verification to require
the new target and thin-adapter phrases.

Deleting the legacy path was rejected because repository documentation and
historical links use it. Leaving adapters pointed at the compatibility layer
was rejected because direct canonical references are easier to verify.

### Delivery uses a sibling skill reference

Change the delivery reference to
`../autonomous-sdd-lifecycle/SKILL.md`. Both source and installed layouts place
canonical skills as siblings, so no absolute path, product constant, or
installer-specific metadata is needed.

Bundling a duplicate lifecycle inside delivery was rejected because lifecycle
is independently discoverable and would drift. A custom dependency copier was
rejected because the native all-skills installation can distribute both
packages.

### Installation fixtures verify the dependency edge

Extend disposable installation fixtures to include lifecycle and delivery,
assert both appear in each agent inventory, resolve the delivery Markdown link
against the installed delivery directory, and require the target file to
exist. Lifecycle evals continue to validate phase coverage and now validate
canonical ownership and compatibility pointers.

The synthetic matrix covers metadata, positive discovery, missing-dependency
failure, adapter parity, trigger/non-trigger text, authorization and mutation
boundaries, untrusted content, secrets, recovery, profiles, and a disposable
second checkout with different paths. No new third-party content is introduced;
attribution is not applicable.

## Verification Strategy

- Validate canonical metadata and shared guardrail structure.
- Run lifecycle and adapter-drift tests for canonical ownership, thin pointers,
  trigger/non-trigger text, result guidance, and sibling delivery linkage.
- Confirm security boundaries and second-checkout portability remain unchanged
  after canonical relocation.
- Run the disposable global-install fixture for Claude and Codex and resolve
  delivery's link against the actual listed destination.
- Run installer unit/second-checkout fixtures, OpenSpec artifact quality,
  strict OpenSpec validation, whitespace checks, and bounded diff review.
- Treat authenticated invocation as blocked unless disposable authenticated
  agent profiles are explicitly supplied; never substitute the user's normal
  profile or claim that blocked evidence passed.

## Attribution and Licensing

The moved lifecycle policy and new tests are repository-authored. No
third-party content, runtime dependency, or license obligation is introduced;
attribution is not applicable.

## Recovery

If canonical promotion, fixture installation, or user-scope refresh fails,
preserve the successful files and exact command evidence, correct only the
failed path, and rerun the same bounded check. Do not delete unrelated skills
or global configuration. Rollback restores the workflow policy and all adapter
and delivery links as one reviewed change, then reinstalls the prior source.

## Reuse Plan

Canonical policy and progressive references remain assistant-neutral and
portable in `skills/base/autonomous-sdd-lifecycle/`. Product repositories,
paths, Projects, branches, labels, adapters, and credentials remain supplied by
target configuration. Claude and Codex wrappers contain only platform discovery
metadata, and disposable second-checkout installation proves that no source
checkout path or product constant is required.

## Risks / Trade-offs

- [A consumer installs only delivery] → document lifecycle as a required sibling
  and make installation verification report it missing; the supported complete
  flow remains `--all`.
- [Legacy links become stale] → retain the workflow and reference paths as thin
  pointers and cover them in drift tests.
- [Policy is accidentally copied into a pointer] → assert adapter and workflow
  size/content boundaries in lifecycle evals.
- [Global refresh overwrites unrelated skills] → use the existing explicit
  `--force` flow only for named canonical destinations; verification confirms
  unrelated user and system skills remain outside the change.
- [Rollback leaves mixed canonical targets] → revert the bounded files together,
  rerun adapter drift and installation fixtures, then reinstall the prior
  pinned or local source.

## Migration Plan

1. Add the canonical lifecycle skill and progressive references.
2. Convert legacy workflow assets and both platform adapters to thin pointers.
3. Update delivery, documentation, drift checks, and isolated install/eval
   coverage.
4. Run focused validation, the full strict OpenSpec gate, and diff review.
5. Refresh both user-scope installations from the local checkout and verify the
   installed dependency target for each agent; new sessions activate discovery.

Rollback restores the workflow as canonical, restores adapter and delivery
links together, reruns validation, and reinstalls the last known-good source.
No external state, credential, or destructive resource mutation is required.

## Open Questions

None. The supported complete installation remains the documented all-skills
flow; single-skill dependency closure is deliberately outside this repair.
