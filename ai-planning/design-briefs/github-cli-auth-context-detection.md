# Design Brief: GitHub CLI Authentication Context Detection

Date: 2026-08-18
Status: Propose-ready design brief. Recommendations are evidence-derived and
must be reviewed in the proposal; no credential or permission bypass is
authorized by this brief.

## 1. Problem and desired outcome

Autonomous SDD delivery can pause after GitHub CLI reports an invalid token in a
restricted execution sandbox even when the same user is authenticated through
the host macOS keychain. The generic 401 message misclassifies a
credential-visibility boundary as an expired or invalid login, causing an
avoidable manual diagnosis cycle.

The desired outcome is a non-secret, deterministic preflight that identifies
the execution context in which GitHub authentication is usable, records a
precise recovery class, and requests the minimum host permission needed for an
already-authorized GitHub operation. It must retain fail-closed behavior when
the credential is genuinely invalid or host permission is unavailable.

## 2. Evidence and key findings

- [2026-08-18 authentication-context observation](../research/github-cli-auth-context-boundary-2026-08-18.md)
  records three restricted-sandbox 401 results followed by successful
  host-keychain status, API, repository, and exact issue-create-or-reuse calls.
- `docs/sdd-workflow.md` correctly treats host authentication and sandbox
  denial as stopping conditions, but does not prescribe a context-aware auth
  classification before a GitHub lifecycle transition.
- `skills/base/autonomous-sdd-lifecycle/SKILL.md` correctly preserves runtime
  permission as separate from authorization, but a generic `gh` 401 currently
  provides insufficient recovery guidance when the keychain is host-only.

The evidence supports a credential-visibility boundary, not a token rotation:
the same active account and scopes were available to the host process moments
after the restricted process returned 401. This is an inference from the
contrasting execution contexts, not a claim about GitHub token validity in
general.

## 3. Options considered and tradeoffs

1. **Context-aware, non-secret preflight (recommended).** Run a bounded
   read-only GitHub identity probe in the current context; if it fails with an
   authentication-shaped error, request the existing host-permission boundary
   for the same probe and classify the contrast. This adds one small check but
   produces truthful recovery guidance.
2. **Treat every 401 as token invalid.** Simple, but repeats the false pause
   observed here and encourages unnecessary reauthentication.
3. **Bridge credentials through an environment variable or repository file.**
   Rejected: it weakens keychain isolation and risks token exposure, persistence,
   or accidental inheritance.
4. **Always run GitHub CLI outside the sandbox.** Rejected: it broadens host
   access unnecessarily and removes a useful permission boundary for
   read-only/local phases.

## 4. Decisions, assumptions, and owner

- Decision owner: Joe Rice.
- Owner-requested outcome: document the recurring false authentication pause,
  recommend a fix, and prepare a brief suitable for OpenSpec Propose.
- Evidence-derived recommendation: add a reusable auth-context probe that
  classifies `authenticated`, `credential-unavailable-in-restricted-runtime`,
  `credential-invalid-or-expired`, `host-permission-denied`, and
  `auth-state-unknown` without storing sensitive values.
- Assumption: the host-permission tool remains the only mechanism allowed to
  access a host-only keychain; a successful preflight does not authorize later
  GitHub writes by itself.

## 5. Scope, non-goals, constraints, dependencies, and risks

### In scope

- A deterministic, non-secret GitHub CLI auth-context diagnostic used before
  lifecycle GitHub operations.
- Durable recovery evidence distinguishing sandbox visibility from an invalid
  credential, without retaining raw CLI output that could contain secrets.
- Exact host-permission retry guidance for the same read-only probe and then
  for the already-authorized operation.
- Tests that simulate restricted/host combinations and regression coverage for
  false pauses.
- Thin Claude/Codex guidance that routes to one canonical implementation.

### Non-goals

- Reauthentication, token generation, token storage, token display, or
  credential scope changes.
- Automatic host escalation without the runtime permission boundary.
- Treating successful host authentication as authorization for unrelated
  repositories, issues, Projects, or writes.

### Constraints, dependencies, and risks

- Depend on the existing runtime permission/evidence model in the autonomous
  SDD lifecycle and the configured GitHub CLI adapter.
- Preserve ordinary behavior for hosts without a keychain and for `GH_TOKEN`
  or other supported GitHub CLI credential sources.
- [False positive classification] → require a read-only identity or repository
  probe in both contexts before emitting the keychain-visibility class.
- [Sensitive diagnostic leakage] → persist only normalized error classes,
  account identity when returned, context type, timestamps, and command kind;
  never token text, environment values, or raw keychain errors.
- [Permission creep] → bind a host retry to the same authorized operation,
  repository, payload digest where relevant, and expiry.

## 6. Open questions and blocking decisions

- No additional product detail is required to begin OpenSpec Propose.
- Proposal should validate the exact supported runtime interface for a
  host-permission retry and decide whether the first release is a shared GitHub
  adapter or an autonomous-SDD-only integration. This is an implementation
  scoping decision, not a prerequisite to the proposal.
- The proposal must define normalization for macOS keychain, Linux secret-store,
  environment-token, and unavailable-CLI cases without platform-specific
  credential reads.

## 7. Recommended next step

Recommendation: run OpenSpec Propose for a focused change tentatively named
`harden-github-cli-auth-context-detection`. Define the non-secret preflight
contract, exact host-retry boundary, durable error classifications, regression
fixtures, and lifecycle integration. Do not implement credential bridging or
weaken host permission. No OpenSpec artifacts were created by this brief.
