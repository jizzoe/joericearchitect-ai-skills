## Context

See [proposal.md](proposal.md) and the delta specs. The strict v1 review path
already seals a package, creates a detached view, probes Codex/Claude adapters,
validates a common result, and binds review evidence into the delivery checker.
It deliberately fails closed if the adapter cannot prove OS-isolated read-only
execution. This change needs an explicit owner-selected exception without
turning a runtime limitation into silent policy.

## Goals / Non-Goals

**Goals:**

- Preserve strict-isolated review as the only default path.
- Allow one exact, expiring, owner-authorized fallback only after a durable
  strict unavailable result for the same sealed package.
- Bind reduced assurance and all remaining capability restrictions to durable
  checkpoint and delivery evidence.
- Keep canonical policy adapter-neutral and platform wrappers transport-only.

**Non-Goals:**

- Do not let configuration, an adapter, a PR label, or a reviewer choose
  degraded review; do not broaden credentials, networking, mutation tools, or
  model-routing policy.
- Do not make a fallback claim OS isolation or edit normal user settings.

## Decisions

### 1. Extend the current v1 record instead of adding an unbounded side channel

`independent-review-result-v1` gains an `assuranceLevel` discriminator,
capability ledger, strict-unavailable precursor, and degraded authorization
record. Strict values remain explicit and fully validated; degraded values have
their own required fields and reject assertions of strict isolation/read-only
enforcement. This preserves one package/result validator and prevents delivery
from accepting a loose auxiliary file.

Alternative: a second opaque fallback format. Rejected because its bindings,
findings, and recovery path could drift from the delivery gate.

### 2. Validate authorization before invoking the fallback

Add a pure validator that receives the run authorization, selected change and
transition, current SHA/manifest, strict unavailable record, current time, and
correction context. It returns a stable failure code and a normalized record.
The operation checker calls this only after strict review has failed unavailable
and before accepting a degraded result. It is not an adapter capability or
configuration feature flag.

Alternative: adapter decides whether to downgrade. Rejected because it makes
transport choose authorization and cannot bind risk acceptance to delivery.

### 3. Use a separately named degraded adapter result path

The platform adapter creates a new noninteractive process and the existing
owned detached view. Its fixed request exposes only the sealed package and
allowlisted inspection commands. It scrubs known credential variables and
disables configured GitHub, web, deployment, release, external-send, and
delegated-mutation tools where the runtime permits. The capability ledger
accurately categorizes controls as enforced, unavailable, or
instruction-constrained; it does not claim an OS boundary where one cannot be
proven.

Alternative: use a same-session subagent. Rejected because it receives
implementation history and cannot establish independent freshness.

### 4. Keep delivery evidence exact and re-evaluable

Checkpoint review records retain a strict unavailable precursor and, when
eligible, one exact degraded result. The delivery checker recomputes package
and authorization bindings, verifies the assurance discriminator, and applies
the existing result/finding logic. A new head or correction causes strict-first
re-evaluation. The one-time queue-1 bootstrap record uses the same durable
shape but is scoped in the run authorization and expires at Archive merge.

## Risks / Trade-offs

- **Reduced enforcement on some hosts** → Require affirmative, exact,
  expiring owner risk acceptance; show assurance prominently.
- **Schema compatibility drift** → Test strict v1 fixtures and malformed
  degraded fixtures through the same validator.
- **Fallback accidentally gains authority** → Fixed adapters, capability
  ledger, secret/environment tests, and no mutation-capable command path.
- **Resume ambiguity** → Re-derive strict record, authorization, package,
  result, checkpoint, and transition from durable records.

## Verification Strategy

Run deterministic authorization, schema, contract, adapter, checkpoint, and
delivery-gate tests for strict success, strict unavailable, valid degraded,
and every malformed/expired/mismatched rejection path. Run synthetic
second-workspace portability, command-injection, secret, security, and
thin-adapter-drift checks,
then formal OpenSpec validation and independent review for the exact Apply head.

## Attribution and Licensing

No third-party code, model provider, dependency, or asset is introduced. Any
future platform invocation remains a product-owned adapter configuration; the
canonical change retains existing repository licensing and attribution rules.

## Recovery

On interruption or invalid evidence, preserve the branch and re-read Git,
OpenSpec, authorization, strict unavailable result, sealed manifest, degraded
result, checkpoint, issue, Project, and transition state. Never retry a
materially identical correction past the active budget or translate strict
unavailability into a standing exception.

## Migration Plan

1. Add schema and pure authorization/capability validators with fixtures.
2. Extend canonical review execution, adapters, checkpoint, delivery gate, and
   canonical documentation without changing strict behavior.
3. Add focused deterministic tests and recorded planning/Apply evidence.
4. Use the bootstrap authorization only for this change's delivery review;
   archive terminates it. Revert by removing the feature from a future change;
   existing strict records and fail-closed behavior remain intact.

## Reuse Plan

Product-neutral contracts live in schemas, `scripts/sdd`, and the canonical
skill. The selected change, transition, SHA, expiry, reason, and reviewer are
runtime evidence. Claude/Codex wrappers remain thin and are checked for drift.
A second-workspace fixture uses different relative artifact/evidence paths and
contains no repository owner, Project, branch, credentials, or product data.
