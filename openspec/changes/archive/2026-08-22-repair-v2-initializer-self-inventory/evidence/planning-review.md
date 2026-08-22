# Planning review

Date: 2026-08-22

Assurance: `same-session-local` planning review under the exact owner-approved
pre-v2 bootstrap bridge. This is not independent or production assurance.

## Result

Accepted for Apply. The proposal, two modified capability deltas, design,
tasks, issue #187, tracking record, and durable bridge agree on one defect and
one repair boundary. No material product, architecture, compatibility,
security, ownership, or governance decision remains open.

The ordinary generated Propose context states a planning-only boundary. The
controlling explicit owner request separately authorizes the complete named
autonomous prototype lifecycle, including Apply, implementation delivery,
Sync, Archive, cleanup, runtime-only installation, and retry of the already
approved pending M1-S2 controller. The autonomous lifecycle's Plan-to-Apply
continuation rule therefore applies without widening the target.

## Review checklist

- **Problem and outcome:** the installed wrapper recursively inventories the
  schema-5 checkpoint that controller-first initialization just wrote; the
  repair must admit the matching v2 bundle while retaining real legacy stops.
- **Scope and non-goals:** only candidate selection, exact internally derived
  exclusion, public-wrapper suppression, focused/runtime integration tests,
  guidance, and evidence are included. No provider, schema, manifest verb,
  terminalization, historical record, credential, global skill, deployment,
  or unrelated behavior changes.
- **Issue and tracking:** issue #187 has the exact title, `sdd` and `type:bug`
  labels, managed OpenSpec block, and payload digest. `tracking.yaml` validates
  and names the configured repository and Project 1.
- **Requirements and scenarios:** both `MODIFIED` requirements retain every
  existing scenario and add positive, negative, failure, and non-bypass cases.
  Genuine malformed/unknown or active legacy controllers remain fail-closed.
- **Design:** filter by owned candidate filename before decoding; exclude only
  the initializer-derived exact contained checkpoint; strip caller exclusion
  at raw admission; prove the staged installed wrapper with real Git topology.
- **Dependencies:** the repair depends only on delivered controller-first
  initialization. It uses its separately approved pre-v2 bridge and creates no
  v2/legacy ownership state for itself. The pending M1-S2 controller remains
  non-operational until final runtime activation.
- **Security and untrusted input:** no shell text or GitHub content is executed;
  candidate paths are canonical and contained; caller-selected exclusions are
  rejected; credentials remain outside files and evidence.
- **Recovery:** failures preserve pending/current/legacy records byte-for-byte,
  create no repair claim, and leave the previous installed runtime active.
  Exact owned resources are inspected before cleanup and remote deletion is
  forbidden.
- **Portability and reuse:** canonical logic remains assistant-neutral; tests
  use temporary roots and arbitrary remotes; no product constant enters
  reusable source.
- **Attribution:** no new dependency, copied code, external asset, or license
  obligation is introduced.
- **Tasks:** eight stable numbered tasks have explicit dependencies and
  objective evidence. No task requires this change to install and use itself
  before its own implementation verification or delivery.

## Evidence

- `openspec validate repair-v2-initializer-self-inventory --strict`: passed.
- `node scripts/validation/validate-tracking.mjs openspec/changes/repair-v2-initializer-self-inventory/tracking.yaml`: passed.
- `git diff --check`: passed.
