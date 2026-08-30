## Context

See `proposal.md` for motivation. Independent-review launchers currently choose
their adapters directly in code. This change introduces a repository-owned,
data-only registry and a small assistant-neutral reader so later wiring can
select an already-supported adapter without duplicating selection policy.

The registry is configuration, not authority. It contains no credentials and
does not launch a reviewer, resolve an executable path, attest isolation, or
weaken the existing strict-first review gates. Existing launchers remain the
only owners of process execution and capability enforcement.

## Goals / Non-Goals

**Goals:**

- Define one versioned registry shape for named reviewer providers.
- Validate provider names and supported adapter, assurance, and transport
  values deterministically before resolution.
- Keep provider lookup side-effect free and preserve existing review selection
  behavior when the registry is absent or invalid.
- Keep the registry and resolver portable across repositories and assistants.

**Non-Goals:**

- Wiring the registry into review dispatch or launcher execution.
- Treating an executable label as a trusted or resolved executable path.
- Adding a new adapter, model-routing policy, credential source, or degraded
  review authorization.
- Replacing launcher-owned executable, capability, package, or result checks.

## Decisions

### Use a versioned JSON registry with a pure validator

The canonical registry lives at `config/reviewer-providers.json`; the resolver
module accepts injected values or a caller-selected file path. Validation uses
closed sets for adapters, assurance levels, and transports and rejects duplicate
provider names and undeclared fields. Successful validation returns sanitized
provider copies containing only the five declared fields. JSON keeps the input
portable and reviewable without adding a dependency.

Alternative considered: encode providers directly in JavaScript. Rejected
because it would keep selection data hardcoded and require code edits for every
repository configuration change.

### Resolve only validated provider data

Lookup is deterministic and read-only. A missing name, malformed registry, or
unsupported value yields no provider rather than falling back to another
provider. The resolver does not execute the `executable` field or claim that it
is trusted; a future dispatch integration must map the selected adapter to its
launcher-owned executable resolution and revalidate the complete provider
binding.

Alternative considered: accept any object with a matching name and let the
launcher reject it later. Rejected because it lets malformed configuration
cross the registry boundary and makes failure dependent on downstream code.

### Preserve current dispatch behavior

This slice has no call-site integration. Existing strict and degraded paths
continue to use their current configured bindings. A follow-on change must
explicitly define precedence, absence behavior, immutable run snapshots, and
launcher compatibility before consuming this registry.

Alternative considered: wire the registry into dispatch immediately. Rejected
because it broadens this recovery PR into security-sensitive process selection
without a complete migration and compatibility design.

## Risks / Trade-offs

- **Registry values could be mistaken for execution authority** → Keep the
  resolver side-effect free, document executable values as inert labels, and
  require launcher-owned trust checks in any future consumer.
- **Adapter, assurance, and transport combinations may be semantically
  incompatible** → Validate supported values now and require the follow-on
  dispatch design to enforce its exact adapter binding before launch.
- **Invalid configuration could silently change review selection** → Return a
  deterministic invalid result and preserve existing selection behavior.
- **The registry can drift from available launchers** → Focused tests cover the
  known first-release entries; later adapter additions must update registry,
  validation, and tests together.

## Test and Evidence Strategy

- Focused Node tests cover valid resolution, invalid entries, duplicate names,
  file loading, and the default path.
- The full SDD test suite guards against review-gate and runtime regressions.
- `openspec validate --all --strict` validates the change and living specs.
- Review checks the module for secret handling, path/executable trust,
  portability, and accidental launch behavior.

Completion evidence is the focused and full test output, strict OpenSpec
validation, an exact-head independent review, and passing PR checks.

## Security, Recovery, and Migration

The registry contains no secrets, arguments, environment variables, or
credential references. Registry text is untrusted configuration data and is
never executed by this slice. File-read and JSON failures return typed invalid
results without mutating state.

Migration is additive: land the registry and resolver while existing dispatch
remains unchanged. Rollback removes the two new assets and their tests. Because
there is no consumer in this slice, rollback does not alter active review
selection or durable controller state.

## Attribution and Licensing

No third-party code or dependency is introduced. The implementation uses only
Node.js built-ins and repository-owned contracts.

## Reuse Plan

- **Canonical assets:** the JSON registry and assistant-neutral resolver module
  are the only behavior sources.
- **Product configuration:** repositories may supply their own provider data;
  reusable code contains no repository, Project, branch, credential, or local
  absolute-path constants.
- **Platform exposure:** no Claude- or Codex-specific wrapper is required for a
  data-only module; launchers remain separate platform adapters.
- **Second-product portability:** tests use temporary paths and synthetic
  provider names rather than this repository's GitHub identity.
- **Intentional product-specific behavior:** the checked-in default registry
  names the launchers available to this repository, while the validator and
  resolver remain portable.
