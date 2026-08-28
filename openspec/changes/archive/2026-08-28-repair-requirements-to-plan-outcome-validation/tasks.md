## 1. Canonical outcome-validation contract

- [x] 1.1 Add the assistant-neutral v1 requirements-outcome validator under `scripts/sdd/`, including exact-marker, heading, pair, observable-evidence, instruction-like-content, and SHA-256 result rules from the delta spec.
- [x] 1.2 Add focused deterministic tests for valid v1 input and malformed, empty, vague, instruction-like, legacy, and changed-content cases; assert invalid cases return no usable receipt.

## 2. Planning runtime integration

- [x] 2.1 Inject the canonical validator from `scripts/runtime/bin/research-planning-skill-runtime.mjs` for `execute-sdd-requirements-to-plan`, without accepting a payload validator, outcome list, or digest. Depends on 1.1.
- [x] 2.2 Retain and test the canonical executor's second digest/non-empty boundary, including forged and stale validation results that must pause before a plan write. Depends on 1.1.
- [x] 2.3 Replace the eval fixture's permissive callback with the production validator and update `skills/base/sdd-requirements-to-plan/SKILL.md` with the v1 contract and explicit migration guidance. Confirm generated Claude/Codex exposure remains thin. Depends on 2.1.

## 3. Installed-runtime and portability evidence

- [x] 3.1 Add an installed-wrapper regression test using a temporary synthetic repository and the launcher's bounded workspace I/O: valid v1 input writes only the authorized temporary plan artifact; invalid or forged inputs pause without a write. Depends on 2.1, 2.2.
- [x] 3.2 Run the runtime build and clean versioned install/distribution checks, then execute the installed wrapper against a second synthetic repository to prove it includes the injection and has no product-specific dependency. Depends on 3.1.

## 4. Completion evidence

- [x] 4.1 Run focused validator, planning-eval, and runtime test suites; run `openspec validate --all --strict`; and record the exact commands and results in delivery evidence. Depends on 1.2, 2.3, 3.2.
- [x] 4.2 Perform a bounded local code review of the change, address findings, and confirm the final diff contains no credentials, product-specific constants, unapproved external mutation, or attribution/license obligation. Depends on 4.1.
