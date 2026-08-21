## Why

Autonomous admission currently consumes runtime choices from scattered inputs.
M1-S3 makes the consumed non-secret configuration deterministic, validated,
redacted, and durable so later gates cannot silently use a different source.

## What Changes

- Add a versioned `runtime` namespace to `config/ai-skills.json` and one
  canonical resolver.
- Seal a redacted configuration-provenance snapshot at v2 admission.
- Enforce fixed source authority: sealed request for authority, product config
  for allowlisted safe defaults, and probes for live capabilities only.

## Capabilities

### New Capabilities
- `autonomous-sdd-runtime-configuration`: validated, redacted configuration
  provenance and admission snapshots.

### Modified Capabilities
- `autonomous-sdd-run-contract`: work-unit configuration digests bind a
  validated snapshot rather than inferred ambient configuration.
