## 1. Separate strict transport phases

- [x] 1.1 Refactor the Codex strict adapter so managed executable preflight
  seals the fixed identity before any elevated invocation is constructed.
- [x] 1.2 Require the elevated launch path to consume only the sealed identity
  and fixed request; reject caller-selected or unsealed executable choices.
- [x] 1.3 Add a safe, stable preflight-boundary diagnostic that distinguishes
  unavailable managed mutation proof from executable or profile diagnosis.

## 2. Make owned artifact delivery observable

- [x] 2.1 Add a bounded managed preflight check for the pinned Codex executable
  that requires the exact output-file, schema, strict-config, and isolated
  permission-profile switches.
- [x] 2.2 Bind the output-file capability and artifact-only delivery contract
  to the sealed executable identity and fail closed when delivery is absent.
- [x] 2.3 Preserve the existing artifact-only result consumer and add precise
  missing-artifact delivery diagnostics and recovery guidance without storing
  raw output or temporary paths.

## 3. Add regression and portability evidence

- [x] 3.1 Add deterministic adapter tests for managed preflight acceptance,
  elevated-boundary rejection, sealed-launch-only execution, and diagnostic
  redaction.
- [x] 3.2 Add fixture coverage for schema-valid empty-findings `passed` and
  findings-bearing `failed` artifacts, absent artifacts, transcript rejection,
  cleanup ownership, and unchanged non-Codex behavior.
- [x] 3.3 Add a second-repository portability fixture proving no
  product-specific paths, credentials, or executable locations enter reusable
  contracts.

## 4. Validate and record acceptance

- [ ] 4.1 Run the focused independent-review, adapter, and regression suites;
  record commands and passing results in durable change evidence.
- [ ] 4.2 Run a bounded live strict Codex acceptance probe for the configured
  signed executable and record only normalized success or safe unavailability
  evidence.
- [ ] 4.3 Run `node --test`, `openspec validate --all --strict`, whitespace,
  secret-pattern, scope, and documentation review before requesting delivery.
