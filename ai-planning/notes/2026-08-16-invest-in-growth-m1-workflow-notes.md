# Invest in Growth M1 workflow notes

## 2026-08-16 — Initial Gate 1 reconnaissance

- The V1 roadmap and the untracked `m1-manual-offline-delivery` central envelope both name `/Users/joerice/git/joericearchitect/hrf-reinvest-in-growth/hrf-reinvest-to-grow-mobile-app` as the M1 mobile checkout, but that path is not present. The roadmap’s broader base directory is also absent.
- This is an effective Gate 1 blocker: the envelope correctly requires a resolvable component repository before it can be pinned, dispatched, or used to start component implementation.
- The central envelope itself is an existing untracked worktree artifact. Its proposal, design, tasks, and delta must be preserved and validated before it can be presented for explicit Gate 1 approval.
- Follow-up: confirm whether the mobile repository already exists at another approved path/remote or whether a separate repository-creation decision is needed. Do not infer a remote or create a local-only handoff.

## 2026-08-16 — Apply-entry assessment

- `openspec status --change m1-manual-offline-delivery --json` reports the `spec-driven` schema with all planning artifacts present; `openspec instructions apply --change m1-manual-offline-delivery --json` reports `ready`, 0 of 15 tasks complete. Its required guidance still requires explicit human approval of the artifacts, mutation scope, and validation plan before Apply.
- Central validation passed: OpenSpec 1.8.0, the configured six-action workflow, the active M1 change, all five accepted specs, and `git diff --check` completed successfully. The central worktree also contains unrelated untracked `ai-planning/research/mobile-prototype-testing/` content, which must be preserved.
- The strict independent-review skill is installed, but it can only run after current Apply evidence exists for an exact component head and a configured isolated adapter. The M1 design records that the strict runtime is presently unavailable and prohibits a degraded fallback. This leaves task 1.4 and Gate 1 unresolved until the component/review-runtime prerequisites are evidenced.
- Scope ambiguity to resolve at Gate 1: the accepted `prototype-manual-offline-transaction` contract requires a physical Android install, while the central envelope tasks also require named iPhone/TestFlight device/build details. The broader M1 brief includes iOS after Apple resources are approved, but the roadmap’s M1 acceptance is Android-focused. Choose whether iOS is a Gate 1 requirement for this manual-offline slice or a separately gated M1 extension.

## 2026-08-16 — Owner-input reconciliation

- The owner selected `prototype-rapid` and explicitly declined strict isolated review. This is a material change from the untracked central envelope's `production-rapid`/`strict-only` profile and must be made through a reviewed amendment before Apply; it must not be silently ignored.
- The representative device is recorded as model `U656AC` on Android 15. The supplied photos also show unique device identifiers. Those identifiers must not be copied into OpenSpec, tests, screenshots, commit messages, logs, or evidence; model and Android version are sufficient for M1 evidence.
- The owner deferred iOS/TestFlight. The M1 scope and central envelope need a compatible amendment that retains Android physical-device acceptance and puts iOS behind a later approved gate.
- The intended temporary GitHub owner is `joericearchitect`, with a later transfer to HRF. The expected mobile remote could not be read through the current noninteractive HTTPS environment because no GitHub credential is configured; do not treat that as proof the remote is absent. Resolve the remote and authentication interactively before dispatch.

## 2026-08-16 — Expo setup boundary

- Browser-based Expo authentication succeeded. Avoid placing browser-login URLs, authorization codes, device identifiers, or other session material in screenshots or project artifacts.
- `npx create-expo-app` was run from the central planning root and created the untracked `joe-rice-architect/` app directory there. The central repository must not retain mobile source code. Preserve the directory without modification until the mobile repository is created or resolved, then move or recreate the app through the component-local lifecycle.

## 2026-08-16 — Phase-1 Apply authentication pause

- The owner supplied a resolved four-hour Phase-1 autonomous authorization: `m1-manual-offline-delivery`, `prototype-rapid`, `strict-first-degraded`, exact central/mobile branches, temporary public `joericearchitect/hrf-reinvest-to-grow-mobile-app`, EAS Android build setup, and no AWS or other cloud provider.
- The controller record and planning review were created under the central change, and strict central change validation passed. The first external Apply action cannot proceed because `gh auth status` reports that the configured `jizzoe` GitHub CLI token is invalid. Repository creation must pause for interactive re-authentication; do not attempt to reuse, expose, or replace a token through artifacts or chat.
- The owner reported `joericearchitect` as an account slug and `jizzoe` as the username. Current evidence instead shows two distinct GitHub user owners: the dashboard session/repository list is `jizzoe`, while the public GitHub API resolves `joericearchitect` as a separate user. The exact repository owner must be selected before creation; do not infer that a personal account can use a different repository-owner slug.

## 2026-08-16 — Identity resolution and Gate 1 readiness

- The owner explicitly resolved the temporary GitHub owner as `jizzoe`. After interactive GitHub CLI authentication, the authorized public repository `https://github.com/jizzoe/hrf-reinvest-to-grow-mobile-app` was created with a `main` branch and cloned to the approved M1 checkout. The planning artifacts were corrected from the earlier `joericearchitect` placeholder before dispatch.
- The authenticated Expo/EAS identity is a separate personal Expo account. Repository ownership and Expo account ownership must be treated as separate fields in the workflow; a GitHub username is not a reliable proxy for the Expo account/project owner. The EAS CLI readiness check succeeded, but creating/linking the EAS project and build remains component-scoped.
- The early central design had a blanket non-goal against repository/account creation even though the approved autonomous mutation boundary explicitly allowed one temporary repository and one EAS project/build. The decision record was narrowed to exclude everything *beyond* that exact approved boundary. Future templates should express approved exceptions directly to avoid an apparent policy conflict at Apply.

## 2026-08-16 — Mobile SDD bootstrap sequencing

- The newly created mobile repository was initialized with `openspec init` and generated Codex lifecycle integrations before the repository-owned SDD bootstrap policy was seeded. It is therefore **partially initialized**, not fully governed: generated `.agents/skills/openspec-*` and `openspec/config.yaml` exist, but `AGENTS.md`, project SDD workflow documentation, governance policy, a complete project context, and durable bootstrap evidence do not yet exist.
- The `sdd-project-bootstrap` design brief requires an inventory, required-input gap report, and approved artifact plan before writing those project-owned policy files. Treating generated OpenSpec setup as a completed bootstrap would bypass that Gate; future component dispatches should run bootstrap before creating the first component proposal.
- Global GitHub lifecycle skills were discoverable after bootstrap, but their installed copies contain only `SKILL.md`; the referenced helper scripts and a Project-status GitHub Actions workflow are not present in the mobile repository. A repository can therefore be policy-configured for Issue/Project lifecycle work without being execution-ready for automatic reconciliation. The bootstrap records this as an actionable gap and must not claim background automation until a separately approved adapter/integration change exists.

## 2026-08-16 — M1 implementation and build evidence

- The installed `base-code-review` skill could not be executed faithfully because its required `scripts/validation/validate-implementation-quality.mjs` helper is not included with the installed skill. The controller must record this as an unavailable review capability, not substitute an informal review or claim a completed skill run.
- The first approved EAS Android build was submitted from the then-current uncommitted workspace. EAS recorded the preceding Git commit in its build metadata even though the uploaded archive contained the implementation. A build fingerprint can provide limited correlation, but a reproducible commit-to-build chain requires submitting from a clean, committed exact head. Future workflows should make committing (or an explicit immutable source snapshot) a precondition before build submission.
- Physical-device installation exposed a material traceability failure: the implemented APK begins on a form-first screen and omits the required M01 Home design, even though the selected `home-roots-mobile-home-screen-concept-v1.png`, the UI brief, and the screen inventory require Home as the M1 starting route with business snapshot, quick actions, quiet status, and recent activity. Functional manual-entry behavior alone must not be treated as M1 acceptance. Future component proposals and Apply verification need an explicit design-asset-to-rendered-screen traceability matrix and screenshot comparison before submitting an acceptance build.

## 2026-08-17 — Corrective Home-flow verification

- The selected visual references are usable design controls but do not include the original Home Roots Foundation logo asset. The brief correctly prohibits extracting the generated logo treatment from a PNG. A source-owned logo asset is therefore a required input for visual fidelity beyond a code-built temporary wordmark.
- Both installed verification skills are structurally incomplete: `base-verification-loop` and `base-code-review` contain their main instructions and references but omit the required shared guardrails and `scripts/validation/validate-implementation-quality.mjs`. They cannot emit a validated skill result and must not be represented as completed formal verification or review.
- The mobile feature branch contains a user-authored commit (`cd4f661`) that adds a 75.7 MB signed APK under `app-bundle/`. It was preserved without alteration. This conflicts with the earlier evidence policy of keeping distribution artifacts out of the public repository and should be resolved through a separate explicit repository-artifact decision; it is not source-equivalent evidence for the corrective Home-flow build.

## 2026-08-17 — Temporary Home Roots brand asset

- The owner explicitly approved a temporary exception to the design brief's
  no-extraction rule: use a clean Home Roots logo sourced from the official
  public website rather than crop the generated M1 screen reference. The
  component now carries the official 200 × 113 transparent PNG at
  `assets/brand/home-roots-foundation-logo-temporary.png` and documents its
  public source, verification date, temporary status, and future replacement
  condition in `docs/brand-assets.md`.
- This resolves the immediate visual-fidelity input gap without treating the
  temporary Home Roots asset as the future Reinvest-to-Grow logo. The
  decision should be captured as an explicit owner override in future design
  briefs whenever a source asset is unavailable at implementation start.

## 2026-08-17 — Verify, Sync, and Archive closure observations

- The generated `openspec archive --yes` command is not idempotent after an
  agent has correctly synchronized a delta into its living spec. It tried to
  apply the already-present `ADDED` requirement again and aborted without
  mutation in both the component and central repositories. The archive skill's
  documented safe recovery (validate the living spec, then move the completed
  package intact to the dated archive) worked. Future workflow tooling should
  recognize exact spec equivalence and proceed to archive rather than retrying
  the addition.
- A scoped `git add` that names only the new archive directory stages added
  archive files but not the deletions from the former active-change path. A
  later scoped `git add -u` was required to complete the move. Archive guidance
  should prescribe one path-scoped `git add -A <active-change> <archive-path>`
  so a complete archive is committed as one rename-aware change.
- `npx expo install --check` changed from passing at build time to suggesting a
  new Expo patch release after the APK was accepted. A time-dependent package
  recommendation should be recorded as a residual compatibility warning, not
  automatically force a dependency update and a replacement acceptance build
  during close-out.
