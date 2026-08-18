# Independent Review Inspection-Environment Fallback

> Conditional historical design input. Use
> [Independent-review assurance and profiles](../../independent-review-assurance-and-profiles.md)
> for the current sequencing and decision boundary.

Date: 2026-08-14

Status: Propose-ready design brief with recommendations awaiting owner
confirmation. This brief records a proposed follow-on repair; it does not itself
authorize Apply, delivery, or a waiver of the independent-review gate for
`add-base-skills-research-and-planning`.

## 1. Problem and Desired Outcome

An authorized degraded Codex reviewer was launched through the parent runtime,
but the fresh reviewer could not reliably execute required read-only inspection
operations. Bare `sed` was unavailable, command discovery did not find expected
tools, and explicit `/usr/bin/git` execution on macOS failed through `xcrun`.
The reviewer consequently did not produce its owned final-result artifact, so
the delivery gate correctly returned unavailable.

The result-transport repair made that failure observable and fail-closed, but it
did not implement the intended recovery policy. Instead, the current contract
stops after one restricted degraded attempt. A fixed parent `PATH` is passed to
the Codex process, while the inner review shell is configured to inherit no
parent environment. Even when an executable path exists, a platform tool can
still depend on toolchain state that a static `PATH` does not supply.

The desired outcome is a deterministic three-stage review sequence:

```text
strict isolated review
  -> if durably unavailable and authorized:
restricted degraded review (default)
  -> if, and only if, inspection capability is proven unavailable:
context-compatible degraded review
  -> accept only a valid owned final artifact for the exact sealed package
```

“Context-compatible” means inspection-tool availability equivalent to the
environment class that launched the review. It does **not** mean inheriting the
entire ambient process environment, disabling the review sandbox, adding
network access, exposing credentials, or granting repository/GitHub mutation.
Toolchain parity and security authority are separate controls.

The in-flight research-and-planning change should remain paused while this
repair is delivered separately. After the repair merges, its branch can move to
the repaired base, rerun current-head evidence, and complete independent review
without a gate waiver.

## 2. Evidence and Key Findings

The durable sources establish the following:

- `scripts/sdd/platform-review-adapters.mjs` constructs the parent Codex request
  with `/usr/bin/env -i`, a small authentication environment, a fixed platform
  `PATH`, `require_escalated` parent execution, and
  `shell_environment_policy.inherit="none"` for the inner reviewer.
- The `require_escalated` request authorizes the host-owned launcher to cross the
  outer managed-sandbox boundary. It does not cause the inner reviewer to share
  the launcher's toolchain environment.
- The current `harden-independent-review-result-transport` delta requires an
  inspection-tool failure to return unavailable instead of restoring ambient
  environment or using a less-restricted fallback. That requirement is the
  opposite of the intended two-tier degraded recovery behavior.
- `skills/base/independent-review/references/protocol.md` requires fresh,
  noninteractive, sealed-package-bound review; read-only repository access;
  credential and mutation denial; and final-artifact-only acceptance. These
  controls must remain true in both degraded attempts.
- `skills/base/autonomous-goal-runner/references/sdd-delivery-request.md`
  distinguishes authorization from runtime permission. It already permits a
  configured parent-runtime recovery after strict unavailability, but it does
  not define a second degraded execution environment.
- The official Codex shell-environment policy supports an empty inheritance
  baseline, explicit `set` values, and keyed include/exclude filters. Its
  precedence is security-relevant: explicit values are applied after
  exclusions, while a final include allowlist can still remove them. The
  automatic KEY/SECRET/TOKEN-name exclusion is not active unless
  `ignore_default_excludes` is set to `false`. See the
  [official shell-environment policy](https://learn.chatgpt.com/docs/config-file/config-advanced#shell-environment-policy).
- `openspec/changes/add-base-skills-research-and-planning/tasks.md` and its
  Verify report leave current-head independent review incomplete. Closing that
  change without review would contradict its `production-rapid` evidence gate.

The failure is therefore not just a missing utility. It is a contract gap:
runtime escalation, toolchain availability, review security, retry eligibility,
and final-result transport are not modeled as separate states.

## 3. Options Considered and Tradeoffs

### Option A: Keep the current fixed minimal `PATH`

Continue returning unavailable whenever the restricted reviewer lacks a tool.
This is simple and fail-closed, but it has already failed in a supported launch
context. It cannot handle tools such as Apple's Git shim whose functionality
depends on developer-tool resolution outside `PATH`.

Decision: reject.

### Option B: Inherit the complete launcher environment on retry

Relaunch the reviewer with the caller's entire environment and ordinary shell
configuration. This maximizes compatibility, but can expose credentials,
process-injection variables, user or repository-controlled `PATH` entries,
shell startup hooks, Git configuration, proxies, and mutation-capable tools.
It also makes review evidence machine-dependent and difficult to attest.

Decision: reject. This is not what “same environment type” means.

### Option C: Use sanitized launch-context toolchain parity

After a typed inspection-capability failure, create a fresh degraded reviewer
whose security profile is unchanged but whose platform adapter supplies a
validated, allowlisted inspection context derived from the actual launcher.
The context describes semantic read-only capabilities and resolves only the
host-owned executables and toolchain variables required to provide them.

This preserves portability and security while addressing `PATH`, `xcrun`, SDK,
shell, and platform-runtime differences. It requires a capability preflight,
attempt-specific evidence, and careful environment sanitization.

Decision: recommend.

### Option D: Avoid reviewer shell dependencies entirely

Expose host-owned `read-file`, `list-tree`, `search-text`, and `read-diff`
operations to the reviewer instead of general inspection commands. This has the
smallest command-injection surface and may become the preferred architecture,
but it requires a larger adapter change and product-runtime support that has not
yet been proven.

Decision: retain as a compatible implementation direction or later hardening
step. The proposal should not depend on it unless Explore confirms current
Codex runtime support.

## 4. Decisions, Assumptions, and Ownership

### Owner decisions

The owner has clarified the intended behavior for degraded independent review:

- Attempt the restricted degraded reviewer first because that remains the
  default.
- If required inspection capability fails, retry in an environment compatible
  with the context that launched the review.
- “Compatible” concerns execution and tool availability; it must not relax the
  security policy.
- Do not waive independent review for
  `add-base-skills-research-and-planning`.

### Design recommendations awaiting proposal review

- Name the new fallback boundary
  `launch-context-compatible-read-only-v1`; avoid “privileged” or
  “unrestricted,” which conflate runtime compatibility with security authority.
- Represent required inspection functions as semantic capabilities, initially:
  `read-file`, `list-tree`, `search-text`, and `read-sealed-diff`. Add a Git
  executable only if a requirement cannot be satisfied from the sealed package
  and detached view.
- Permit exactly one context-compatible degraded attempt per sealed package and
  environment-failure signature. Environment retries should not consume the
  objective-correction budget, but must have their own bounded attempt budget.
- Record both degraded attempts under one review-transition lineage with unique
  execution IDs, result paths, cleanup records, and capability-ledger entries.
- Keep both degraded outcomes labelled `authorized-degraded`; never normalize a
  context-compatible result into `strict-isolated` assurance.

### Assumptions to validate during OpenSpec Explore or Propose

- The repository's pinned Codex version implements the documented explicit
  `set` and keyed-filter behavior while retaining the read-only filesystem and
  network-denied permission profile. The public configuration contract supports
  this composition, but the exact CLI overrides still require an end-to-end
  probe in the pinned runtime.
- The parent runtime can probe semantic inspection capabilities inside the
  exact target permission profile before model execution.
- A launch-context descriptor can be produced without storing raw environment
  values or machine-specific paths in reusable canonical assets.
- The owned result path and a small runtime-owned scratch path can remain
  writable without granting writes to the sealed review view.

## 5. Scope, Constraints, Dependencies, Risks, and Proposed Design

### In scope

- Extend strict-first-degraded policy with a second, explicitly bounded
  degraded execution tier.
- Add deterministic capability preflight and typed retry eligibility.
- Add a sanitized, adapter-owned launch-context descriptor and fingerprint.
- Preserve exact-package binding, fresh reviewer identity, attempt lineage,
  result-artifact validation, and guarded cleanup across retries.
- Update canonical protocol, authorization/result schemas when required,
  platform adapters, focused fixtures, recovery documentation, and user-facing
  status messages.
- Replace the result-transport delta's prohibition on fallback with the narrow
  security-preserving fallback defined here. Preserve its prohibition on raw
  ambient inheritance and genuinely less-secure execution.

### Non-goals

- Do not add a manual waiver for the research-and-planning delivery gate.
- Do not allow the implementer, same-session reasoning context, or a package-
  only self-review to satisfy independent review.
- Do not expose tokens, SSH agents, keychains, cloud variables, proxy
  credentials, GitHub authentication, user Git configuration, shell startup
  files, or arbitrary environment variables.
- Do not enable network, repository/Git writes, GitHub mutation, deployment,
  release, external sends, or delegated mutation.
- Do not retry on review findings, authorization failures, stale bindings,
  cleanup ownership failures, malformed output alone, or an unexplained model
  failure.
- Do not embed this machine's paths or product-specific constants in canonical
  reusable assets.

### Required security invariants

Both degraded attempts must retain:

1. a fresh noninteractive reviewer with no implementer conversation;
2. the identical immutable base, head, manifest, artifacts, and validation
   evidence;
3. a detached, package-validated review view that is read-only to inspection
   commands;
4. network denial and empty credential/injection variables;
5. no repository, GitHub, deployment, release, external-send, or delegated-
   mutation capability;
6. an exclusively created attempt-specific final-result path and guarded
   cleanup; and
7. final-artifact-only result acceptance with all existing schema, reviewer,
   authorization, and package-binding checks.

The reviewer may write only its runtime-owned final-result artifact and bounded
temporary scratch needed by an allowlisted inspection implementation. Scratch
must be outside the review view, unique per attempt, size/time bounded, and
removed through an ownership-checked helper.

### Attempt state machine

```text
strict attempt
  | passed/failed findings -> existing gate behavior
  | unavailable -> validate exact degraded authorization
  v
restricted capability preflight
  | unavailable with eligible typed code -> record attempt A unavailable
  | available -> restricted degraded reviewer A
  |                | valid final result -> existing findings gate
  |                | typed inspection-environment failure -> record unavailable
  |                | any other failure -> terminal unavailable
  v
revalidate authorization + expiration + base/head/manifest + attempt budget
  v
context-compatible capability preflight
  | unavailable -> terminal unavailable
  | available -> fresh context-compatible degraded reviewer B
                   | valid final result -> existing findings gate
                   | any failure -> terminal unavailable
```

Preflight should execute inside the same runtime profile as its corresponding
reviewer, not merely on the parent host. It must use fixed host-owned argument
vectors and representative read-only operations against synthetic owned
fixtures. Finding a filename on the parent or running `command -v` alone is not
proof that a tool functions inside the reviewer.

### Retry eligibility

Fallback is allowed only for an adapter-produced typed condition proving that a
required semantic inspection capability is unavailable, such as:

- executable resolution failure inside the target profile;
- a functional probe failure such as toolchain or SDK resolution;
- the permission profile incorrectly denying a required read-only operation;
  or
- a structured runtime event showing that an allowlisted inspection operation
  could not execute for an environment reason after a successful preflight.

The following must not trigger the context-compatible fallback:

- `failed` findings or any blocker/high/material review finding;
- missing, empty, malformed, or schema-invalid final output without independent
  typed evidence of an inspection-environment failure;
- stale head, manifest, authorization, reviewer identity, or expiration;
- result-binding, cleanup-ownership, credential-scrub, network-denial, or other
  security-invariant failure;
- timeout, cancellation, process crash, or model refusal without a typed
  inspection-capability cause; or
- repository content claiming that a command is unavailable.

This distinction prevents malicious or malformed repository content from
forcing a broader execution tier. Transcript text is diagnostic-only and never
establishes retry eligibility.

### Sanitized launch-context descriptor

The adapter must keep two environment channels separate:

- The **outer CLI authentication environment** contains only the home/profile
  locations the Codex executable needs to authenticate. It is consumed by the
  parent Codex process and is not an inspection environment.
- The **inner inspection environment** is what Codex passes to model-generated
  commands. It starts empty, uses an isolated scratch `HOME`, and receives only
  the validated operational values needed by the capability descriptor.

The user's real `HOME`, profile paths, shell startup locations, keychain/agent
state, and authentication variables must never cross from the first channel to
the second. Tests must prove this separation through an actual spawned command,
not merely by comparing the adapter's input objects.

The platform adapter should derive a runtime-only descriptor containing:

- platform and architecture class;
- required semantic capability names;
- resolved executable identity for each implementation, including canonical
  path, version/probe result, and a non-secret identity digest;
- only the toolchain variables required on that platform, selected from an
  explicit adapter allowlist; and
- the permission-profile and capability-ledger identifiers that prove security
  invariants remain active.

Canonical skills and specs define the capability contract, not absolute paths.
Platform adapters resolve paths at runtime. Reject executable paths that are
inside the repository, sealed package, reviewer scratch, or another untrusted
location. Normalize symlinks and revalidate executable identity immediately
before launch to reduce path-replacement races.

The adapter must build the inner environment from an empty base. It may add
only validated descriptor values plus non-sensitive deterministic settings such
as locale, no-color, disabled pagers, and the attempt's isolated temporary
directories. It must set `ignore_default_excludes=false`, use a final keyed
include allowlist, and account for Codex's documented ordering in which explicit
`set` values follow exclusions. It must continue clearing credential and
process-injection variables and then prove sensitive values are absent or blank,
never restored nonempty by `set` or another configuration layer. Filters are
case-insensitive, so fixtures must cover case variants. It must not source user
or repository shell profiles.

Platform-specific resolution belongs in adapters. Examples that require
fixtures include macOS developer-tool/`xcrun` resolution, Linux and WSL path
behavior, and Windows `SystemRoot`/executable-extension needs. These are example
classes, not canonical hard-coded values.

### Git and repository-content safety

Prefer the sealed diff and direct read/list/search capabilities over reviewer
Git execution. If Git is truly required, the adapter must disable pagers,
external diff/textconv drivers, hooks, credential helpers, user/system
configuration where feasible, replace options with fixed safe values, use
argument vectors rather than shell strings, and terminate option parsing before
repository-controlled pathnames. Filenames with spaces, leading dashes,
newlines, symlinks, submodules, sparse-checkout metadata, and binary content
must not become executable input.

All inspection operations need output-size and time limits. Truncation must be
visible to the reviewer and final evidence; it must not be silently interpreted
as complete inspection.

### Binding, idempotency, and recovery

- Attempt B must reuse the exact sealed package bytes from attempt A, not rebuild
  from a mutable branch name. Recompute and compare the manifest immediately
  before launch and acceptance.
- Revalidate expiration and authorization both before attempt B and before
  accepting its result. Expiration during an active attempt fails closed unless
  the governing policy explicitly defines start-time validity.
- Give every attempt a unique execution ID, result path, scratch root, and
  cleanup result. Never reuse a partially written artifact.
- Persist a state transition before launching attempt B so restart recovery
  cannot accidentally run unbounded retries or accept an orphaned result.
- Concurrent runners for the same transition/package must deduplicate or
  conflict durably; one runner's artifact cannot satisfy another's attempt.
- A new implementation head restarts strict-first review and receives a new
  sealed package. Prior environment-unavailability evidence may inform
  diagnostics but cannot authorize skipping strict review.
- A valid review followed by cleanup failure remains unavailable and must not
  trigger the broader environment tier.

### User-facing evidence

Status output should distinguish:

- strict review unavailable;
- restricted degraded capability preflight unavailable;
- restricted degraded reviewer unavailable for a typed environment reason;
- context-compatible degraded attempt started;
- context-compatible degraded result accepted or unavailable; and
- the exact remaining recovery condition.

Durable evidence may retain stable codes, attempt tier, timestamps, executable
identity digests, capability/preflight results, package and context
fingerprints, byte counts, result digests, and cleanup classifications. It must
not retain raw environment values, credentials, full home paths, raw reviewer
transcripts, or temporary review contents.

### Acceptance matrix

| Condition | Required outcome |
| --- | --- |
| Restricted preflight and reviewer succeed | Accept attempt A's owned result; do not launch B. |
| Restricted preflight proves required capability unavailable | Record A unavailable, revalidate gates, then launch B. |
| Restricted reviewer emits typed inspection-environment failure | Record A unavailable, revalidate gates, then launch B. |
| Restricted reviewer returns findings | Apply existing findings policy; never launch B to seek a different answer. |
| Restricted result is missing/malformed without typed environment evidence | Terminal unavailable; never infer a retry trigger from transcript text. |
| Authorization, package, head, manifest, or expiration changes between attempts | Terminal unavailable; do not launch or accept B. |
| Context-compatible preflight cannot prove both inspection capability and security invariants | Terminal unavailable. |
| Context-compatible reviewer produces a valid exact-package result | Accept as `authorized-degraded` with attempt-tier ledger. |
| Either attempt violates cleanup or security invariants | Terminal unavailable; no further fallback. |
| Process restarts after B was durably started | Recover idempotently without accepting orphaned output or exceeding the attempt budget. |

### Verification requirements

The implementation must include deterministic tests for:

- the full strict -> restricted degraded -> context-compatible degraded state
  machine and the no-fallback success path;
- every eligible and ineligible retry condition in the preceding matrix;
- functional probes running inside each target permission profile;
- macOS `git` present-but-`xcrun`-broken behavior, missing `sed`, a shadowed or
  repository-controlled executable, and a tool replaced between probe and use;
- sanitized environment allowlisting and explicit rejection of credentials,
  proxy/auth variables, dynamic-loader/process-injection variables, shell
  startup hooks, and unsafe `PATH` entries;
- unchanged filesystem, network, Git/GitHub, deployment, release, external-send,
  and delegated-mutation denials in attempt B;
- unique attempt artifacts, partial writes, symlink/hardlink/non-regular result
  targets, cleanup failure, restart recovery, and concurrent duplicate runs;
- expiration before B, expiration during B, stale/mutated head, manifest
  mismatch, new-head correction behavior, and exhausted environment-attempt
  budget;
- filenames and content designed to trigger shell, option, pager, diff-driver,
  hook, or transcript-based retry injection;
- output truncation, command timeout, reviewer timeout, cancellation, crash,
  and missing/malformed final artifacts;
- exact assurance labels, capability ledger, attempt lineage, safe diagnostics,
  and absence of raw environment or reviewer content in durable evidence;
- second-workspace portability, platform-adapter drift, thin wrappers, secrets,
  attribution, recovery, and strict OpenSpec validation; and
- a faithful end-to-end Codex fixture demonstrating that the fallback reviewer
  can inspect the sealed package and produce the owned final artifact in the
  same environment class where the restricted attempt fails.

### Dependencies and migration

- Depend on the merged `harden-independent-review-result-transport` behavior so
  attempt-specific final artifacts and diagnostic classifications remain
  authoritative.
- Review the active living specs and archived/active changes before choosing
  which capability deltas to modify. Expected capabilities include
  `isolated-independent-review`, `authorized-degraded-independent-review`, and
  `bounded-autonomous-execution`.
- Existing authorizations that do not name or derive the new fallback boundary
  remain valid only for their currently supported attempts; they must not gain
  attempt B implicitly. Define schema compatibility explicitly rather than
  silently broadening an old record.
- Rollback disables attempt B and returns to terminal unavailable after attempt
  A. It must not invalidate already accepted, exact-package historical evidence.

### Principal risks and mitigations

- **Environment parity leaks authority.** Build from an empty environment,
  allowlist only inspected toolchain inputs, retain all permission denials, and
  test secrets and injection variables negatively.
- **Repository content forces the broader tier.** Permit fallback only from
  adapter-owned preflight or structured runtime evidence, never prompt,
  transcript, filename, exit text, or missing output alone.
- **The fallback becomes an answer-shopping retry.** Never retry findings or a
  valid result; bind B to A's typed infrastructure failure and exact package.
- **A successful outer probe hides an inner failure.** Probe representative
  operations inside the exact reviewer profile.
- **Platform behavior drifts.** Keep resolution in versioned adapters, record
  non-secret capability fingerprints, and exercise macOS/Linux/WSL/Windows
  fixtures without canonical machine paths.
- **Tool invocation executes repository configuration.** Prefer semantic
  inspection APIs; otherwise disable Git/shell extension points and use fixed
  argument vectors.
- **Retries loop or race.** Use a one-attempt environment budget, durable states,
  unique paths, and conflict detection.
- **The repair again addresses only the latest symptom.** Gate acceptance on an
  end-to-end fixture that proves both inspection and final-artifact production,
  not merely on `PATH` construction or error classification.

## 6. Open Questions, Recommended Resolutions, and Blocking Decisions

The following are evidence-derived recommendations, not owner decisions. They
remove design ambiguity for a proposal, but each runtime claim remains subject
to the acceptance evidence in Section 5. None authorizes implementation by
itself.

1. **What inner environment should Codex receive?**

   **Recommendation:** Keep `inherit="none"`; do not use `inherit="core"` or
   a login/profile shell. Construct the inner command environment exclusively
   through explicit `set` values and a final keyed include allowlist. Set
   `ignore_default_excludes=false` and `experimental_use_profile=false`.

   The first implementation should include only an adapter-owned tool directory
   in `PATH`, isolated `HOME` and temporary-directory values, `LANG`/`LC_*`,
   `TERM=dumb`, `NO_COLOR=1`, and disabled-pager values. Add a platform variable
   such as macOS `DEVELOPER_DIR`, Windows `SystemRoot`/`PATHEXT`, or a tool
   runtime variable only when the corresponding functional probe proves it is
   necessary. The outer Codex authentication environment remains separate and
   must never be included in the inner allowlist.

   **Required proof:** A real `codex exec --strict-config` fixture shows each
   required value is present, every non-allowlisted value is absent, the
   read-only/network-denied profile still applies, and credentials cannot be
   reintroduced by configuration-layer precedence. This follows Codex's
   documented `set`, filter, and precedence behavior.

2. **Should the first release add direct semantic inspection tools?**

   **Recommendation:** No. Use a small host-owned executable bundle first;
   defer a new MCP or native semantic-tool surface. Direct semantic tools could
   further reduce shell exposure, but they are a larger, unproven change and
   would delay repair of the immediate environment failure.

   The bundle directory is created uniquely by the adapter, contains only the
   resolved inspection executables or verified links, is not inside the
   repository/package/scratch tree, and is revalidated immediately before each
   launch. The reviewer cannot extend its `PATH` through repository content.

   **Required proof:** The restricted profile can execute the bundle commands,
   rejects a repository-controlled shadow executable, and preserves all current
   mutation and network denials.

3. **What is the minimum inspection capability set, and is Git required?**

   **Recommendation:** Make the first release require only semantic
   `read-file`, `list-tree`, `search-text`, and `read-sealed-diff` operations.
   Implement them with a host-resolved read/list/search command bundle, such as
   `cat`, `find`, `grep`, and `wc`, rather than treating `sed`, `rg`, or `git` as
   baseline requirements. The sealed review package already contains the
   canonical base-to-head diff, so reviewer Git is unnecessary for the delivery
   decision.

   The review prompt must name the sealed package as the authoritative diff and
   instruct the reviewer not to invoke Git. A later proposal may add a Git
   capability only after proving that sealed-package inspection cannot answer a
   defined review need; it must then be a separately functional, platform-tested
   capability rather than an assumed `/usr/bin/git` path.

   **Required proof:** An end-to-end fixture reviews a representative sealed
   package, including renamed, binary, and awkwardly named files, without Git
   or `sed`; it must still produce a valid owned result artifact.

4. **How should toolchain inputs and executable trust roots work across
   platforms?**

   **Recommendation:** Resolve tools in the parent launch context, but pass
   only the resulting verified executable identities and the minimum platform
   variables required by their probes. Never copy the raw parent `PATH`. The
   adapter creates a per-attempt manifest containing semantic capability, real
   path, version/probe result, and a non-secret fingerprint; durable evidence
   retains only the fingerprint and capability outcome.

   A usable tool must have a path outside the repository, detached view,
   package, and scratch locations; canonicalized symlinks; an allowed host
   trust root; and a successful probe in the target profile. For the first
   release, macOS `xcrun`/developer-tool state is an optional capability—not a
   prerequisite—because Git is excluded. Linux/WSL and Windows receive adapter
   fixtures before their capability bundles are enabled.

   **Required proof:** Platform fixtures cover missing tools, a broken macOS
   developer-tool chain, path delimiter/case behavior, symlink replacement, and
   a tool changed after probe but before launch.

5. **What runtime evidence may trigger the second degraded tier?**

   **Recommendation:** Limit the first release to typed failures from the
   adapter-owned capability preflight. Do not infer an environment failure from
   model transcript, stdout, a missing final artifact, exit text, timeout, or
   cancellation after a successful preflight. Those conditions remain terminal
   unavailable results.

   This is intentionally conservative: the present Codex result transport has
   an owned final artifact but no authenticated, structured record proving why a
   model-generated inspection command later failed. A future version may add a
   host-owned structured event channel and expand eligibility only after it is
   bound, authenticated, and tested.

   **Required proof:** Tests demonstrate that every preflight failure routes to
   attempt B exactly once, while every post-preflight unexplained failure stays
   terminal and cannot be forced by repository text or a transcript.

6. **Should existing `strict-first-degraded` authorization implicitly gain the
   new tier?**

   **Recommendation:** No. Require a new exact fallback-boundary value, for
   example `restricted-then-launch-context-compatible-read-only-v1`, in the
   durable `degradedIndependentReview` authorization. Preserve
   `strict-first-degraded` as the policy that permits degraded review only after
   strict unavailability; the boundary value states which degraded execution
   tiers the owner accepted.

   Existing authorizations remain valid for their currently named
   `fresh-separated-reviewer-only` boundary and cannot launch attempt B. The
   resolver should ask for this boundary together with quality profile,
   independent-review policy, and expiration before an autonomous run begins.

   **Required proof:** Old records fail closed for B, a newly authorized exact
   record succeeds only for its named change/head/manifest/transition/expiration,
   and a broad, stale, or substituted boundary is rejected.

7. **When is authorization expiration evaluated?**

   **Recommendation:** Require validity at both attempt start and result
   acceptance. Revalidate immediately before launching B and immediately before
   accepting either B's final result or a resumed B attempt. If expiration
   occurs while the reviewer runs, return unavailable rather than accepting a
   late artifact.

   **Required proof:** Deterministic clock fixtures cover expiry before B,
   during B, after final-artifact creation but before acceptance, and after a
   restart.

8. **How should this repair be reviewed while the automated reviewer is
   unavailable?**

   **Recommendation:** Use a separately explicit, time-bounded,
   repair-PR-only human-review bootstrap exception. It must name this repair's
   exact change/PR/head, record the reviewer and approval evidence, and expire
   after the repair. It must not waive independent review for
   `add-base-skills-research-and-planning`, establish a standing exception, or
   permit its delivery transition.

   **Required proof:** The repair's PR body and durable evidence distinguish the
   human bootstrap from a successful automated independent review, and the
   research change remains blocked until its repaired current head has its own
   valid review record.

No unresolved design question justifies closing the research-and-planning
change without its required review. If the runtime cannot provide the selected
capability bundle and all security invariants simultaneously, the correct
outcome remains unavailable.

## 7. Recommended Next Step

After the owner confirms these recommendations, create a focused OpenSpec
proposal named `add-independent-review-inspection-environment-fallback`.

The proposal should convert the attempt state machine, security invariants,
retry taxonomy, authorization migration, and acceptance matrix above into
normative requirements and scenarios before implementation. Keep the repair on
a separate branch and PR from `add-base-skills-research-and-planning`. After the
repair is human-reviewed under a separately authorized bootstrap exception and
merged, update the research branch, rerun exact-head validation, obtain its
independent review, and only then complete its delivery lifecycle.
