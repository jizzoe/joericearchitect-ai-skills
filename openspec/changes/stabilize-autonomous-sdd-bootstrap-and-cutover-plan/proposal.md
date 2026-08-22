## Why

Milestone 1 published and activated v2 admission and exclusive repository
claims before the same released runtime could initialize, advance, recover,
terminalize, release, converge external state, and clean up a run. The target
architecture remains sound, but the activation and bootstrap order produced a
chain of repair deliveries and repeated owner pauses. Mainline planning also
lags delivered decisions and omits permanent controls for authenticated host
operations and overlapping OpenSpec deltas.

Primary issue: [#197](https://github.com/jizzoe/joericearchitect-ai-skills/issues/197).

## What Changes

- Define five explicit operating modes—contract-only, audit/shadow, bootstrap
  hybrid, qualified opt-in, and default—with exactly one mutating runtime owner
  in each mode.
- Require runtime N-1 to deliver and archive runtime N, with runtime N installed
  only afterward and never required to prove its own releasing change complete.
- Make initialize, claim/fence, advance, recover, terminalize, release,
  external convergence, exact cleanup, and rollback one minimum activation
  bundle rather than independently activatable horizontal slices.
- Amend M4-S1 with an exact authenticated-host operation envelope and remote
  branch-retention preflight/receipt, and M4-S2 with repository-wide active
  delta overlap and exact requirement-description checks before Sync mutation.
- Reconcile delivered M1 status, accepted decisions, repair lineage, Jira
  deferral, root-cause analysis, handoffs, and causal blocker metadata onto
  mainline planning.
- Put M2-S1 and later execution back behind dependency-valid readiness and keep
  M6-S3 as the only default-cutover authority after qualification and rollback
  proof.

This is a planning-only change. It changes no runtime, skill, deployment,
credential, active controller record, or execution behavior.

## Non-Goals

- Implementing or activating any controller, backend, transition, GitHub,
  Sync, Archive, cleanup, rollback, or Jira behavior.
- Changing runtime installation, global skills, credentials, repository
  settings, deployments, active durable records, or remote-branch policy.
- Authorizing M2-S1 or any later slice; each remains a separate delivery.

## Capabilities

### New Capabilities

- `autonomous-sdd-control-plane-planning`: Defines durable planning rules for
  bootstrap ownership, activation modes, vertical readiness, external and Sync
  dependency gates, mainline reconciliation, and cutover order.

### Modified Capabilities

None.

## Impact

Affected assets are the autonomous-SDD master design, roadmap, selected M1,
M2, M4, and M6 slice briefs, planning notes/handoffs, and the new planning
capability specification. No executable source, reusable global skill,
runtime artifact, repository setting, or external deployment changes.

The scope is documentation and OpenSpec planning only. Compatibility is
preserved by keeping existing runtime behavior and in-flight generation
bindings unchanged. Security boundaries remain unchanged: no credential,
secret, permission, deployment, or repository-policy mutation is introduced.

## Reuse Plan

- The plan describes repository-neutral control-plane modes and transition
  evidence; repository-specific issue/PR history remains provenance only.
- GitHub and Jira are treated as configured adapters, not embedded constants in
  executable reusable assets.
- Claude and Codex continue to consume the same canonical SDD contracts; this
  change adds no assistant-specific policy.
