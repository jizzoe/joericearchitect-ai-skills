## Summary

Repair the missing v2 controller-initialization entrypoint. The lifecycle
currently can create an admission claim but has no declared runtime operation
that also creates the matching durable controller checkpoint. This repair adds
one recoverable controller-first initializer so a future autonomous run cannot
begin lifecycle work with an untracked active claim.

## Scope

- add the declared `initialize-v2-delivery` runtime subcommand;
- persist a non-operational matching controller context before admission and
  bind it only after exact identity verification;
- retain strict conflict and recovery behavior, tests, canonical lifecycle
  guidance, and the blocker/roadmap handoff;
- do not create a v2 claim while delivering this bootstrap repair.

<!-- sdd-managed:start -->
OpenSpec change: `repair-v2-controller-initialization`

- Proposal: `openspec/changes/repair-v2-controller-initialization/proposal.md`
- Specifications: `openspec/changes/repair-v2-controller-initialization/specs/`
- Design: `openspec/changes/repair-v2-controller-initialization/design.md`
- Tasks: `openspec/changes/repair-v2-controller-initialization/tasks.md`
- Tracking: `openspec/changes/repair-v2-controller-initialization/tracking.yaml`
<!-- sdd-managed:end -->
