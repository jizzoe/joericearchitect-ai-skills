## Summary

Repair the released v2 initializer so its legacy-inventory safety check does
not classify the initializer's own schema-5 pending controller checkpoint as
unknown legacy state. The current installed wrapper therefore pauses every real
initialization before it can create a v2 admission or repository claim.

## Scope

- inventory only actual legacy controller records from repository-common state;
- exclude the current schema-5 initializer checkpoint and non-controller JSON;
- continue to pause on genuinely ambiguous or active legacy controllers;
- add an installed-wrapper regression using a real Git common directory;
- deliver through the approved pre-v2 bootstrap without creating a v2 or
  legacy claim for this repair.

<!-- sdd-managed:start -->
OpenSpec change: `repair-v2-initializer-self-inventory`

- Proposal: `openspec/changes/repair-v2-initializer-self-inventory/proposal.md`
- Specifications: `openspec/changes/repair-v2-initializer-self-inventory/specs/`
- Design: `openspec/changes/repair-v2-initializer-self-inventory/design.md`
- Tasks: `openspec/changes/repair-v2-initializer-self-inventory/tasks.md`
- Tracking: `openspec/changes/repair-v2-initializer-self-inventory/tracking.yaml`
<!-- sdd-managed:end -->
