## 1. Status classification and discovery

- [x] 1.1 Implement the pure, deterministic classification (eight classes) and
  the stop-reason bucket mapping.
- [x] 1.2 Implement repository-wide discovery of active and archived runs by
  canonical identity.
- [x] 1.3 Add classification and discovery tests. Depends on: 1.1, 1.2.

## 2. Status projection, resume, and rebuild

- [x] 2.1 Implement the versioned `run-status` projection with linked evidence.
- [x] 2.2 Implement safe-resume/no-op/pause with wrong-identity rejection.
- [x] 2.3 Implement read-only projection rebuild from history.
- [x] 2.4 Add projection, resume, and rebuild tests. Depends on: 2.1, 2.2, 2.3.

## 3. Validation and evidence

- [x] 3.1 Run the focused status suite and the full SDD suite; run
  `openspec validate --all --strict`. Depends on: 1.3, 2.4.
- [x] 3.2 Record completion evidence and mark the M2-S3 brief delivered; keep the
  result contract-only/audit. Depends on: 3.1.
