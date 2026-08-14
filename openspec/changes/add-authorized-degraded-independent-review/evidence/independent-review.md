# Independent Review Evidence

## Exact reviewed package

- Transition: `merge-pr`.
- Base: `019ce930cbc5b8dc99fff7cd53e08738b0ac871b`.
- Head: `453ac62ee71830aa3ad36fa66644802e145910ad`.
- Manifest:
  `2e9f8da39ca01f24d506eb19bdbbda8bed1835e71a48f523bb5db296a0edca43`.
- Declared committed OpenSpec artifacts: 20.
- Apply evidence: 206 tests passed; focused launcher/request/adapter/lifecycle
  tests passed; focused authorization/execution/recovery tests passed; 22
  strict OpenSpec items passed; adapter drift, metadata, shared guardrails,
  artifact quality, whitespace, and secret-pattern review passed.

## Strict-first attempt

- Assurance requested: `strict-isolated`.
- Result: `unavailable`.
- Stable code: `independent-review-view-create-failed`.
- Review record:
  `strict-unavailable-e6b2e813-3c9f-4723-ba48-1edd0dbbba65`.
- The unavailable result claims no successful isolation controls.

## Authorized degraded result

- Assurance: `authorized-degraded`; this is not strict, OS-isolated,
  read-only-enforced, or security-verified review.
- Review record:
  `degraded-fd8b88c3-756a-4419-bdf2-c760cf76c017`.
- Reviewer: fresh separate `codex-degraded` identity
  `entry1-final-degraded-reviewer`.
- Started: `2026-08-13T20:10:34.227Z`.
- Completed: `2026-08-13T20:12:03.031Z`.
- Status: `passed`.
- Findings: none.
- Dispositions: none required.
- Authorization expiration: `2026-08-14T00:00:00.000Z`.
- Fallback boundary: `fresh-separated-reviewer-only`.
- Launcher: `codex-detached-read-only-v1` with request digest
  `5fef1252c2b3b35e001141610b99ee373a65e11f39fb5721d95ac384a4827e1d`.
- Host execution:
  `2696bfcf-5a62-4ab7-966c-d1b513ff2ed4`.
- Detached-view cleanup: confirmed.

The capability ledger records fresh context, noninteractive execution,
sealed-package-only input, detached view, the inner read-only sandbox, and
credential-access restriction as enforced. Workspace/Git write, GitHub
mutation, authenticated network, external send, deployment, release, and
delegated mutation remain accurately categorized under the degraded contract.
The owner-accepted forgeable-launch-evidence and basename-executable risks
remain accepted, not resolved.

This evidence commit changes the repository head. Therefore it is historical
evidence for task completion, not the final delivery gate by itself. The final
implementation PR gate MUST contain a fresh strict-first result for the exact
post-evidence commit and must preserve the same reduced-assurance disclosures
if degraded fallback is used.

## Zero-touch parent-runtime rehearsal

The redesigned path was exercised without owner actions. Strict detached-view
creation failed with `independent-review-view-create-failed`; the managed
sandbox then validated the recovery request, materialized an exact-head archive
containing only regular committed files, and produced the fixed parent tool
request. Auto-review evaluated the actual escalation. Only host-owned
`/usr/bin/env` and the configured Codex executable ran with parent authority;
repository JavaScript remained inside the managed sandbox. The inner reviewer
used the sealed archived view, disabled network/tool-environment inheritance,
and returned schema-constrained findings. The parent adapter sealed those
findings, the existing response validator accepted them directly, and cleanup
removed the owned archive.

Two accepted failed results demonstrate the full response path and triggered
bounded objective corrections:

- `degraded-9016eeb8-e609-420f-b179-8b21e4d44f3f` identified that delivery did
  not yet enforce review-after-Apply chronology.
- `degraded-c60eefa4-f43a-4800-993b-4acf2d3cfdcc` identified the epoch timestamp
  on synthesized strict-unavailable evidence.

Both remained labelled `authorized-degraded`; their runtime receipts explicitly
set `securityVerifiable: false`, and neither resolves accepted risks `IR-001`
or `IR-002`. The final delivery result is intentionally recorded at the PR gate
after this evidence commit so that it can bind the immutable delivery head.
