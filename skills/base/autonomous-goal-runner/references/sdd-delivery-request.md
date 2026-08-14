# Concise SDD Delivery Request

Use this contract when a user asks the autonomous runner to deliver one named
OpenSpec change or an ordered queue. Before work selection or mutation,
normalize the request with
`scripts/sdd/resolve-sdd-delivery-request.mjs` and report its effective
authorization.

## Required Inputs

- `target`: one OpenSpec change name or an explicitly ordered list of names.
- `mode`: `autonomous` or `interactive`.
- `qualityProfile`: `production-rapid` or `prototype-rapid`.
- `authorizationProfile`: `sdd-delivery`.
- `independentReviewPolicy`: `strict-only` or
  `strict-first-degraded`.
- `expiration`: a positive duration such as `12h` or a future ISO-8601 UTC
  timestamp.

The assistant may map unambiguous labels such as `Profile`, `Authorization`,
and `Independent review` to these fields. It may infer the target only when the
user explicitly names the change or ordered queue. It must not infer a missing
risk-bearing field from silence.

If any input is missing, invalid, or conflicting, do not select work, create an
issue, edit OpenSpec, create a branch, or mutate GitHub. Send the resolver's one
consolidated clarification: each affected field, one short explanation, and
its supported values or form.

## Preset Meanings

`production-rapid` retains full production-quality implementation and
artifacts, focused tests, security and secret review, portability,
attribution, requirements mapping, recovery review, formal Verify, current-head
independent review, and strict OpenSpec validation. `rapid` means routine
in-scope lifecycle transitions and up to three materially different
behavior-preserving corrections per failure signature do not require repeated
conversation. It does not weaken quality gates.

`sdd-delivery` permits only the selected work's linked issue and Project item,
OpenSpec planning and implementation, branch, implementation/Sync/Archive pull
requests and merges, issue closure, Project Done status, and deletion of
confirmed merged change-owned branches. It excludes deployment, release,
credential or scope changes, external messages, and unrelated mutations.

`strict-only` pauses when strict OS-isolated independent review is unavailable.
`strict-first-degraded` always attempts strict review first. After durable exact-
package unavailability, it permits a fresh, separate, transition-bound degraded
review and the configured Codex or Claude review-launcher recovery for the same
change, head, manifest, correction envelope, and expiration. Recovery prepares
a structured request in the implementation sandbox; production orchestration
passes it directly to the configured parent-runtime transport, and acceptance
records the directly captured runtime receipt. Codex maps the fixed operation
to an actual escalated shell-tool request eligible for Auto-review under an
interactive approval policy. That receipt and the basename-checked executable identity
are not cryptographically authenticated in the first release. The selection is
the owner's affirmative reduced-assurance risk choice; derive the exact
authorization only when the package and transition exist.

The preset is authorization, not runtime permission. If the configured launcher
cannot run under the platform's active permission policy, record terminal
unavailable evidence and pause without asking the owner to run or relay
anything. The controller and host never self-escalate; the parent transport
uses the runtime's policy-governed approval boundary and never replaces the
detached inner read-only reviewer with an unsandboxed or package-only reviewer.
