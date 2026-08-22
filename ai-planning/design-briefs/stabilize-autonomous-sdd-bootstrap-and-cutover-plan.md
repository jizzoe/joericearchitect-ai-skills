# Stabilize Autonomous SDD Bootstrap and Cutover Plan

Date: 2026-08-22
Status: Accepted planning correction in delivery through OpenSpec change
`stabilize-autonomous-sdd-bootstrap-and-cutover-plan` and issue
[#197](https://github.com/jizzoe/joericearchitect-ai-skills/issues/197).

## Decision

Keep the target autonomous SDD architecture, but replace its premature
horizontal activation order with a two-version, vertical bootstrap lane.
Publishing a schema, helper, wrapper, or adapter proves contract availability;
it does not route real work or grant repository mutation authority.

Runtime generation N-1 delivers and archives generation N. Generation N is
installed only from that merged Archive result and is used by later work, never
to prove its own release complete. A task that requires its own newly installed
runtime is self-referential and must be split before Propose readiness.

## Operating modes and mutation owner

| Mode | Purpose | Sole mutating owner |
|---|---|---|
| `contract-only` | Publish and test contracts without operational routing. | Existing released lifecycle owner; the new generation does not mutate real work. |
| `audit/shadow` | Compare discovery, selection, and expected transitions without writes. | Existing released lifecycle owner. |
| `bootstrap-hybrid` | Let an explicitly authorized N-1/bootstrap owner release N while N remains unavailable or incomplete. | The named N-1/bootstrap owner for the exact delivery. |
| `qualified-opt-in` | Run an individually authorized eligible change after the complete vertical bundle passes M4-S4. | The immutable generation recorded at that run's admission. |
| `default` | Route new eligible deliveries through the qualified control plane after M6-S3. | The default generation selected at admission; existing runs keep their recorded owner. |

No mode permits two generations to mutate the same run or repository. A mode
change affects only new admissions unless a separately authorized compatibility
migration proves exact identity and preserves one owner.

## Minimum activation bundle

Real repository ownership remains disabled until one released generation can
perform and recover the full vertical path:

1. initialize a durable controller and matching run;
2. acquire and generation-fence the repository claim;
3. advance deterministically through typed operations;
4. resume or take over safely after interruption;
5. terminalize the exact completed run;
6. release its claim;
7. converge issue, Project, pull request, default-branch, Sync, and Archive
   state;
8. clean only exact-owned eligible local resources; and
9. roll routing back without creating a second mutating owner.

The implementation may remain sliced across milestones, but activation is one
qualified decision. M2-S1 is still the next dependency-valid slice after this
planning change, followed by M2-S2 and M2-S3; those slices build the local
engine without activating it as the real lifecycle owner.

## Permanent boundary corrections

- M4-S1 owns a non-secret authenticated-host operation envelope. A restricted
  controller prepares one authorization-bound exact request; the authenticated
  host executes only that request; the controller validates a matching receipt
  before advancing. It also preflights merge and automatic branch-deletion
  policy and records or restores only an explicitly retained exact reviewed
  ref without force.
- M4-S2 builds a repository-wide graph of every active OpenSpec delta before
  Sync writes or opens a PR. Overlapping complete-replacement `MODIFIED`
  requirements are serialized or reconciled under shared authority. Sync and
  pre-Archive compare requirement descriptions and scenarios exactly, and a
  repeat Sync must be a no-op.
- M4-S3 owns terminal convergence and receipt-backed exact cleanup.
- M4-S4 is the first authority for qualified opt-in real ownership.
- M6-S3 is the only authority that may make the control plane the default.

## Planning reconciliation

Current mainline wins over stale branch state. This change deliberately
recovers only still-current accepted M1-S2 Q1-Q6 decisions from commit
`2929d82`, while marking M1-S1 and M1-S2 delivered and retaining the newer
delivered M1-S3 brief. It also recovers the Jira deferral from commit `e237061`
without enabling Jira, and publishes the primary-worktree root-cause analysis
and handoff byte-for-byte before adding current resolution context.

Repeated blocker symptoms remain chronological evidence but link to causal
records through `rootCauseId`, `expectedStop`, `temporaryUntil`,
`permanentRepair`, and `escapedGate`. This prevents a repair chain from being
mistaken for independent architecture failures.

## Non-goals and safety boundary

This decision changes planning only. It does not alter runtime behavior,
global skills, active durable records, credentials, repository settings,
deployments, or Jira. Remote delivery branches are retained. Existing dirty
primary-worktree content remains untouched; delivery occurs in an isolated
controller-owned worktree with exact cleanup afterward.

## Verification

- Every rule above maps to the OpenSpec planning capability and amended owning
  brief.
- Roadmap status and dependencies identify M2-S1 as next while keeping real
  mutation in contract-only/audit ownership until the bundle is qualified.
- Recovered stale content has an explicit inclusion/exclusion decision.
- Internal links, tracking, strict OpenSpec, documentation scope, portability,
  security, and same-session local review pass before delivery.
