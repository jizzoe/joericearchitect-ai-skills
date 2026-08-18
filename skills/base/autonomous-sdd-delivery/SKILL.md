---
name: autonomous-sdd-delivery
description: Continue one complete, explicit autonomous SDD delivery through its first incomplete evidenced lifecycle checkpoint. Use only with a resolved sdd-delivery authorization and durable selected-entry record.
---

# Autonomous SDD Delivery

Use `scripts/sdd/resolve-sdd-delivery-request.mjs` or its `ship-sdd` parser
before selection. Create or resume the exact selected-entry controller record
with `scripts/sdd/autonomous-sdd-controller.mjs` in repository-common Git state,
then reread durable state and run only its first incomplete phase. Register
every non-primary implementation, Sync, and Archive resource before it is
created or selected, and bind each merged checkpoint to that resource rather
than to one global delivery head. Each controller run receives an immutable
unique run ID and uses only its derived `runs/<run-id>/controller.json`
checkpoint; never choose or reuse another run's checkpoint path. Use the
controller transition entry points, rather than mutating records in memory:
`registerControllerLifecycleResource` before resource creation or selection,
`bindControllerLifecycleDelivery` after that resource's merge, and
`executeControllerLifecycleCleanup` after Archive convergence. Those entries
persist each transition and carry the updated record through cleanup receipts.
The cleanup entry requires a fresh resource inspection for mutable eligibility;
if any registered resource is not exactly eligible, it pauses rather than
claiming an empty cleanup plan is complete.

Without valid controller context, generated OpenSpec actions retain their
ordinary bounded behavior. Do not infer targets, persist credentials, bypass
evidence or independent-review gates, or continue through unavailable runtime
permissions.

See [the canonical lifecycle](../autonomous-sdd-lifecycle/SKILL.md) for phase
gates and recovery. A complete global installation must include that sibling
skill; treat an unresolved target as an incomplete installation and do not
substitute remembered or copied lifecycle policy.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
