## Context

See [proposal.md](proposal.md) for the motivation and
[the delta spec](specs/sdd-requirements-to-plan/spec.md) for the behavioral
contract. The canonical executor already treats outcome validation as a
required injected dependency and independently verifies its content digest.
The repository launcher currently injects bounded workspace I/O but omits that
dependency. Fixture tests therefore exercise a test-only callback rather than
the installed runtime path.

The existing `sdd-requirements-to-plan` skill promises a bounded validator but
does not define a production-owned grammar. The repair must preserve the
executor's second digest/non-empty boundary, keep the installed Claude and
Codex exposure thin, and make an intentional fail-closed migration decision.

## Goals / Non-Goals

**Goals:**

- Supply one assistant-neutral, production-owned v1 validator to every
  installed planning-runtime invocation.
- Make parsed outcomes deterministic, content-bound, and safe to consume as
  data by the existing executor.
- Prove equivalent direct and installed-wrapper behavior with isolated,
  synthetic test workspaces.

**Non-Goals:**

- Infer outcomes from legacy documents or support a compatibility parser.
- Alter design-brief approval, write authorization, plan generation, or the
  wider Run #2 recovery work.
- Treat outcome text as authority to perform OpenSpec, GitHub, or external
  actions.

## Decisions

### Canonical v1 grammar and result

Create a dedicated canonical module under `scripts/sdd/` that accepts only
requirements content and returns either a deterministic invalid result or:

```js
{
  valid: true,
  requirementsSha256: "<sha256 of exact input bytes>",
  observableOutcomes: ["<outcome> — Acceptance: <acceptance>"]
}
```

The parser will require this exact, ordered structure:

```md
<!-- ai-skills-requirements-outcomes: v1 -->

## Accepted outcomes

- Outcome: <non-empty observable behavior>
  Acceptance: <non-empty observable verification evidence>
```

The marker is the first non-empty line. The exact heading follows it after
optional blank lines. The section contains one or more consecutive top-level
outcome bullets, each immediately followed by a two-space-indented acceptance
line; any missing field, duplicate/alternate structure, or empty list is
invalid. The parser stops at the next level-two heading and rejects trailing
unparsed content inside the accepted-outcomes section. To make the v1
"vague" rejection deterministic, an outcome or acceptance field is also
invalid if it is whitespace-only, punctuation-only, or normalizes to one of
`TBD`, `TODO`, `N/A`, or `unknown`; broader subjective quality assessment
remains the existing candidate-readiness responsibility.

The module will use an intentionally small deterministic denylist for
instruction-like control text (for example, attempts to override prior/system
instructions, invoke tools, or request an external mutation). It will not
attempt a model-based semantic safety judgement. Outcome and acceptance text
remain data; the denylist merely makes the explicit contract's
instruction-like rejection testable and stable.

This is selected over caller receipts because a caller can forge or reuse one,
and over heuristic parsing because an unversioned document is ambiguous. A
strict grammar makes migration visible and keeps the accepted behavior
portable across assistants.

### Trust boundary and launcher injection

`scripts/runtime/bin/research-planning-skill-runtime.mjs` will import the
canonical validator and add it to the injected I/O/dependency object for
`execute-sdd-requirements-to-plan`. The launcher will not read a validator,
outcomes, or digest from the payload. The executor will retain
`validateRequirementsOutcomeEvidence` as a second boundary: it calls the
injected validator with resolved immutable requirements data and recomputes
the SHA-256 digest before a write is considered.

This preserves one trust boundary at the repository-owned launcher while
allowing the executor to remain independently testable. It is chosen over
moving parsing into the payload wrapper, which would duplicate planning policy
or broaden the wrapper's role.

### Skill and exposure alignment

Update `skills/base/sdd-requirements-to-plan/SKILL.md` to publish the exact v1
input contract, fail-closed migration behavior, and the fact that callers do
not supply validation receipts. Preserve the generated Codex and Claude
wrappers as thin references to the canonical skill; no product-specific
paths, credentials, or assistant-specific parser are added.

### Test and distribution evidence

Add focused tests for the canonical validator and adapt the existing planning
fixtures to use it rather than a permissive test callback. Add an installed
launcher regression test using a temporary synthetic repository populated with
the required inputs and the launcher's existing workspace-I/O containment. It
will demonstrate that valid v1 input creates only the authorized temporary
plan artifact, while invalid, forged, stale, legacy, vague, and
instruction-like inputs pause before any temporary plan write. The test will
not create actual OpenSpec or GitHub records.

Run the runtime build and installation/distribution checks against a clean,
versioned runtime to demonstrate that the generated launcher includes the
injection. This catches the original direct-helper-versus-distributed-runtime
gap.

Expected implementation touch points are:

- new canonical validator under `scripts/sdd/`;
- `scripts/sdd/research-planning-skill-runtime.mjs`;
- `scripts/runtime/bin/research-planning-skill-runtime.mjs`;
- `skills/base/sdd-requirements-to-plan/SKILL.md`;
- `evals/skills/sdd-requirements-to-plan/run-fixtures.test.mjs`; and
- focused runtime/validator tests under `scripts/runtime/test/` and/or
  `scripts/sdd/`.

## Risks / Trade-offs

- **Existing requirements fail after the change** → This is intentional and
  documented as a migration requirement; no heuristic fallback can silently
  authorize planning.
- **A strict grammar rejects a legitimate future style** → Introduce a future
  explicitly versioned contract rather than widening v1 parsing.
- **A denylist misses novel prompt-injection wording** → Content is still data
  and cannot alter the fixed operation plan; use adversarial tests for the
  bounded patterns and keep external mutations outside validation.
- **Launcher and canonical behavior drift** → Maintain one imported validator,
  test the installed wrapper, and include runtime distribution evidence.

## Migration Plan

1. Implement and test the canonical parser, launcher injection, and skill
   documentation on this issue's topic branch.
2. Migrate any requirements document that must be planned by adding the exact
   v1 marker, heading, and complete outcome/acceptance pairs; legacy documents
   continue to pause until migrated.
3. Build and install a clean runtime version, then run direct, installed-wrapper,
   and strict OpenSpec validation before delivery.

Rollback removes the new runtime version or reverts the topic-branch change.
The prior runtime's missing injection remains a safe pause, so rollback cannot
silently authorize planning. Requirements documents may retain their v1 block;
they are inert data for older runtimes.

## Reuse Plan

The parser, digest binding, and launcher injection are canonical reusable
assets. Repository/workspace paths remain supplied through the existing
bounded runtime environment, and no GitHub, Project, branch, label, or
credential is embedded. Claude and Codex use the same installed helper and
canonical base skill. A second-product portability check will run the wrapper
against a separate synthetic repository with only configuration inputs,
confirming no dependency on this repository's product data. No external code
or attribution is introduced.
