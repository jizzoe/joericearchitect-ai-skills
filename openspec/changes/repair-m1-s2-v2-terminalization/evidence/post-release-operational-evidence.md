# Post-release operational evidence

Observed and reconciled on 2026-08-22 for the post-release tasks that could
not be completed before the terminalization runtime was delivered.

## Original M1-S2 terminalization

- Parent run: `m1-s2-20260821-131722-parent`
- Work unit: `m1-s2-20260821-131722-workunit`
- Claim: `m1-s2-20260821-131722-claim`
- Selected change: `unify-autonomous-sdd-operation-contract`
- Terminalization request digest:
  `b26f16a8e06b2ab994ca8c09e0482b9f0eb16d165eff2cae6ef47f261b46f087`
- Terminal state: `complete`; claim disposition: `released`; cleanup
  disposition: `completed`
- Final delivered head: `9090b0028888a475c610f00756c6dc57cbc98ad0`
- Delivery reference: issue #158 and PRs #159, #160, and #161

The exact bundle is present in the configured immutable archive at
`archive/2026/08/21/m1-s2-20260821-131722-parent/`. Its
`claim-release.json` names the same claim, repository, and work unit with
disposition `released`. The repository run index no longer selects that run as
active.

## Subsequent M1-S3 admission and completion

After the M1-S2 claim was released, normal v2 admission created the distinct
M1-S3 identities:

- Parent run: `m1-s3-20260821-170800-parent`
- Work unit: `m1-s3-20260821-170800-workunit`
- Claim: `m1-s3-20260821-170800-claim`
- Selected change: `establish-autonomous-sdd-runtime-config-provenance`

M1-S3 then completed its implementation and follow-up delivery. Its immutable
terminalization receipt has request digest
`aad5c36c1c8ecc672645861a42403acbc31ca0f08837ab49dec5a021a5917dce`,
terminal state `complete`, claim disposition `released`, cleanup disposition
`completed`, and final head
`2cf39b93e4d14f0373112e75bf091bf2acc19599`. The delivery reference names
issue #165 and PRs #166, #167, and #169.

This is stronger than a synthetic admission probe: the later admitted run
completed and was independently terminalized without reviving or rewriting the
original M1-S2 records.

## Current closeout reconciliation

Issue #162 is closed with labels `sdd` and `type:bug`. Its Project 1 item
`PVTI_lAHOADpDHM4Bfzvdzg3mCwA` was reconciled to `Done` on 2026-08-22.
The new closeout delivery began through installed
`initialize-v2-delivery`; its controller, parent, work unit, claim, repository,
authorization, expiry, and provider identities match exactly. This current
claim belongs only to the repair closeout and must be terminalized after
Archive and exact cleanup.
