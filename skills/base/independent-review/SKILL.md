---
name: independent-review
description: Obtain and validate an isolated independent AI review for a bounded production-rapid delivery. Use only after current Apply evidence exists and a configured Codex or Claude adapter can create a fresh read-only review; do not use for ordinary self-review, planning, or to bypass an unavailable reviewer.
---

# Independent Review

Run this skill only for the named delivery transition after Apply evidence is
current for its exact head. Read [the protocol](references/protocol.md) before
building a package and [the result contract](references/result-contract.md)
before accepting a result.

## Required Inputs

Require the named transition, configured adapter and attestation, canonical
base and head commit IDs, current Apply validation evidence, allowed OpenSpec
artifact paths, repository path, and implementer-session identity. Do not infer
any missing value. Reject unsupported configuration, absolute paths, secrets,
standing grants, noncanonical commits, or content outside the sealed package.

## Procedure

1. Re-derive durable Git, OpenSpec, checkpoint, authorization, and Apply
   evidence. Stop if evidence is stale or the transition is not authorized.
2. Build the package with `scripts/sdd/independent-review-contract.mjs`; do not
   add conversation history, dispositions as instructions, or an intended
   conclusion.
3. Create a disposable detached view at the exact head and capability-probe the
   selected adapter. Invoke only `scripts/sdd/platform-review-adapters.mjs`.
4. Validate every returned `independent-review-result-v1` with the shared
   canonical validator. An unavailable, malformed, self-review, writable, or
   stale result pauses the transition.
5. Preserve each finding and use the canonical finding state machine. Apply a
   bounded objective correction only when it is behavior-preserving and
   evidence-backed; rerun affected checks and obtain a fresh review for every
   new head.
6. Record only the normalized result, non-sensitive execution reference,
   dispositions, and cleanup result in the durable checkpoint. Remove a review
   view only through its ownership-guarded cleanup helper.

Do not choose, route, or require a model. The adapter determines transport;
the canonical package, result validation, finding policy, and authorization
remain assistant-neutral.

## Result

Return `skill-result-v1` with the selected adapter, review record/result path,
current status, validation evidence, assumptions, and the next safe action.
Use `paused` for unavailable or invalid isolation, a material finding, stale
evidence, or an exhausted correction budget. Do not claim delivery approval.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
