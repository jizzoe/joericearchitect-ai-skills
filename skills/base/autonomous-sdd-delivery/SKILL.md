---
name: autonomous-sdd-delivery
description: Continue one complete, explicit autonomous SDD delivery through its first incomplete evidenced lifecycle checkpoint. Use only with a resolved sdd-delivery authorization and durable selected-entry record.
---

# Autonomous SDD Delivery

Use `ai-skills-runtime run resolve-sdd-delivery-request` or its `ship-sdd` parser
before selection. Create or resume the exact selected-entry controller record
with `ai-skills-runtime run autonomous-sdd-controller` in repository-common Git state,
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

Before a GitHub CLI lifecycle action, use the declared
`github-cli-auth-context` runtime helper to run a fixed, read-only current
context probe and persist its exact operation binding and normalized result in
the controller. An authentication-shaped restricted result permits a request
for the existing host-permission boundary only for the same probe. It does not
permit automatic host escalation or a GitHub write. Host contrast evidence is
operation-, repository-, optional-payload-digest-, and expiry-bound; unknown,
invalid-or-expired, denied, stale, or mismatched evidence pauses the action.

Without valid controller context, generated OpenSpec actions retain their
ordinary bounded behavior. Do not infer targets, persist credentials, bypass
evidence or independent-review gates, or continue through unavailable runtime
permissions.

See [the canonical lifecycle](../autonomous-sdd-lifecycle/SKILL.md) for phase
gates and recovery. A complete global installation must include that sibling
skill; treat an unresolved target as an incomplete installation and do not
substitute remembered or copied lifecycle policy.

## Shared runtime

Shared helpers are invoked through the installed launcher, never through a
path in the active workspace:

```
ai-skills-runtime run <helper> [verb] --repository <absolute-target-repository> [-- <helper args>]
```

Required runtime contract version: 1. The launcher validates the runtime, the
declared helper and verb, and the mechanical shape of the target repository. It
makes no authorization decision, and a missing, incompatible, or drifted runtime
is a classified pause rather than a workspace fallback. Run
`ai-skills-runtime doctor` once per session to detect skill and runtime drift.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
