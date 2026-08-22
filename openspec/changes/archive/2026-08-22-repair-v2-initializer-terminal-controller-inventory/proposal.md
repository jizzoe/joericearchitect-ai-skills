## Why

The installed v2 initializer correctly excludes its own pending schema-5 checkpoint, but it still sends every prior schema-5 controller checkpoint to a legacy decoder that recognizes only schemas 1–4. A fully terminalized prior v2 controller therefore appears ambiguous and blocks all later admission even when immutable archive evidence proves its exact claim was released.

## What Changes

The scope is limited to evidence-based classification of prior terminal
schema-5 controllers during initialization and its focused installed-runtime
coverage.

- Recognize a prior schema-5 controller as compatible terminal only when its exact identity and completed controller state match an immutable archived v2 run, terminalization receipt, and claim-release record for the same repository and selected change.
- Preserve fail-closed behavior for pending or incomplete schema-5 controllers, active claims, missing archives, malformed records, identity conflicts, digest conflicts, and genuinely ambiguous legacy candidates.
- Extend the installed initializer wrapper integration suite with real Git-common controller state and real local v2 archive-layout fixtures.
- Preserve audit records byte-for-byte and create no v2 or legacy authority for this bootstrap repair.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `autonomous-sdd-continuation`: Initialization must distinguish a verified terminal prior schema-5 controller from active or ambiguous controller state.
- `autonomous-sdd-run-contract`: Admission compatibility requires exact immutable v2 terminal evidence, not controller status alone.

## Impact

- Primary issue: https://github.com/jizzoe/joericearchitect-ai-skills/issues/193
- Affected assets: `scripts/sdd/autonomous-sdd-admission.mjs`, legacy/controller inventory helpers, installed-runtime controller wrapper coverage, and the two listed living specifications.
- Compatibility: existing schemas 1–4 reconciliation behavior and the initializer's exact self-exclusion remain unchanged.
- Security and recovery: acceptance is fail closed and credential-free; no legacy record, controller checkpoint, v2 archive record, or claim record is rewritten.
- Migration: none. Existing terminal audit records remain in place and are evaluated read-only.

## Non-Goals

- Treating `currentPhase: null` or completed controller steps by themselves as terminalization proof.
- Reconciling, deleting, rewriting, or upgrading historical controller records.
- Relaxing legacy ambiguity, active-claim, repository-identity, selected-change, provider, digest, or archive checks.
- Changing runtime installation, global skills, GitHub credentials, remote-branch retention, or the planned M2 roadmap.

## Reuse Plan

- Keep terminal-controller verification in assistant-neutral `scripts/sdd` code and expose it only through the existing declared controller wrapper.
- Derive repository names, paths, archive locations, change identifiers, and provider bindings from structured inputs and durable records; commit no product-specific constants to reusable runtime assets.
- Keep Claude and Codex wrappers thin; this change requires no wrapper-specific policy fork.
