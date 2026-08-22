# Requirements mapping

Recorded: 2026-08-22

| Requirement / scenario | Implementation | Automated evidence |
|---|---|---|
| Archive-bound terminal v2 compatibility | `autonomous-sdd-admission.mjs` derives and validates one contained archive bundle; `autonomous-sdd-legacy.mjs` consumes only exact internal bindings | Valid terminal archive admission test |
| Partial or conflicting archive remains ambiguous | Domain validation, mutual identity/digest checks, duplicate rejection, active-run rejection, and symlink refusal | Missing, malformed, active, pending, symlink, duplicate, repository, change, authorization, provider, identity, and digest matrix |
| Classification is read-only | Verifier and inventory perform reads only | Controller and archive byte-preservation assertions |
| Prior terminal schema-5 permits later initialization | Initializer derives verified siblings before ordinary inventory classification | Source-level valid-terminal test and staged installed-wrapper flow |
| Pending or active schema-5 remains authoritative | Unmatched schema-5 has no internal binding and stays unknown/ambiguous | Focused active/pending cases and unmatched installed-wrapper sibling |
| Installed initializer uses real Git-common/v2 state | Existing manifest-declared wrapper remains thin; runtime build stages canonical modules | Staged launcher test with temporary Git repository, archive terminalization, initialization, retry, and unmatched pause |

All six scenarios have direct automated coverage. No scenario relies solely on
documentation or a mocked Git-common path.
