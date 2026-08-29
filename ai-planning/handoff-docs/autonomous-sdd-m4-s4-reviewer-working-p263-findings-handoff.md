# M4-S4 — Reviewer Working + PR #263 Findings Handoff

Date: 2026-08-29
Status: Handoff for a **new session**. Grants no authorization; every mutating
action still needs fresh owner authorization. Durable Git, GitHub, OpenSpec, and
controller state outrank this document.

## TL;DR

- Campaign: M4-S4 single-change autonomous SDD reliability, **1/10 completions**.
- Skill #3 = `typescript-javascript-review` (`add-typescript-quality-overlay`)
  — still blocked, but the **independent review machinery now works** (that was
  the prior blocker).
- This session merged `add-codex-subprocess-review-adapter` (#267) and then
  fixed its JSONL-parsing bug (`repair-codex-subprocess-jsonl-parsing`, #269).
  Both are archived.
- The Codex subprocess reviewer (`authorized-degraded`) now runs from a plain
  shell and produces real results. It reviewed PR #263 and found **2 genuine
  findings**.
- **Next-session primary task:** fix the 2 findings in PR #263, re-review,
  then review + merge #265, reinstall the runtime, reconcile the stale
  checkpoint, and resume Run #3.

## What the review found (PR #263)

The Codex degraded reviewer produced this `authorized-degraded` result (the
first real review the framework has produced end-to-end):

| Severity | File | Finding |
|---|---|---|
| `high` | `scripts/sdd/autonomous-sdd-legacy-reconciliation.mjs` | Do not issue a schema-5 reconciliation receipt from generic delivery evidence. Validate immutable terminalization or cancellation archive evidence and bind it explicitly to the checkpoint's `runId`, `repository`, `selectedEntry`, and `recordDigest` before reconciliation. |
| `objective-fix` | `scripts/sdd/autonomous-sdd-legacy.mjs` | Restrict the new ambiguous-record reconciliation branch to `schemaVersion === 5`. The current `legacy-schema-unknown` condition also permits future or otherwise unsupported schemas to become `compatible-terminal`. |

Both findings are in code on PR #263's branch; they must be fixed there before
#263 can merge.

## Current state (verified 2026-08-29)

- `main` head `49c5778`, working tree clean.
- Open PRs: **#263** (`repair-stale-controller-record-recognition`), **#265**
  (`add-configurable-reviewer-providers`). Both unreviewed.
- Merged + archived this session: **#267** (`add-codex-subprocess-review-adapter`),
  **#269** (`repair-codex-subprocess-jsonl-parsing`).
- Stale terminalized checkpoint `controller-3f48e2d4…` (Run #2, `currentPhase=propose`)
  still blocks Run #3's `initialize-v2-delivery`.
- Installed runtime (`ai-skills-runtime`) is STALE — its `sourceRevision`
  (`4ad0a677…`) predates #267/#269. Reinstall after the repair PRs merge.

### PR base/head (needed to build review packages)

- #263: base `71320382940526fa97ad2a9557d28a172f9caa30`, head
  `fd5630cd36f21ccdfbcc1cd0f674e5ed1e1e3ffb`, branch `repair/stale-controller-record-recognition`.
- #265: base `342e918d1671b151df49aacc90fc7bd3fb884f8a`, head
  `9730abaa14054733b1a604c7a239f99a0fbe0331`, branch `feature/add-configurable-reviewer-providers`.

## How to run a Codex degraded review (this now works)

Run from the workspace (imports `scripts/sdd/...` from the `main` checkout, so
the fixed adapter is used). Set `HOME` explicitly so Codex auth (`~/.codex/auth.json`)
is found. The codex review takes ~60-120 s, so run it backgrounded:

```bash
HOME=/Users/joerice nohup node /tmp/review-pr.mjs \
  71320382940526fa97ad2a9557d28a172f9caa30 \
  fd5630cd36f21ccdfbcc1cd0f674e5ed1e1e3ffb \
  repair-stale-controller-record-recognition > /tmp/review-263.out 2>&1 &
```

The script (`/tmp/review-pr.mjs` is ephemeral — recreate from the flow below):

```js
import { buildReviewPackage } from ".../scripts/sdd/independent-review-contract.mjs";
import { createArchivedReviewView, removeArchivedReviewView } from ".../scripts/sdd/detached-review-view.mjs";
import { runCodexReviewAdapter, runCodexSubprocessReviewAdapter, writeReviewPackageForView } from ".../scripts/sdd/platform-review-adapters.mjs";

const [base, head, changeName] = process.argv.slice(2);
const repositoryPath = "/Users/joerice/git/joericearchitect/joericearchitect-ai-skills";
const schemaPath = repositoryPath + "/schemas/independent-review-findings-v1.schema.json";
// artifactPaths = the PR's changed files; validationEvidence = the PR-body
// "node --test ..." / "openspec validate ..." strings.
const pkg = buildReviewPackage({ repositoryPath, baseCommit: base, headCommit: head, artifactPaths, validationEvidence });
const created = createArchivedReviewView({ repositoryPath, headCommit: head });
const view = created.view;
writeReviewPackageForView(view, pkg.package);
const strictAdapter = runCodexReviewAdapter({ reviewPackage: pkg.package, view, schemaPath,
  reviewer: { type: "codex", identity: "strict-codex-reviewer" },
  attestationRef: "attestations/codex-read-only-v1.json" });
const result = runCodexSubprocessReviewAdapter({ reviewPackage: pkg.package, view, schemaPath,
  resultPath: "/tmp/result.json", reviewer: { type: "codex-degraded", identity: "autonomous-codex-reviewer" },
  attestationRef: "attestations/codex-read-only-v1.json", strictResult: strictAdapter.result,
  degradedAuthorization: { change: changeName, transition: "merge-pr",
    expiresAt: "2026-08-30T23:59:59.000Z", riskReason: "owner-authorized autonomous repair closeout",
    fallbackBoundary: "fresh-separated-reviewer-only" }, executable: "/usr/local/bin/codex" });
console.log(JSON.stringify({ status: result.status, assurance: result.result?.assuranceLevel, findings: result.result?.findings }));
removeArchivedReviewView(view);
```

Interpret the output: `status: "passed"` + empty `findings` = clean; `status:
"failed"` with `findings[]` = the reviewer found issues (each has `severity`,
`evidence`, `recommendation`); `status: "unavailable"` = the transport failed
closed (diagnose from `unavailableCode`).

## Next steps (in order)

1. **Fix PR #263's 2 findings** on branch `repair/stale-controller-record-recognition`:
   - Restrict the reconciliation branch to `schemaVersion === 5`
     (`scripts/sdd/autonomous-sdd-legacy.mjs` `inventoryLegacyRecords`).
   - Harden `reconcileLegacyBootstrapRecord` / receipt validation to require
     immutable terminalization-or-cancellation archive evidence bound to the
     checkpoint `runId`/`repository`/`selectedEntry`/`recordDigest`
     (`scripts/sdd/autonomous-sdd-legacy-reconciliation.mjs`).
   - Update the reconciliation tests accordingly.
2. **Re-review #263** (script above) until `passed`/no findings.
3. **Review #265** the same way; fix + re-review any findings.
4. **Merge #263 + #265** (squash) → sync specs → archive each; **reinstall the
   runtime** so the controller picks up all framework changes.
5. **Reconcile the stale checkpoint** `controller-3f48e2d4…` via
   `reconcileLegacyBootstrapRecord({ authorization, legacy, evidence })`
   (`scripts/sdd/autonomous-sdd-legacy-reconciliation.mjs`). **Requires an owner
   `authorizationScopeDigest` binding** (exact `reference` + `recordDigest` +
   `scopeDigest` + future expiry) — pause and get owner sign-off for this step.
6. **Resume Run #3**: `ship-sdd add-typescript-quality-overlay prod` (do the
   roadmap brief-validation pass on `standards-driven-quality-skills.md` first).

## Key files + commands

- Reviewer adapter: `scripts/sdd/platform-review-adapters.mjs`
  (`runCodexSubprocessReviewAdapter`, now parses JSONL via
  `parseCodexReviewEventStream`).
- JSONL parser: `scripts/sdd/codex-review-event-contract.mjs`
  (`parseCodexReviewEventStream`).
- Findings schema: `schemas/independent-review-findings-v1.schema.json`.
- Review package/view: `scripts/sdd/independent-review-contract.mjs`
  (`buildReviewPackage`), `scripts/sdd/detached-review-view.mjs`
  (`createArchivedReviewView`).
- Stale-checkpoint code (has the findings): `scripts/sdd/autonomous-sdd-legacy.mjs`,
  `scripts/sdd/autonomous-sdd-legacy-reconciliation.mjs`.
- Campaign roadmap: `ai-planning/plans/m4-s4-qualification-campaign-roadmap.md`.
- Issues log: `ai-planning/notes/autonomous-sdd/m4-s4-qualification-issues.md`.
- Tests: `node --test scripts/sdd/test/*.test.mjs`.
- Validate: `openspec validate --all --strict`.
- Runtime reinstall: `scripts/runtime/install-runtime.mjs` (build + activate;
  also `scripts/runtime/build-runtime.mjs`).
- Authorize a run: `ship-sdd <change> prod` (autonomous strict-only, 4h).

## Gotchas (do not relearn)

- `codex exec --json` emits **JSONL**, not one JSON doc. Do NOT parse with a
  single-document parser; use `parseCodexReviewEventStream` (this was the #269
  bug).
- Run the reviewer with `HOME=/Users/joerice` and background it (`nohup … &`)
  — it takes ~1-2 min and the shell tool has a 30 s timeout.
- `createArchivedReviewView` returns `{ available, view }`, not the view directly.
- The strict Codex path is still parent-capture only (`runCodexReviewAdapter` is
  a stub returning `independent-reviewer-codex-capture-parent-required`); the
  subprocess adapter is `authorized-degraded`, never `strict-isolated`.
- Branch every delivery from `origin/main`. PR body needs **both** `Closes #NNN`
  **and** `OpenSpec change: <name>`, plus a `tracking.yaml` with the matching
  issue (linkage CI enforces this).
- A `skip_specs: true` change is valid for pure implementation bug fixes (see
  archived `repair-codex-subprocess-jsonl-parsing`).
