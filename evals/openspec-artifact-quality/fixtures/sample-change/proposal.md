## Why

The bookkeeping assistant needs a bounded local export check so users can
review generated reports before sharing them.

## What Changes

- Add a local export review capability for generated report assets.
- Define scope for report metadata, compatibility with existing report files,
  and security behavior for local-only validation.
- Keep automation limited to local artifact review.

## Non-Goals

- Do not send reports to external services.
- Do not change credential handling.
- Do not create GitHub issues or Project records.

## Capabilities

### New Capabilities

- `report-export-review`: validates local report export artifacts.

### Modified Capabilities

- None.

## Impact

- Primary issue: https://github.com/example/bookkeeping-assistant/issues/42
- Affected assets: local report fixtures and validation script.
- Compatibility: existing report files remain readable.
- Security: validation reads local files and does not execute report content.

## Reuse Plan

- Product-neutral behavior lives in report artifact validation.
- Product-specific paths and report names remain configured per repository.
- Claude and Codex use the same local rules.
