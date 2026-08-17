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
than to one global delivery head.

Without valid controller context, generated OpenSpec actions retain their
ordinary bounded behavior. Do not infer targets, persist credentials, bypass
evidence or independent-review gates, or continue through unavailable runtime
permissions.

See [the canonical lifecycle](../../../workflows/autonomous-sdd-lifecycle/workflow.md)
for phase gates and recovery.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
