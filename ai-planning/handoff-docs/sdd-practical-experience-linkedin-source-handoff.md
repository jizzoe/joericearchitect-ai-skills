# SDD in Practice: Workflow, Framework Capabilities, and Lessons Learned

- Date: 2026-08-14
- Purpose: source material for a future LinkedIn post or article about practical
  specification-driven development and harness engineering
- Repository: `jizzoe/joericearchitect-ai-skills`
- Case study: `add-authorized-degraded-independent-review`
- Related issue: `#84`
- Related delivery PR: `#90`
- Audience: engineering leaders, architects, AI-assisted development
  practitioners, and developers evaluating SDD
- Status: experience report and writing handoff; **not** delivery approval or
  current-head review evidence

## 1. Why This Document Exists

This document preserves the detailed story behind a real OpenSpec SDD change so
that a later writing session can turn it into concise LinkedIn posts, diagrams,
or an article. The goal is not to present a frictionless success story. The
useful story is that the workflow worked as a quality system, found defects that
ordinary happy-path testing missed, and also exposed a flaw in its own
automation design.

The case study is the implementation of an authorized degraded independent-
review path. The feature was meant to preserve a strong strict-review default
while allowing a precisely authorized, lower-assurance review when strict
isolation was objectively unavailable. It involved authorization policy,
sandbox boundaries, exact-head evidence, security controls, review result
contracts, correction budgets, lifecycle automation, Codex and Claude adapters,
and user-facing delivery profiles.

The implementation took longer than expected. That is part of the value of the
case study. Seventeen evidence-backed correction records were created as fresh
reviewers found defects in successive exact heads. The resulting controls grew
meaningfully stronger, but the session eventually discovered that the outer
host-launch step still depended on the owner manually relaying a command. That
manual relay contradicted the intended autonomous workflow even though the
individual controller and host components passed their tests.

The central message for future writing is:

> SDD is not valuable because it predicts the perfect implementation. It is
> valuable because it makes intent, risk, evidence, corrections, and unresolved
> gaps durable enough to survive a long, imperfect implementation loop.

## 2. The Repository in Plain Language

`joericearchitect-ai-skills` is a repository of reusable AI-assisted software
delivery assets for Claude and Codex. It is more than a collection of prompts.
It contains:

- canonical skills and workflows;
- thin assistant-specific discovery wrappers;
- OpenSpec proposals, specifications, designs, task plans, and living specs;
- deterministic validators and authorization checkers;
- schemas for durable machine-readable evidence;
- fixtures, evaluations, and scenario matrices;
- GitHub issue, pull-request, Project, Sync, and Archive integrations;
- bounded autonomous execution and recovery rules;
- independent-review adapters and result validation; and
- documentation for setup, operation, recovery, and portability.

The normal lifecycle is:

```text
Issue
  -> Explore
  -> Propose: proposal + delta specs + design + tasks
  -> planning review
  -> Apply
  -> Verify
  -> implementation PR and delivery
  -> Sync delta requirements into living specs
  -> Archive the completed change
```

The separation between stages is intentional. Propose does not silently grant
permission to implement. Apply does not automatically grant permission to
merge. A passing review does not grant permission to release, deploy, or mutate
unrelated systems. Each transition has its own authorization, runtime
permission, evidence, and recovery boundary.

### 2.1 Core capabilities

The framework provides several related capability groups:

1. **Specification-driven lifecycle**

   OpenSpec artifacts preserve why a change exists, what behavior is required,
   how it should be designed, which tasks implement it, and what evidence proves
   completion. Sync and Archive preserve the relationship between historical
   change artifacts and current living specifications.

2. **Bounded autonomous execution**

   Long-running work begins with an explicit objective, selected change or
   queue, authorized mutation classes, forbidden actions, evidence gates,
   expiration, correction budget, and stopping conditions. Runtime permission
   is checked separately and cannot broaden that authorization.

3. **Durable recovery**

   Git, OpenSpec, checkpoints, evidence files, issues, PRs, and Project records
   are authoritative on resume. The agent continues from durable state instead
   of trusting conversation memory or claiming completion from a command that
   merely ran.

4. **Cross-assistant portability**

   Canonical policy lives under shared `skills/base`, `workflows`, schemas, and
   scripts. Claude and Codex wrappers are deliberately thin. Drift checks ensure
   assistant exposure does not silently fork the underlying policy.

5. **Quality and guardrails**

   Tests, strict OpenSpec validation, schema checks, artifact-quality rules,
   secret review, security review, portability checks, attribution review,
   recovery review, and independent review operate as layered sensors. Unsafe
   inputs and high-impact transitions fail closed.

6. **GitHub lifecycle traceability**

   Issues, Projects, branches, PRs, Sync, Archive, issue closure, Project status,
   and merged-branch cleanup can be linked to an exact selected change. Reusable
   assets do not hard-code product-specific repository or Project constants.

7. **Independent AI review**

   For high-stakes production work, a fresh reviewer receives a sealed package
   tied to exact Git commits and current validation evidence. It does not receive
   implementation-session history or an intended conclusion. Its findings are
   immutable evidence; the implementer records dispositions separately.

### 2.2 This is harness engineering, not just prompt engineering

The repository is closest to harness engineering in the following ways:

- `AGENTS.md`, skills, specifications, designs, and task plans are **guides**
  that shape behavior before the agent acts.
- Tests, validators, schemas, reviews, and evals are **sensors** that evaluate
  the result after or during action.
- Deterministic authorization checks and schemas are **computational controls**.
- Fresh independent AI review is an **inferential control** used where semantic
  inspection adds value beyond deterministic checks.
- Sandboxes, operation allowlists, exact targets, expirations, and credential
  boundaries form the runtime control plane.
- Correction budgets, checkpoints, and exact-head rereview form the feedback
  loop.
- Durable evidence and GitHub/OpenSpec linkage provide observability and
  traceability.

The model is only one component. The system around the model determines what it
can see, what it may change, how errors are detected, how far it may retry, and
what proof is required before a lifecycle transition.

## 3. The Problem This Change Tried to Solve

The repository already had strict isolated independent review for
`production-rapid` delivery. That strict path intentionally paused if its
runtime could not prove a fresh, isolated, read-only review boundary.

The new change addressed a practical problem: a managed sandbox can sometimes
prevent detached worktree creation, nested reviewer startup, or another strict
runtime prerequisite even when an owner still wants a separate best-effort
quality review. The desired solution was not a silent downgrade. It was a
bounded exception with explicit risk acceptance.

The change therefore proposed:

- strict review remains the default and is always attempted first;
- strict unavailability is durably recorded for the exact package;
- degraded review requires an affirmative, exact, expiring authorization;
- the fallback applies only to one change and named transition;
- the fallback reviewer is still fresh, separate, noninteractive, detached,
  and restricted as far as the runtime can enforce;
- the result is labelled `authorized-degraded`, never strict;
- a capability ledger separates enforced, unavailable, and instruction-
  constrained controls;
- every result remains tied to exact base, head, manifest, reviewer,
  transition, expiration, and findings;
- every correction creates a new head and therefore requires fresh review; and
- Codex and Claude use the same assistant-neutral contracts even though their
  platform adapters differ.

The design explicitly accepted two first-release degraded-path risks:

- parent-launch evidence was ordinary data rather than OS-protected,
  cryptographic attestation; and
- the reviewer executable was basename-checked rather than pinned to a trusted,
  host-owned binary.

Those risks were recorded as accepted limitations, not falsely marked as
resolved controls. Strict review was not weakened.

## 4. Risk-Tiered Delivery Profiles

One of the framework's strongest ideas is that autonomy, approval frequency,
and quality assurance are separate policy dimensions. “Rapid” should not
automatically mean “careless,” and “production” should not automatically mean a
human must approve every routine step.

### 4.1 Current request vocabulary

A concise SDD delivery request resolves these fields before work selection or
mutation:

- `target`: one change or an explicitly ordered queue;
- `mode`: `autonomous` or `interactive`;
- `qualityProfile`: `production-rapid` or `prototype-rapid`;
- `authorizationProfile`: `sdd-delivery`;
- `independentReviewPolicy`: `strict-only` or
  `strict-first-degraded`; and
- `expiration`: a bounded duration or future timestamp.

If a risk-bearing field is absent or invalid, the resolver asks once for all
missing inputs before mutation. It does not silently infer risk acceptance.

### 4.2 `production-rapid`

`production-rapid` means production-grade evidence with reduced routine
conversation. It retains:

- complete production-quality implementation and artifacts;
- focused and broad tests;
- security and secret review;
- portability and attribution checks;
- requirement-to-evidence mapping;
- recovery review;
- formal Verify;
- strict OpenSpec validation;
- current exact-head independent review; and
- a bounded correction loop, normally no more than three materially different
  behavior-preserving attempts per failure signature.

“Rapid” in this profile means that routine, already-authorized lifecycle
transitions and objective corrections do not require repeated conversational
approval. It does **not** mean skipping the quality gates.

### 4.3 `prototype-rapid`

`prototype-rapid` is the lower-stakes path. The current framework clearly
supports a different approval posture: an interactive one-change prototype can
use exact, time-bounded preapproval for named high-impact transitions rather
than stopping for repeated just-in-time prompts. The production independent-
review gate is applied specifically to `production-rapid`, so a prototype can
avoid that production-only workload while still requiring authorized targets,
runtime permission, current evidence, recovery behavior, and lifecycle gates.

The framework's direction is to let prototypes use less evidence and lower
assurance when that trade-off is explicit. However, the current artifacts define
the approval and independent-review differences more precisely than they define
a complete gate-by-gate reduced-quality matrix. This is an important caveat for
future public writing: do not claim that every prototype check has already been
formally classified as required, optional, or omitted.

That gap itself produced a useful design lesson:

> A risk-tier name is not enough. Each profile should publish a concrete matrix
> of required gates, relaxed gates, omitted gates, approval behavior, evidence
> retention, and promotion criteria.

### 4.4 Independent-review policy is a separate choice

- `strict-only` stops when strict isolation is unavailable.
- `strict-first-degraded` still attempts strict review first, but permits the
  exact bounded fallback after durable unavailability and explicit risk
  acceptance.

This separation lets a team choose quality level, interaction mode, mutation
scope, and review assurance deliberately instead of hiding them inside one
ambiguous “fast” switch.

## 5. The Workflow We Actually Followed

### 5.1 Start with a durable problem and scope

The work began with GitHub issue `#84` and an OpenSpec change named
`add-authorized-degraded-independent-review`. The proposal defined the problem,
scope, non-goals, affected capabilities, compatibility expectations, security
posture, and reusable-versus-product-specific boundaries.

Important non-goals included standing fallback permission, credentials,
external messages, deployments, releases, arbitrary model selection, silent
risk inference, and weakening strict review.

### 5.2 Write behavior before implementation

The change created:

- a proposal explaining why and what would change;
- four delta specifications;
- a design with seven explicit architecture decisions;
- fourteen implementation and evidence tasks with dependencies; and
- a planning review before Apply.

The delta specs ultimately described nine requirements and thirty-eight
scenarios. They covered positive cases, malformed and expired authorization,
wrong transitions, stale heads, capability misstatement, unavailable launchers,
symlink escapes, self-review, correction chains, findings, and recovery.

This mattered later. Review defects could be classified as violations of
durable requirements rather than debated from memory.

### 5.3 Implement in dependency-valid layers

The task order moved from policy to execution:

1. authorization and result contracts;
2. strict-first orchestration;
3. restricted degraded adapters;
4. checkpoint and delivery-gate evidence;
5. launcher recovery;
6. concise request resolution;
7. Claude parity;
8. documentation, portability, and evals; and
9. verification and independent review.

This ordering reduced accidental coupling. Schemas and pure validators existed
before adapters and high-impact lifecycle gates depended on them.

### 5.4 Build a sealed exact-head review package

The review package bound:

- canonical full base and head commit IDs;
- the complete base-to-head diff;
- declared OpenSpec artifact paths and hashes;
- current validation evidence; and
- a canonical manifest digest.

Artifacts were eventually read from regular Git blobs rather than trusted
through checkout filesystem paths. The reviewer worked against a disposable
detached exact-head view. A head change invalidated the old review package and
result.

### 5.5 Attempt strict review first

The strict path tried to start a fresh, noninteractive, read-only reviewer. In
the managed environment, strict startup was unavailable. The workflow recorded
that stable failure instead of silently converting it into success.

Under the explicitly selected degraded policy, the controller prepared a
digest-bound host request. The host revalidated the request, created a detached
view, rebuilt the package, invoked a restricted inner reviewer, returned a
structured result, and cleaned the owned temporary view.

### 5.6 Treat review findings as inputs to a bounded correction loop

Fresh review repeatedly found defects. Each objective finding was:

1. preserved as immutable reviewer evidence;
2. dispositioned separately by the implementer;
3. checked for scope, behavior preservation, evidence, and budget;
4. corrected;
5. validated with affected and broad checks;
6. committed as a new head;
7. sealed into a new package; and
8. reviewed again.

Findings requiring product, architecture, security-posture, compatibility,
licensing, governance, data-ownership, or scope judgment were intended to pause
for a human. High severity alone did not force a human pause if the fix was
objective and safely bounded. Conversely, an objective-fix disposition could
not authorize delivery before the correction and fresh review occurred.

### 5.7 Preserve a correction chain rather than overwrite history

The change accumulated seventeen globally ordered correction records. Each
record retained its source finding, failure signature, prior head and manifest,
new head and manifest, evidence reference, and attempt count. Budgets were
enforced per immutable failure signature rather than as one arbitrary global
cap.

That history made the process long, but it also made the learning auditable.

### 5.8 Run layered verification

The recorded validation included:

- 213 passing Node tests at the local evidence snapshot;
- 35 focused authorization, launcher, adapter, result, and delivery-gate tests;
- 54 focused launcher, request, adapter, and lifecycle tests;
- 15 focused authorization, execution, and recovery tests;
- adapter drift validation;
- skill metadata validation;
- shared guardrail validation;
- OpenSpec artifact-quality validation;
- strict validation of the active change;
- `openspec validate --all --strict`, with 22 items at that snapshot;
- whitespace review; and
- secret-pattern review.

The exact counts changed on later remote heads, which is another reason to bind
claims to a named evidence snapshot rather than treat counts as timeless facts.

### 5.9 Discover that component success was not workflow success

The launcher controller and host were tested as separate components. However,
the production orchestration path stopped at:

```text
review-launcher-external-host-required
```

No Codex-facing parent-runtime adapter translated that state into an actual,
narrowly scoped escalated tool request. The session used the owner as the
missing transport by asking for repeated `host-debug` execution.

That was the decisive workflow defect. The manual executions produced useful
reviews and ultimately a no-findings result for one reviewed head, but they did
not prove autonomous delivery. A successful reviewer output is not proof that
the user experience or orchestration contract is correct.

The delivery was therefore stopped without discarding the work. A separate
zero-touch redesign handoff now requires the missing parent transport and an
end-to-end rehearsal.

## 6. What the Seventeen Corrections Taught Us

The review loop found problems across multiple layers, not just syntax or test
coverage.

| Attempt | Defect found | What changed | Broader lesson |
|---:|---|---|---|
| 1 | Degraded authorization could expire while review was running | Recheck exact authorization with a fresh clock after review | Authorization must remain valid at acceptance, not only at invocation |
| 2 | Reviewer subprocesses inherited ambient environment values | Build subprocess environments from a closed operational allowlist | Credential scrubbing should be allowlist-first, not blacklist-only |
| 3 | External host trusted the supplied sealed package | Rebuild and canonically compare the package from the detached Git view | Verify important evidence at the trust boundary that consumes it |
| 4 | Reviewer could retain home-directory credential access | Restrict Codex command reads and give Claude an isolated empty home | A read-only workspace is not the same as no credential access |
| 5 | The new Codex permission profile failed to deserialize | Correct strict-config serialization without broadening access | Security configuration needs an exercised runtime test, not only structural tests |
| 6 | Package injection could follow a pre-existing file or symlink | Use exclusive creation and fail closed | Reserved paths in untrusted checkouts are attack surfaces |
| 7 | Artifact hashing could follow filesystem symlinks | Read only regular blobs from the exact Git tree | Immutable object databases are safer sources than checkout paths |
| 8 | Checkpoint inspection enforced a stale global correction cap | Enforce three attempts per immutable failure signature | Budgets must match the unit of failure they intend to limit |
| 9 | Launcher recovery did not strongly bind implementer identity | Digest-bind distinct implementer and reviewer identities and recheck them | “Separate reviewer” must be validated as data, not asserted in prose |
| 10 | A caller could bypass the production review gate through profile mismatch | Bind request profile to durable authorized quality profile | Risk profiles must come from durable authorization, not caller convenience |
| 11 | Caller-supplied correction counters could reset or widen the budget | Derive counters from the validated checkpoint | Security- or budget-relevant counters must come from durable state |
| 12 | A caller could rename a failure signature | Derive it from the exact durable review finding | Stable identities need canonical provenance |
| 13 | Correction records could be disconnected or reordered | Anchor and validate every predecessor head and manifest | An audit trail needs cryptographic-style linkage, not just a list |
| 14 | Degraded expiration could exceed the enclosing goal | Bound all fallback expirations to the goal and recheck at each boundary | Nested permissions must never outlive their parent authorization |
| 15 | Capability ledger omitted known authenticity limitations | Require those controls in the `unavailable` class | Known risks should be machine-readable, not buried in prose |
| 16 | A disposition could let an unresolved objective fix authorize delivery | Add severity/disposition compatibility and a `correction-required` state | Classification must route work correctly; a label is not completion |
| 17 | Slash-concatenated failure fields could collide | Use unambiguous escaping/framing | Canonical identifiers require collision-safe encoding |

This correction history provides strong examples for a public post because the
findings are concrete. They show that independent review added value beyond the
implementer's tests and that security often fails at boundaries between valid
components.

## 7. What Worked Well

### 7.1 The spec kept the objective stable

The implementation crossed schemas, scripts, sandbox policy, subprocess
environments, Git object handling, lifecycle checks, and assistant adapters.
Without durable requirements and non-goals, each correction could easily have
expanded scope or weakened the original strict-first posture.

### 7.2 Exact-head review prevented stale confidence

Every correction invalidated the prior pass. This was inconvenient but correct.
A review result describes one exact artifact, not “roughly the same branch.”

### 7.3 Negative scenarios produced real security value

Symlinks, stale clocks, inherited credentials, self-review, profile mismatch,
counter manipulation, disconnected chains, and ambiguous identifiers were all
failure-oriented cases. The strongest improvements came from asking how the
contract could be bypassed, not only whether the happy path ran.

### 7.4 Durable evidence made recovery possible

The work survived long sessions, new heads, manual interruptions, and session
handoffs because evidence was stored in Git and OpenSpec rather than only in
conversation. The next session could re-derive the state.

### 7.5 Severity and decision type were separated

A high-impact issue can still have a deterministic, behavior-preserving fix. A
lower-severity issue can still require product judgment. Routing by disposition
keeps humans focused on judgment instead of using severity as a blunt proxy for
whether an agent may continue.

### 7.6 Accepted risk was explicit

The degraded path did not pretend to provide strict assurance. The capability
ledger and accepted-risk evidence made the remaining limitations visible and
machine-checkable.

### 7.7 Canonical policy remained portable

Assistant-neutral contracts were shared while platform-specific invocation
stayed in adapters. Product constants remained in configuration and run
records. This is essential for reusable AI delivery assets.

## 8. What Did Not Work Well

### 8.1 We validated the pieces but missed the orchestration seam

The controller could prepare a request. The host could execute one. The response
validator could accept a result. But no production adapter connected the parent
runtime to the host automatically. Mocked or direct host tests gave confidence
in the pieces while the end-to-end user journey remained incomplete.

### 8.2 Manual work became normalized

Once the owner successfully ran the debug command, the session repeated that
pattern after each new head. The workflow was following the exact-head rule but
violating the higher-level usability requirement. Repetition should have been
treated as evidence of a missing automation capability, not as a normal step.

### 8.3 “No self-escalation” was interpreted too broadly

The guardrail was meant to stop arbitrary privilege expansion. It did not mean
that a canonical controller must hand work to a person. The correct design was
an assistant-neutral prepared operation translated by a platform adapter into a
policy-governed parent-runtime request. The inner reviewer should remain
restricted; the parent launch is the separate boundary.

### 8.4 Task completion overstated workflow completeness

All fourteen tasks were marked complete because their specified component and
synthetic evidence existed. The missing end-to-end transport was not expressed
as a hard acceptance scenario. “14/14 complete” was internally consistent but
did not mean the user's actual workflow was complete.

### 8.5 The prototype profile remains less explicit than the production profile

The framework expresses the production quality contract in detail. The
prototype path is clearer about reduced prompts and omission of production-only
independent review than about every other validation trade-off. A public claim
about “relaxed quality” should acknowledge this and frame the explicit matrix as
the next maturity step.

### 8.6 The correction loop was valuable but expensive

Seventeen new heads meant repeated validation, sealing, review, evidence, and
handoff work. The loop improved the system, but earlier threat modeling and
boundary-first tests likely would have caught several classes of defect before
runtime review.

## 9. What We Would Do Differently

### 9.1 Specify the user-visible outcome first

Add an acceptance requirement such as:

> After the owner starts a bounded run, strict failure, authorized fallback,
> findings, objective corrections, fresh review, and delivery proceed without
> Terminal commands, copy/paste, approval relays, or manufactured attestations.

This would have made the missing parent transport visible before task 2.4 was
considered complete.

### 9.2 Model the entire trust-boundary sequence before coding

Draw or write the sequence explicitly:

```text
implementer
  -> strict reviewer attempt
  -> recovery controller
  -> parent runtime policy/approval adapter
  -> external host launcher
  -> detached view
  -> restricted inner reviewer
  -> host response
  -> runtime-originated evidence
  -> response validator
  -> finding router
  -> correction loop or delivery gate
```

For each arrow, define who constructs the data, who validates it, which
permissions apply, and how failure is recorded.

### 9.3 Require one real end-to-end rehearsal early

Before expanding the full schema and evidence surface, prove the narrow vertical
slice: strict failure automatically invokes the parent transport, runs the
restricted reviewer, returns the result, cleans up, and performs no user relay.
Then harden each boundary.

### 9.4 Threat-model paths, environments, clocks, identities, and counters

Several corrections came from the same general class: accepting caller-
controlled state at a trust boundary. A structured threat-model checklist would
have asked early about:

- symlink and reserved-path behavior;
- Git object versus checkout provenance;
- inherited environment and home access;
- caller-selected clocks;
- caller-selected counters and identifiers;
- parent and nested expiration relationships;
- implementer/reviewer identity separation; and
- response and cleanup binding.

### 9.5 Define the profile matrix explicitly

Publish a table for each quality profile showing:

- required tests and validations;
- independent-review requirement;
- security and secret checks;
- portability and attribution checks;
- approval frequency;
- permitted correction budget;
- evidence retention;
- allowed mutation classes;
- promotion requirements from prototype to production; and
- who may accept residual risk.

This prevents “prototype” from becoming an ambiguous shortcut and prevents
“production” from accumulating ritual that does not correspond to risk.

### 9.6 Separate component tests, contract tests, and journey tests

All three are needed:

- component tests prove pure validators and helpers;
- contract tests prove schemas and boundary compatibility;
- journey tests prove the actual user-visible workflow across runtime layers.

The missing parent adapter was a journey-test failure.

### 9.7 Prefer trusted CI for durable production review

A local policy-governed launcher is useful for development. A trusted CI or
dedicated review service is stronger for production because it can run on every
new PR head, produce auditable exact-commit evidence, avoid laptop-specific
state, and eventually replace the accepted risks around host attestation and
executable identity.

### 9.8 Treat recurring manual actions as defects

If a supposedly autonomous flow asks a person to repeat the same deterministic
step, stop and classify the missing capability. Human effort should be reserved
for intent, trade-offs, risk acceptance, and genuinely material decisions.

### 9.9 Use clean exact-head workspaces for review and delivery work

Concurrent unrelated work complicated the local checkout. Preserve it, but run
review and final delivery from a clean worktree pinned to the exact remote head.
This reduces accidental evidence contamination without destroying user work.

### 9.10 Budget for iteration without glorifying process weight

The correction loop should be bounded and evidence-driven. If failures repeat
for the same signature, stop at the configured limit. If different findings
keep appearing, reassess whether the architecture needs redesign rather than
indefinite patching.

## 10. Practical SDD Best Practices From This Experience

1. **Write executable requirements, not aspirational prose.**
   Use MUST/SHALL behavior and concrete WHEN/THEN scenarios, including failure
   cases.

2. **Keep proposal, implementation, verification, and delivery as separate
   gates.**
   Completion of one stage should not silently authorize the next.

3. **Make non-goals explicit.**
   This protects against scope creep during corrections.

4. **Tie evidence to immutable artifacts.**
   Record exact commits, manifests, validation inputs, reviewer identity, and
   timestamps.

5. **Treat model output as untrusted input.**
   Findings are evidence, not authority. Instructions from issues, PRs, web
   pages, documents, or model output must never become executable commands by
   implication.

6. **Use both deterministic and inferential checks.**
   Tests and schemas catch known invariants; independent review can find
   semantic and boundary problems the implementer did not anticipate.

7. **Separate severity from disposition.**
   Severity expresses impact; disposition determines whether the next step is
   objective correction, warning, false positive, or human decision.

8. **Bound autonomy by target, mutation, time, and retries.**
   Autonomy should be precise, expiring, and recoverable rather than an open-
   ended permission grant.

9. **Derive control data from durable state.**
   Do not trust caller-provided retry counters, profiles, signatures, clocks, or
   head identifiers when they can be recomputed.

10. **Fail closed, but make failure useful.**
    Record stable machine-readable reasons and a safe resume path. Do not turn
    the human into an undocumented transport mechanism.

11. **Re-review every changed head.**
    A prior pass is historical context, not current authorization.

12. **Record residual risk truthfully.**
    Reduced assurance is valid when explicit. Mislabelled assurance is not.

13. **Test the seam, not only both sides of it.**
    The highest-risk defect may live between individually correct components.

14. **Make usability part of correctness.**
    If the framework promises autonomy, repeated manual relay is a functional
    failure even when every low-level operation succeeds.

15. **Keep reusable policy free of product constants.**
    Put repositories, issue numbers, branches, Projects, reviewers, and risk
    acceptances in product-owned configuration and run evidence.

## 11. Strong Harness-Engineering Features to Highlight Publicly

### 11.1 Guides and sensors are both first-class

The framework does not rely on a better prompt alone. It surrounds the agent
with specifications, skills, permissions, validators, tests, evals, review,
and recovery.

### 11.2 The reviewer is separated from the implementer

The reviewer is fresh, receives sealed exact-head input, and does not receive
the desired conclusion. This reduces confirmation bias and makes review output
portable across assistants.

### 11.3 Quality is risk-tiered

High-stakes production work can retain formal Verify, strict validation,
security checks, and exact-head independent review. Lower-stakes production
work can reduce repeated approval prompts through bounded authorization without
discarding production quality. Prototype work can choose a lower-cost path with
reduced production-only review overhead, while still retaining explicit scope,
runtime permission, and lifecycle safety.

### 11.4 Autonomy is a contract, not a vibe

The runner knows what it may change, what it may never change, when it expires,
which evidence it needs, how many corrections it may try, and which decisions
still belong to a human.

### 11.5 Recovery is designed in

Long sessions and failures are expected. Durable checkpoints and exact evidence
make a new session safer than relying on remembered conversational context.

### 11.6 The framework is self-critical

The independent-review feature found defects in its own independent-review
implementation. The final manual-relay discovery then showed that even a strong
quality harness must test its own usability and end-to-end orchestration.

## 12. Claims Suitable for a LinkedIn Post

These claims are supported by the case study when phrased carefully:

- “Our independent-review loop found seventeen distinct defects across
  security, authorization, evidence integrity, and orchestration.”
- “The most valuable findings were not syntax errors; they were trust-boundary
  problems involving credentials, symlinks, clocks, identities, and durable
  state.”
- “Every correction invalidated the prior review because evidence was bound to
  the exact Git head.”
- “We separated finding severity from whether a human decision was actually
  required.”
- “Production-rapid meant full production checks with fewer routine approval
  interruptions—not lower quality.”
- “The workflow eventually caught a defect in itself: tested controller and
  host components were not connected by a zero-touch parent-runtime adapter.”
- “A passing review result proved the reviewed code, not the usability of the
  delivery workflow.”
- “The durable spec let us stop delivery without throwing away the work, reopen
  the missing acceptance requirement, and hand off cleanly.”
- “The practical value of SDD was not perfect prediction; it was controlled
  convergence.”

## 13. Claims That Need Caveats

- Do not say the degraded reviewer is equivalent to strict isolation. It is an
  explicitly reduced-assurance path with known authenticity limitations.
- Do not say PR `#90` was ready to merge merely because a manual review returned
  no findings for one head. The zero-touch workflow requirement remained open,
  and every new head needs fresh evidence.
- Do not say the workflow was fully autonomous. The manual host relay proved it
  was not.
- Do not say `prototype-rapid` has a complete formal reduced-quality matrix.
  Its approval and production-independent-review differences are defined; the
  rest of the relaxation model needs further specification.
- Do not present test counts without identifying the evidence snapshot. The
  repository continued to evolve.
- Do not imply that SDD removes the need for judgment. It relocates human effort
  toward intent, architecture, risk, and accountability.

## 14. Possible LinkedIn Narrative Structures

### Option A: “Seventeen findings later”

1. Open with the surprising count: seventeen correction records.
2. Explain that the feature under construction was independent AI review.
3. Give three memorable findings: inherited credentials, symlink escape, stale
   authorization.
4. Explain exact-head rereview and bounded correction.
5. Reveal the meta-failure: manual host relay meant the workflow was not truly
   autonomous.
6. Close with controlled convergence as the real value of SDD.

### Option B: “A passing test suite was not enough”

1. Start with 200-plus passing tests and strict OpenSpec validation.
2. Explain why a fresh reviewer still found trust-boundary defects.
3. Map the framework to guides, sensors, computational controls, and inferential
   controls.
4. Contrast production, lower-friction production, and prototype profiles.
5. Close with the need for end-to-end journey tests.

### Option C: “Autonomy is a contract”

1. Contrast open-ended agent autonomy with bounded authorization.
2. Show target, mutation, evidence, expiration, review, and retry boundaries.
3. Explain how objective fixes continue automatically while genuine human
   decisions pause.
4. Discuss the failed manual-relay design and why humans should not become
   infrastructure.
5. Close with risk-tiered quality and trusted CI as the next step.

### Option D: Short post series

1. What SDD changed about the implementation workflow.
2. Why exact-head independent review matters.
3. Five trust-boundary bugs a normal happy-path test might miss.
4. Production-rapid versus prototype-rapid.
5. The automation seam we missed and what we would change.
6. Why this repository is an example of harness engineering.

## 15. Useful Plain-English Translations

| Framework term | Plain-English explanation |
|---|---|
| Exact-head evidence | Proof tied to the precise code commit being delivered |
| Sealed package | A tamper-evident bundle of code differences, specs, and current validation evidence |
| Strict isolated review | A fresh reviewer whose read-only isolation is runtime-enforced and validated |
| Authorized degraded review | An explicitly accepted, lower-assurance fresh review used only after strict review is unavailable |
| Capability ledger | A machine-readable list of which safety controls are enforced, unavailable, or instruction-only |
| Correction budget | A limit on how many materially different fixes the agent may try for the same failure |
| Durable checkpoint | Repository-backed state that a later session can verify and resume |
| Disposition | The evidence-backed decision about what a finding requires next |
| Thin adapter | Platform-specific discovery or transport that delegates policy to canonical shared assets |
| Harness engineering | Designing the operating environment, controls, feedback, and evidence around the AI agent |

## 16. Future Framework Improvements Suggested by the Case Study

1. Implement the missing zero-touch parent-runtime review transport.
2. Add a trusted CI or dedicated independent-review service for every new PR
   head.
3. Add end-to-end journey tests that cross the actual approval and sandbox
   boundary.
4. Publish the complete quality-profile gate matrix.
5. Add a first-class harness inventory mapping each guide and sensor to its
   lifecycle stage, owner, validation command, and drift detector.
6. Promote recurring security-boundary checks into shared threat-model and
   skill-authoring checklists.
7. Add telemetry for correction count, failure signatures, runtime
   unavailability, manual interventions, and time spent per lifecycle gate.
8. Define promotion criteria from prototype evidence to production evidence.
9. Continue testing cross-assistant parity without duplicating canonical
   policy.
10. Treat any repeated manual deterministic step in an autonomous workflow as
    a reportable harness defect.

## 17. Source Material for the Future Writing Session

Start with these repository files:

- `docs/sdd-workflow.md`
- `docs/sdd-foundation-operations.md`
- `docs/autonomous-sdd-lifecycle.md`
- `docs/autonomous-run-enablement.md`
- `docs/research/aidlc/harness-engineering/harness-engineering-findings.md`
- `skills/base/autonomous-goal-runner/references/authorization-policy.md`
- `skills/base/autonomous-goal-runner/references/sdd-delivery-request.md`
- `skills/base/independent-review/SKILL.md`
- `skills/base/independent-review/references/protocol.md`
- `openspec/changes/add-authorized-degraded-independent-review/proposal.md`
- `openspec/changes/add-authorized-degraded-independent-review/design.md`
- `openspec/changes/add-authorized-degraded-independent-review/tasks.md`
- `openspec/changes/add-authorized-degraded-independent-review/specs/`
- `openspec/changes/add-authorized-degraded-independent-review/evidence/`
- `ai-planning/handoff-docs/zero-touch-independent-review-redesign-handoff.md`

The evidence directory is especially important. It contains the correction
history that turns general lessons into credible real-world examples.

## 18. Closing Synthesis

This case study supports a balanced view of SDD.

The process was heavier and longer than a conventional “prompt the agent and
review the diff” workflow. Some of that cost came from the intrinsic complexity
of security-sensitive autonomous review. Some came from weaknesses that should
have been caught earlier. Some came from exact-head discipline doing exactly
what it was designed to do.

The outcome was not a perfect first-pass implementation. It was a progressively
hardened system with a durable record of why each control exists. Independent
review found defects the implementer had not anticipated. Deterministic checks
prevented stale or manipulated evidence from authorizing delivery. Explicit
risk profiles allowed strict production assurance, lower-friction production
operation, and prototype-oriented trade-offs to coexist without pretending they
were equivalent.

The most important final lesson is that a quality framework must evaluate
itself at the level the user experiences it. Component correctness, passing
tests, and a no-findings review were not enough when the owner still had to act
as the transport between two automated components. The right response was to
stop delivery, preserve the evidence, add the missing user-visible requirement,
and redesign the seam.

That is the strongest practical argument for SDD and harness engineering:

> They do not eliminate surprises. They turn surprises into bounded,
> explainable, testable improvements instead of undocumented improvisation.
