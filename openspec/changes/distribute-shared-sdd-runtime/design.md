## Context

See `proposal.md` for motivation and `context/design-brief.md` for research.
`gh skill install` copies canonical `SKILL.md` package directories but does not
ship the top-level executable roots that those packages reference. The current
source tree provides Node-based SDD, validation, and GitHub helper modules with
relative imports between them; copying a few reported files cannot work.

Sixteen canonical skill packages reference seventeen shared helper modules.
Eleven of those modules are command-line programs. Six —
`autonomous-sdd-controller.mjs`, `independent-review-contract.mjs`,
`platform-review-adapters.mjs`, `research-planning-skill-runtime.mjs`,
`sdd-lifecycle-hygiene.mjs`, and `sdd-workspace-cleanup.mjs` — export
functions with no executable entrypoint,
and skills currently reference them for import by assistant-authored code. Two
modules also read repository data outside `scripts/`:
`validate-openspec-artifacts.mjs` loads `quality/openspec-artifact-rules.json`
through a checkout-root-relative path, and `validate-shared-guardrails.mjs`
defaults its root to `../../skills/base`. The distribution must handle all
three shapes, not only the command-line one.

The distribution must operate across Claude Code and Codex, preserve `gh`
skill provenance, and never treat a globally installed runtime as authority to
change an approval, sandbox, credential, or target-repository boundary.

## Goals / Non-Goals

**Goals:**

- Build one digest-bound runtime from the complete required helper closure,
  including the non-JavaScript assets those helpers read.
- Install/update canonical skills and the exact matching runtime as one
  reviewed pair from either a local checkout or a pinned remote revision.
- Give all canonical skills a stable, assistant-neutral launcher contract that
  takes an explicit target repository.
- Detect skill/runtime incompatibility after installation, not only during it.
- Fail closed with machine-readable runtime diagnostics and test installed
  completeness outside normal user profiles.

**Non-Goals:**

- Replace `gh skill`, publish a marketplace-only implementation, or duplicate
  the runtime per skill or per agent.
- Configure host approvals, credentials, GitHub authentication, target-repo
  policy, or PATH implicitly outside the documented installer scope.
- Accept arbitrary relative script paths, repository-controlled launcher input,
  or an absent runtime as a reason to skip quality gates.
- Make authorization decisions in the launcher. Helper-level authorization
  remains the only authority.

## Pre-Apply Decision Gate

Decisions 1 through 10 record the design positions this change adopts. Two
material user-level behaviors remain owner choices and MUST be recorded before
implementation begins:

1. **Runtime root and activation:** choose the documented cross-platform
   runtime root and whether the default installer reports PATH activation only
   or also offers an explicit, reversible opt-in registration mode.
2. **Package channel:** confirm the staged repository artifact over a published
   npm package or pinned `npx` launcher. npm can supply cross-platform `bin`
   wrappers, but it adds registry/publication and Node/npm prerequisites and
   does not by itself establish the selected `gh skill` revision, helper
   closure, local-checkout flow, or release-integrity evidence.

The decision record must include the selected option, rejection reasons for
alternatives, platform impact, recovery path, and fixture obligations. It is a
planning prerequisite, not an authorization to alter host configuration.

## Decisions

### 1. Stage one runtime distribution as a self-contained asset root

Add a versioned distribution manifest declaring `sourceRoots` (executable
helper roots) and `assetRoots` (data the helpers read, currently `quality/` and
`skills/base/`). A Node builder copies the declared roots into a temporary
staging directory **preserving their repository-relative layout**, so the
staged artifact is a minimal repository root: `<runtime>/scripts/...`,
`<runtime>/quality/...`, `<runtime>/skills/base/...`. Helpers that compute a
root from `import.meta.url` therefore keep resolving without source edits.

The builder statically validates that relative imports remain within the
staging boundary, computes per-file and whole-runtime SHA-256 digests, and
writes an immutable manifest. Static import analysis alone cannot detect a
missing data file, so before promotion the builder additionally performs a
**smoke invocation of every declared entrypoint** against the staged directory
(`--help` or a declared no-op payload). Only a staging directory that passes
both checks is promoted to a runtime artifact.

Copying full declared roots is selected over an ad-hoc recursive import copy:
it keeps module-relative imports intact and produces reviewable, deterministic
boundaries. The manifest/closure check prevents silently growing the package
through an undeclared import; the smoke pass catches the asset-read class that
no import scanner sees.

### 2. Dispatch only manifest-declared entrypoints, in two declared shapes

The builder supplies a launcher with a fixed command shape:

```
ai-skills-runtime run <helper-name> --repository <absolute-target> -- ...
ai-skills-runtime run <helper-name> <verb> --repository <absolute-target> -- ...
```

Each manifest entry declares its `invocation` shape, `cli` or `subcommand`, and
a `subcommand` entry declares its permitted verb list. The launcher reads
active non-secret runtime metadata, verifies the active digest, maps the helper
name (and verb) through the manifest registry, validates the explicit target,
and starts the declared module. Skill instructions migrate from
`scripts/sdd/<file>.mjs` to this launcher contract.

The six library-only modules gain executable entrypoints so they are
dispatchable:

- `independent-review-contract`, `research-planning-skill-runtime`,
  `sdd-lifecycle-hygiene`, and `sdd-workspace-cleanup` are pure functions over
  a payload. Each gains a uniform `--input <file>` / `--stdin` wrapper that
  reads a JSON payload and writes a JSON result to stdout.
- `platform-review-adapters` exposes many operations and spawns a reviewer
  process, and `autonomous-sdd-controller` exposes many operations over a
  persistent record. Both gain explicit subcommands enumerated in the manifest.

The launcher deliberately provides **no verb that resolves a module path for
import**. Handing out an importable path would reintroduce the arbitrary-path
execution surface this decision exists to close, so the JSON wrapper contract
is the only supported way to reach a former library-only helper.

This whole approach is selected over a user-configured arbitrary runtime path
or a direct relative sibling reference. A stable launcher is portable to both
agents and keeps untrusted repository content from selecting a program to
execute.

### 3. Separate the runtime's own root from the target repository

Two roots exist and are never conflated:

- `RUNTIME_HOME` — the artifact root, injected into the helper process by the
  launcher, read-only, never supplied by a caller or by repository content.
  Helpers read their packaged assets relative to it.
- `--repository` — the target of the work, always an explicit canonical
  absolute path supplied by the calling assistant or host integration.

The launcher rejects relative paths, an absent target, and a non-canonical or
symlink-escaping path. It never infers a target from its installation directory
and never silently treats the process working directory as the target.

This exposes a latent defect to fix during migration:
`validate-shared-guardrails.mjs` currently defaults its root to
`../../skills/base`, which is silently wrong once installed. The fix must not
simply make the argument required — `.github/workflows/openspec-validate.yml`
and `docs/skill-authoring.md` both invoke it with no arguments today. Instead:

- When `RUNTIME_HOME` is set, resolve the canonical asset root from it.
- Otherwise retain the checkout-relative default for in-repo invocation.
- In both cases, fail closed when the resolved root does not exist, instead of
  silently validating an empty set.

Validation rejects any helper that reaches a relative default without one of
these two resolutions succeeding. If a later decision does make the argument
required, the workflow, the authoring guide, and the recorded permission entry
must be updated in the same task.

### 4. Version the contract, not the revision

Exact revision equality between installed skills and the installed runtime is
too brittle — every commit would break the pair. The manifest carries an
integer `contractVersion`, and each runtime-dependent canonical skill declares
the contract version it requires:

- Contract-version mismatch is a **fail-closed** classified pause.
- A revision difference within the same contract version is **reported, not
  fatal**.

`ai-skills-runtime doctor` reads `gh skill list` for each selected agent and
emits one machine-readable record of skill revision, runtime revision, contract
compatibility, Node version, and activation state. Skills call `doctor` once as
a session preflight rather than revalidating on every dispatch.

This closes the post-install drift hole: today's guidance in
`docs/global-skill-installation.md` tells users to run bare `gh skill update`,
which updates skills alone and silently breaks the pair. That instruction is
replaced by the paired updater, and `doctor` detects the broken state if a user
takes the unpaired path anyway.

Contract versioning also answers divergent agents: one shared runtime serves
both Claude Code and Codex as long as each installed skill set's declared
contract version is satisfied. Per-agent runtime copies are rejected — they
reintroduce the duplication this change exists to remove. `doctor` reports
per-agent revision skew as informational.

### 5. Keep source modes aligned to one revision

Both installers support two explicit modes:

- **Local:** build runtime and invoke `gh skill install --from-local` from the
  reviewed checkout supplied by the user.
- **Remote:** require a tag or commit SHA, obtain a temporary checkout at that
  exact revision to build the runtime, and invoke `gh skill install` with the
  same pin.

The installer rejects an unclean local checkout unless an explicit documented
development override is supplied. It never fetches an unpinned remote runtime.
This is selected over a release-only first version because contributors need a
repeatable local development path; it is selected over local-only distribution
because user-scope installation must not depend on retaining a source checkout.

**Bootstrap:** the normal path to obtain the installer itself is
`gh release download <tag>` followed by `gh attestation verify` on the release
artifact, then running the extracted installer. `gh` is already a prerequisite,
so this adds no dependency and supplies real release-integrity evidence rather
than a bare tag reference. Piped remote execution (`curl | bash`) is rejected:
it contradicts the review-before-install posture this change depends on.

### 6. Support a labeled development mode

Working inside this repository must not require rebuilding and reinstalling the
runtime after every edit, and migrated skills must not silently exercise stale
installed code. `AI_SKILLS_RUNTIME_ROOT` overrides active runtime metadata, and
`scripts/dev-link-runtime.sh` builds from the working tree and points the
override at it.

This does not weaken Decision 2. The prohibition there is on *repository
content* selecting a program to execute; an environment variable the operator
sets is the same trust level as PATH itself. The safeguard is labeling: every
launcher result carries `mode: dev | installed`, and the receipt and evidence
formats surface it, so recorded evidence can never silently originate from an
unbuilt or dirty tree.

### 7. Activate atomically, order by recorded history, roll back offline

Installers place runtime versions under the documented platform-neutral logical
root chosen at the decision gate. Runtime identity is
`{ contractVersion, sourceRevision, digest, builtAt }`, where `sourceRevision`
is a 40-character commit SHA or `local+<digest12>` for a development build. The
version directory is named `runtime-<digest12>`.

Ordering comes from an append-only `installed.json` history, never from parsing
directory names. Version one retains the active runtime and the most recently
previously-active runtime; it does not automatically prune. Any removal,
including a future prune command, requires separately authorized design and
evidence.

`ai-skills-runtime activate --previous` performs runtime rollback locally with
no network and no `gh`. This matters because rollback must work for a
local-mode user who no longer has the prior source checkout. Skill rollback
remains separate, via `gh skill install --pin <prior>`; the installer receipt
records the prior pin so it stays recoverable.

The launcher is installed as a minimal user-level executable shim; the
installer reports any needed PATH/session action rather than assuming an
ambient shell configuration. On a failed update, the prior active metadata and
runtime remain valid. The default installer does not edit shell startup files
or silently change PATH; the decision gate either retains that explicit
posture or approves an opt-in, reversible registration mode with
platform-specific rollback and fixture coverage.

### 8. Shells orchestrate; one Node utility owns `gh` argv

`scripts/skills/install-global-skill.mjs` already parses and validates source
mode, agent, skill selection, overwrite intent, pinning, and dry-run, and it
redacts credentials from logged commands. The Bash and PowerShell entrypoints
therefore do not reimplement `gh` invocation. Each one preflights Node, builds
or obtains the matching runtime, delegates skill installation to that existing
utility, activates the runtime atomically, and emits the paired receipt.

The shells own only host path, process, and quoting mechanics — exactly the
boundary the Reuse Plan already asserts — which collapses the Bash/PowerShell
parity surface to something that can actually be tested. Node is a hard
prerequisite regardless, so PowerShell delegating to a Node utility costs
nothing. The existing utility gains a machine-readable receipt output so the
shells can consume its result instead of scraping output.

### 9. Preflight the Node runtime

The paired installer and launcher require Node 20 or newer, matching the
`node-version: "20"` pin already used by repository workflows. The helper
sources use only `node:` builtins and static ESM, so no newer floor is
justified by evidence; a higher floor may be adopted only when a specific API
requires it. The installer and launcher MUST preflight an executable compatible
Node runtime before installation or helper dispatch, report a stable
unavailable classification when it is absent or incompatible, and never
download or configure Node implicitly.

### 10. Preserve ownership and authorization boundaries

`gh skill` remains responsible for skill discovery, source metadata, and user
skill-directory conflict behavior. The runtime installer owns only its own
versioned runtime directory, launcher shim, and non-secret activation metadata.

The launcher performs **mechanical target validation only**: absolute,
canonicalized, existing, a Git work tree root, no symlink escape — then passes
the target through unchanged. It does not evaluate whether an operation is
authorized for that target. Authorization remains exclusively in
`scripts/sdd/check-operation-authorization.mjs` and the helper-level checks
that call it. An earlier formulation required the launcher to reject a target
"outside the helper's existing authorization scope"; that is unimplementable
without duplicating policy into the launcher, which would violate the
thin-adapter requirement, so it is removed and replaced by an explicit
scenario asserting the launcher makes no authorization decision.

### 11. Treat installed completeness as an integration contract

Add a scanner that extracts declared runtime helper references from canonical
skills and references. A disposable profile fixture builds/installs the pair,
verifies every discovered helper is in the staged manifest and resolves through
the launcher, and runs representative harmless invocations for both agent
install paths. Existing metadata, adapter-drift, and `gh` installer fixtures
remain; they gain runtime assertions rather than being replaced.

Cross-platform evidence is split by what can be automated. A CI matrix on
Ubuntu and Windows covers the network-free surface: builder determinism,
launcher preflight and failure classification, `--dry-run` receipt parity, and
PowerShell script analysis. `pwsh` is available on Ubuntu runners, so most
parity assertions also run there cheaply. The `gh`-authenticated
installed-profile fixtures stay operator-run and are recorded with tool
versions. If Windows CI is not adopted, documentation marks the PowerShell path
experimental — claiming untested parity is the one outcome this change's
fail-closed posture must forbid.

## Reuse Plan

- **Canonical assets:** runtime manifest, builder, launcher, helper registry,
  and safety/error contracts are assistant-neutral repository assets.
- **Platform exposure:** canonical skill text invokes the neutral launcher;
  Claude/Codex wrappers remain links/pointers and contain no duplicated policy.
- **Existing installer:** shell entrypoints delegate to
  `scripts/skills/install-global-skill.mjs` rather than duplicating `gh` argv,
  source-mode validation, or redaction.
- **Product configuration:** explicit target repository paths are invocation
  inputs. User runtime root and PATH activation are local installation state,
  never committed product settings.
- **Second-product check:** fixtures run against a separate synthetic target
  with different paths and no product-specific constants.
- **Intentional platform behavior:** Bash and PowerShell own only host path,
  process, and quoting mechanics while asserting the same receipt contract.

## Risks / Trade-offs

- [The closure scanner misses a dynamic dependency or data file] → prohibit
  undeclared dynamic local loading for public helpers; declare `assetRoots`;
  smoke-invoke every entrypoint against the staged runtime and fail validation
  on a missing module or asset.
- [A launcher on PATH is absent or shadowed] → verify launcher identity and
  runtime digest before dispatch; report an activation pause, never a fallback
  to workspace-relative scripts.
- [Skills and runtime drift after installation] → declare a contract version,
  fail closed on mismatch, provide `doctor`, and replace the unpaired
  `gh skill update` instruction in the installation guide.
- [A remote source moves between skill and runtime install] → require a tag or
  commit SHA and build both from that resolved revision.
- [Development mode produces misleading evidence] → label every launcher result
  and receipt with `mode: dev | installed` and assert propagation in fixtures.
- [Installer failure leaves partial global state] → validate staging first,
  activate runtime atomically, record phases, and retain the previous active
  runtime; report the incomplete skill/runtime pair for targeted recovery.
- [Runtime packaging broadens execution] → registry-only helper and verb
  dispatch, mechanical target validation, fixed builder roots, no inherited
  credentials injected by the launcher, and preservation of helper-level
  authorization checks. Helpers that shell out to `gh`, `git`, or a reviewer
  process continue to use ambient host credentials exactly as they do today;
  the launcher neither adds nor removes credential access.
- [Long-lived versions consume disk] → retain the active and one prior
  validated runtime; define separately authorized pruning after usage evidence.
- [Node is absent or incompatible] → preflight Node 20 or newer and return a
  classified unavailable result without installing, dispatching, or changing
  host configuration.
- [Windows parity is asserted without evidence] → CI matrix for the
  network-free surface, operator-run evidence for the rest, or an explicit
  experimental designation.
- [Assistants resolve different targets] → require the same explicit absolute
  `--repository` argument contract, reject relative paths, and exercise it in
  cross-assistant fixtures.

## Migration Plan

Phases 1–2, 3–4, and 5–6 are separable and may be delivered as three sequenced
changes; the task groups are ordered so that split costs no rework.

0. Resolve and record the remaining decision-gate items: runtime root and PATH
   activation, and the npm/npx channel confirmation.
1. Add the manifest (including `assetRoots`, `contractVersion`, and invocation
   shapes), builder with smoke validation, executable entrypoints for the five
   library-only helpers, launcher, `doctor`, Node preflight, development mode,
   and fixtures — leaving the source helper tree canonical.
2. Add paired Bash/PowerShell installers in dry-run mode, delegating to the
   existing Node install utility, and prove receipt parity, local mode,
   pinned-remote mode, failure rollback, `activate --previous`, and quoting.
3. Migrate canonical skills and adapters to declared launcher helpers and verbs
   with declared contract versions; reject unresolved legacy `scripts/...`
   references and relative asset defaults through validation.
4. Update the installation guide, including bootstrap by release download and
   attestation, and perform disposable-profile installation evidence for both
   agents.
5. Release only after strict OpenSpec validation, focused runtime tests, skill
   metadata/adapter checks, CI matrix results, and installed-profile evidence
   pass.

Rollback: run `ai-skills-runtime activate --previous` to restore the retained
prior validated runtime offline, reinstall the matched prior skill revision
through `gh skill install --pin <prior>` using the pin recorded in the receipt,
and retain the failed staging receipt for diagnosis. Do not delete runtime
versions or alter target repositories during rollback.
