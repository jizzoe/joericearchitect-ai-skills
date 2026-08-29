# Add TypeScript Quality Overlay

Date: 2026-08-29
Status: Slice design brief derived from the program brief
`standards-driven-quality-skills.md` (M3, first half). Planning input only; it
grants no authorization. The run is authorized separately
(`ship-sdd add-typescript-quality-overlay prod`, strict-only, 4h).

## Problem and desired outcome

Reusable quality skills have `base-code-review`, `base-verification-loop`, and
the shared `standards-pack` selection contract, but no stack-specific
TypeScript guidance. This slice adds the first JavaScript-family overlay so
generation, review, and verification select TypeScript-specific rules without a
generic standard overriding a repository's actual toolchain.

## Scope

Add a thin **TypeScript-first** review overlay that delegates the review process
and verification lifecycle to `base-code-review` and `base-verification-loop`,
and adds TypeScript-specific standards, anti-patterns, tool-discovery, and
evidence expectations. TypeScript is the default JavaScript-family overlay; a
JavaScript **compatibility mode** loads only the repository's configured
lint/test rules and optional `checkJs` and must not claim TypeScript
guarantees.

Canonical assets:

- `skills/base/typescript-javascript-review/` — thin `SKILL.md` plus progressive
  `references/`, consistent with the repo's `skills/base/` convention.
- A `standards/` reference holding TypeScript rules, anti-patterns, and evidence
  expectations (loaded after the shared `standards-pack` selection).

## Non-goals

- React web overlay (a dependent overlay, deferred).
- A dedicated JavaScript standards pack (deferred until the compatibility mode
  proves insufficient).
- The generation-consumption interface (queued separately as row #11).
- Product commands, SDK versions, paths, credentials, or external mutation.

## Decisions (resolved in the brief scan)

1. **Location** — `skills/base/typescript-javascript-review/`; the repo
   convention wins over the program brief's `skills/stacks/` proposal.
2. **JS compatibility mode** — per program brief decision 3 (configured
   lint/test rules + optional `checkJs`; no TypeScript guarantees claimed).
3. **Generation deferred** — the overlay ships standards + review now; the
   generation side is wired by row #11.
4. **Sources** — TypeScript official guidance + Metabase production review
   structure (Metabase-local conventions removed); provenance recorded from
   `ai-planning/research/quality-standards-source-baseline.md`.

## Acceptance criteria

- Synthetic fixtures cover type/null/unsafe-`any`, async/error, contract, and
  test evidence.
- Rules from an unselected stack do not trigger.
- A finding identifies rule, source, path evidence, severity, and disposition.
- Absent required tooling produces a visible gap/block, never a passing claim.
- Review remains read-only; Claude and Codex adapters stay thin and equivalent.

## Open questions

None blocking. (Generation-consumption is intentionally deferred to row #11.)
