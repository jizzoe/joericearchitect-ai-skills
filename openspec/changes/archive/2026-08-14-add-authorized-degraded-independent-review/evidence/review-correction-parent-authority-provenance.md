# Review Correction: Parent-Authority Provenance

- Review record: `degraded-5b77cd43-ee06-403e-b72c-ba829db96f07`.
- Reviewed head: `74b5dd476e565f6cdc5326a084dfd836e6b3f7b8`.
- Reviewed manifest:
  `354e926bf8024145109abe6fe4f4bf638fc5a5b8edd4bd5597356c48f7232713`.
- Finding: `IR-001`.
- Classification: `objective-fix`.
- Failure signature:
  `independent-review/IR-001/scripts/sdd/platform-review-adapters.mjs/merge-pr`.
- Attempt for this signature: 1 of 3.

The fresh corrected-head reviewer found that the first Codex transport executed
the repository's `review-launcher-host.mjs` with parent authority. File-type
checks did not make that reviewed JavaScript or its dependency closure trusted,
so a malicious change could execute before the inner reviewer boundary.

The bounded correction keeps the assistant-neutral logical host protocol but
changes the Codex transport boundary. Inside the managed sandbox it now:

- rejects symlinks, submodules, and every non-regular exact-head tree entry;
- materializes a Git archive in an ownership-marked temporary root with no Git
  metadata or dirty-worktree content;
- independently rederives and compares the sealed package from canonical Git
  objects; and
- exclusively injects the package into that archive.

The eligible escalated tool request now invokes only the host-owned
`/usr/bin/env` utility and configured Codex executable with a cleared,
allowlisted environment and fixed structured arguments. No repository module
is executed with parent authority. The fixed invocation explicitly permits the
archive's intentional absence of Git metadata without weakening its read-only
permission profile. After the tool result returns, sandboxed
code seals and validates the result, constructs the logical host response, and
performs ownership-guarded cleanup. Other runtimes may still implement the
assistant-neutral protocol using an independently installed immutable host.

Regression coverage proves archive exactness and cleanup, rejects symlinked
trees, verifies the elevated argument vector contains no repository host
script, and exercises direct result sealing and acceptance. The correction is
behavior-preserving, is the first attempt for this signature, and requires a
fresh exact-head review.
