# Implementation Quality Requirements Map

The deterministic scenario inventory in `scenarios.json` maps all 30 acceptance
scenarios from `base-code-review` and `base-verification-loop` to focused test
evidence. `run-fixtures.test.mjs` also covers malformed result details, duplicate
IDs, unsafe paths, trusted structured checks, injection data, secret-like data,
authorization target mismatch, failed and exhausted correction histories,
current workspace/commit and changed-path evidence bindings, web UI viewports,
accessibility, missing tools, exact-head CI, strict-review pass and unavailable
behavior, thin wrappers, and second-workspace portability.

No fixture contains real credentials, personal data, authenticated browser
state, production source, or product-specific repository constants.
