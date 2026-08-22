## 1. Durable initialization contract

- [x] 1.1 Define the typed initializer request, pending/completed controller
  context, exact v2-run identity binding, and rejection vocabulary at the
  controller/admission boundary. Evidence: focused positive and malformed or
  mismatched-input tests.
- [x] 1.2 Implement the recoverable initialization protocol so lifecycle
  selection is impossible until the exact controller record and v2 admission
  state are mutually verified. Depends on: 1.1. Evidence: injected
  interruption and exact-resume tests prove no orphaned active claim.
- [x] 1.3 Reject retries that conflict on repository, selected entry,
  authorization digest, expiry, controller run ID, v2 parent/work-unit/claim,
  provider, legacy state, or ownership generation. Depends on: 1.2. Evidence:
  focused negative tests preserve unrelated durable state.

## 2. Declared runtime and canonical lifecycle exposure

- [x] 2.1 Expose the initializer as an enumerated
  `initialize-v2-delivery` controller subcommand and declare it in the shared
  runtime manifest. Depends on: 1.2. Evidence: wrapper and installed-runtime
  dispatch tests reject undeclared or malformed requests.
- [x] 2.2 Update the canonical autonomous-delivery/lifecycle skills and
  operator documentation to use the initializer for new v2 runs and to explain
  the safe recovery boundary in plain English. Depends on: 2.1. Evidence:
  documentation review and command-path test.
- [x] 2.3 Update the blocker handoff and roadmap linkage with the permanent
  repair evidence and the M2-S1/M2-S2 follow-through. Depends on: 2.2.
  Evidence: dated, plain-English blocker resolution entry.

## 3. Quality evidence and delivery readiness

- [x] 3.1 Run focused controller/admission/runtime tests and the full Node
  suite; include a second-repository portability fixture, secret scan, and
  recovery/rollback review. Depends on: 2.3. Evidence: current results at the
  reviewed implementation head.
- [x] 3.2 Run strict OpenSpec validation, requirements mapping, and a bounded
  same-session read-only local review; resolve any objective findings with
  fresh affected evidence. Depends on: 3.1. Evidence: change-local verification
  and review records.
- [x] 3.3 Record the exact post-Archive handoff for the still-open
  `repair-m1-s2-v2-terminalization` change: after this repair is merged,
  archived, and its released runtime is installed, a newly authorized M1-S2
  run must start through `initialize-v2-delivery` and prove matching
  controller/admission identities before its first incomplete checkpoint.
  This task prepares the handoff only; it does not start M1-S2 under this
  repair's authorization. Depends on: 3.2. Evidence: dated handoff and
  roadmap record.
