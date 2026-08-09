# Tracking Compatibility Report

- Date: 2026-08-09
- Change: `add-openspec-change-tracking`
- Issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/25

## Result

M3-C2 introduces `tracking.yaml` as a forward-looking local metadata contract.
Pre-M3-C2 archived changes remain valid historical records and are not
rewritten. Their issue and Project state were already verified during their
own delivery, Sync, and Archive checkpoints.

## Pre-M3-C2 Compatibility Exceptions

These archived changes intentionally lack `tracking.yaml`:

- `openspec/changes/archive/2026-08-09-bootstrap-openspec-foundation`
- `openspec/changes/archive/2026-08-09-enable-bounded-autonomous-sdd-execution`
- `openspec/changes/archive/2026-08-09-establish-github-work-intake`
- `openspec/changes/archive/2026-08-09-establish-openspec-quality-rules`

## Current Tracking Validation

Current change tracking metadata:

- Path: `openspec/changes/add-openspec-change-tracking/tracking.yaml`
- Validation: `node scripts/validation/validate-tracking.mjs --json --change add-openspec-change-tracking openspec/changes/add-openspec-change-tracking/tracking.yaml`
- Result: valid, 0 issues.

## Recovery

Future changes should add `tracking.yaml` before delivery. If a historical
archive must be migrated later, perform that as a separate reviewed change with
explicit provenance rather than editing archived records opportunistically.
