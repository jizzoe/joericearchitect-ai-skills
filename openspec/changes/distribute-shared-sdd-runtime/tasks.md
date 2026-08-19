## 0. Pre-Apply decision gate

- [x] 0.1 Record the owner-approved runtime root and default PATH activation behavior, and confirm the staged-repository packaging channel over npm/npx. Do not begin builder, launcher, or installer implementation until this decision record is complete.

## 1. Delivery binding and runtime inventory

- [x] 1.1 Create or reuse the configured GitHub tracking issue before external delivery work, link this OpenSpec change and captured design-brief provenance, and record any required Project lifecycle state. Depends on: 0.1.
- [x] 1.2 Inventory every top-level helper reference made by canonical skills and progressive references; define the public helper registry with per-helper invocation shape (`cli` or `subcommand` plus permitted verbs), declared `sourceRoots` and `assetRoots`, the `contractVersion` field, the explicit absolute `--repository` invocation contract, and prohibited unresolved legacy path forms. Depends on: 0.1.
- [x] 1.3 Add fixtures for a complete inventory, missing helper, unregistered subcommand verb, undeclared local import, missing declared asset, unsafe path, and second synthetic target repository. Depends on: 1.2.

## 2. Shared runtime package and launcher

- [x] 2.1 Implement the manifest-driven runtime builder with deterministic staging that preserves repository-relative layout for `sourceRoots` and `assetRoots`, declared-root closure validation, per-file and aggregate digests, source-revision identity, staged smoke invocation of every declared entrypoint before promotion, and atomic artifact promotion. Depends on: 1.2.
- [x] 2.2 Add executable entrypoints for the seven non-dispatchable helpers: a uniform `--input <file>` / `--stdin` JSON payload wrapper for `check-operation-authorization`, `independent-review-contract`, `research-planning-skill-runtime`, `sdd-lifecycle-hygiene`, and `sdd-workspace-cleanup`, and declared subcommands for `platform-review-adapters` and `autonomous-sdd-controller`. Depends on: 1.2.
- [x] 2.3 Implement the assistant-neutral runtime launcher, Node 20-or-newer preflight, `RUNTIME_HOME` injection, and non-secret active-runtime metadata contract; allow only manifest-declared helpers and verbs and explicit validated absolute target repositories, and perform mechanical target validation only with no authorization decision. Depends on: 2.1, 2.2.
- [x] 2.4 Resolve packaged assets through `RUNTIME_HOME` when set in `validate-shared-guardrails.mjs`, `validate-openspec-artifacts.mjs`, and any equivalent checkout-root fallback; retain the checkout-relative default for in-repo invocation, fail closed when the resolved root does not exist, and update `.github/workflows/openspec-validate.yml`, `docs/skill-authoring.md`, and the recorded permission entry if any invocation contract changes. Depends on: 2.1.
- [x] 2.5 Implement `contractVersion` compatibility checking and the `doctor` command reporting per-agent skill revision, runtime revision, contract compatibility, Node version, and activation state as one machine-readable record. Depends on: 2.3.
- [x] 2.6 Implement development mode: `AI_SKILLS_RUNTIME_ROOT` override, `scripts/dev-link-runtime.sh`, and `mode: dev | installed` labeling on every launcher result. Depends on: 2.3.
- [x] 2.7 Add focused tests for successful dispatch of both invocation shapes, missing/incompatible/tampered runtime, missing/incompatible Node, undeclared helper, unregistered verb, unsafe or relative target, contract-version mismatch, revision skew reported without failure, `mode: dev` propagation into recorded evidence, atomic activation, and rollback to the one retained prior runtime. Depends on: 2.1, 2.2, 2.3, 2.5, 2.6.

## 3. Paired installer/update entrypoints

- [x] 3.1 Define a machine-readable installer receipt and parity fixture covering selected agents, local versus pinned-remote source, source revision, runtime digest and contract version, overwrite intent, paths, activation state, dry-run, `mode`, prior skill pin, and recovery code. Depends on: 2.1, 2.3.
- [x] 3.2 Add a machine-readable result to `scripts/skills/install-global-skill.mjs` so shell entrypoints consume its output instead of reimplementing GitHub CLI invocation. Depends on: 3.1.
- [x] 3.3 Implement runtime version identity `{ contractVersion, sourceRevision, digest, builtAt }`, `runtime-<digest12>` directory naming, append-only `installed.json` history for ordering, active-plus-one-prior retention, and offline `ai-skills-runtime activate --previous`. Depends on: 2.1.
- [x] 3.4 Add the Bash install/update entrypoint under `scripts/`, delegating canonical skill installation to `scripts/skills/install-global-skill.mjs`, building or obtaining the matching runtime, and retaining the previous active runtime on failure. Depends on: 3.1, 3.2, 3.3.
- [x] 3.5 Add the Windows PowerShell install/update entrypoint under `scripts/` with the same supported contract, quoting safety, source verification, receipt fields, and failure behavior as Bash. Depends on: 3.1, 3.2, 3.3.
- [x] 3.6 Add installer tests for local reviewed checkout mode, pinned remote mode, explicit overwrite behavior, failed runtime activation, missing/incompatible Node, offline `activate --previous`, approved PATH activation behavior, and Bash/PowerShell receipt parity. Depends on: 3.4, 3.5.

## 4. Canonical skill and platform migration

- [ ] 4.1 Migrate canonical skill and reference instructions from workspace-relative shared helper paths to declared `ai-skills-runtime` launcher calls with explicit target-repository inputs and declared contract versions. Depends on: 2.3, 2.5.
- [ ] 4.2 Preserve thin Claude/Codex adapters and update deterministic validation to reject unresolved legacy runtime references, relative asset defaults, duplicated platform runtime policy, an unregistered helper name, or an unregistered subcommand verb. Depends on: 4.1.
- [ ] 4.3 Add cross-assistant and second-repository fixtures proving equivalent launcher selection, unavailable classification, shared-runtime service of two agents at differing revisions within one contract version, and no change to approval, sandbox, credential, network, review, or cleanup policy. Depends on: 4.2.

## 5. Installed-profile evidence and documentation

- [ ] 5.1 Extend disposable-profile installation fixtures to install the paired skill/runtime distribution, discover every helper named by each installed canonical skill, verify launcher resolution, and run representative harmless helper invocations for Claude Code and Codex. Depends on: 3.6, 4.3.
- [ ] 5.2 Add a CI matrix on Ubuntu and Windows covering the network-free surface: builder determinism, launcher preflight and failure classification, `--dry-run` receipt parity, and PowerShell script analysis. If the matrix is not adopted, document the PowerShell path as experimental rather than claiming parity. Depends on: 3.6.
- [ ] 5.3 Update `docs/global-skill-installation.md` with source review, bootstrap by `gh release download` and `gh attestation verify`, local and pinned-remote installation, selected agents, runtime activation/PATH requirements, paired update replacing the current unpaired `gh skill update` instruction, `doctor` drift detection, rollback, verification evidence, and the unchanged authorization boundary. Depends on: 3.6, 4.1.
- [ ] 5.4 Update skill-authoring and distribution guidance to require manifest registration, launcher-based shared helper references, declared contract versions, and an installed-runtime completeness scenario for every new runtime-dependent skill. Depends on: 1.2, 4.2, 5.1.

## 6. Completion evidence

- [ ] 6.1 Run focused builder, launcher, entrypoint, installer, metadata, adapter-drift, CI matrix, and installed-profile fixtures; record exact commands, source revision, runtime digest and contract version, `mode`, supported agent versions, and any unavailable prerequisite. Depends on: 5.1, 5.2, 5.3, 5.4.
- [ ] 6.2 Run `openspec validate distribute-shared-sdd-runtime --strict`, `openspec validate --all --strict`, whitespace/secret/scope review, and a bounded local code review; correct objective findings and refresh current-head evidence. Depends on: 6.1.
