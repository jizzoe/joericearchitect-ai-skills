# Planning Review

Status: passed

- Scope and non-goals are constrained to an explicit degraded-review exception;
  standing fallback, model routing, credentials, external messages, releases,
  and deployments are excluded.
- Requirements cover exact authorization, strict-first evidence, fallback
  freshness/sealed/detached constraints, assurance distinction, capability
  ledger, findings, correction envelopes, current-head rereview, and recovery.
- Dependencies are satisfied by the delivered isolated-review, bounded runner,
  shared schema/guardrail, and lifecycle foundation capabilities.
- Security: untrusted package content remains data, credentials and mutation
  authority are excluded, and false strict-isolation claims fail validation.
- Portability: reusable assets contain no owner, Project, branch, credential,
  absolute-path, or product-specific constant; second-workspace tests are
  planned.
- Attribution: no dependency, third-party code, or external asset is planned.
- Stable tasks have explicit dependencies and evidence; task batches are
  authorization/result contracts, execution/checkpoint integration,
  documentation/evals, then verification/review.
- Objective planning defects found by artifact validation were corrected and
  revalidated; no material open decision remains because the owner supplied
  the design brief and bootstrap policy.
- The redesign closes the failed assumption that an unspecified runtime would
  invoke a prepared host request. Production orchestration now owns a terminal
  parent-runtime transport transition: invoke and validate, or record stable
  unavailable evidence without an operator command or payload relay.
- Codex maps only that fixed operation to an actual escalated shell-tool
  request eligible for Auto-review. The controller and host remain
  assistant-neutral, and the inner reviewer remains separately restricted and
  labelled `authorized-degraded`.
- Runtime receipts must identify their actual source and remain ordinary,
  non-security-verifiable evidence; the design removes the misleading
  `attestedBy: trusted-runtime` claim from the new transport contract.
- Automatic correction and changed-head rereview are explicitly in scope,
  bounded to three materially different corrections per failure signature.
  Denied, absent, timed-out, or malformed transports fail closed; no manual
  `host-debug` or equivalent fallback is permitted.
- Official OpenAI documentation confirms that Auto-review evaluates eligible
  escalated shell requests only under an interactive approval policy and does
  not expand the sandbox. The design therefore treats it as the parent
  transport reviewer, never as inner-reviewer authority.

Evidence:

- `openspec validate add-authorized-degraded-independent-review --strict`
- `node scripts/validation/validate-openspec-artifacts.mjs openspec/changes/add-authorized-degraded-independent-review`
- `node scripts/validation/validate-tracking.mjs openspec/changes/add-authorized-degraded-independent-review/tracking.yaml`
- `git diff --check`
- https://learn.chatgpt.com/docs/sandboxing/auto-review
- https://learn.chatgpt.com/docs/agent-approvals-security
