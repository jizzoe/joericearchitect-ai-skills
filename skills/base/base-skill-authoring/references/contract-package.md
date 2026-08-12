# Contract Package

Record: proposed name and activation description; user trigger and non-trigger
examples; required and optional inputs; `skill-result-v1` result; source of
truth and untrusted-content boundary; allowed reads/mutations/targets and
configuration; interactive approvals and autonomous profiles; pause and
recovery; deterministic helpers and adapters; canonical assets and thin
adapter plan; eval matrix; risks, open decisions, and next action.

Use only product-owned configuration for paths, records, adapters, and policy
values. When `ai-skills-config-v1` is absent, require every destination/path
explicitly. Never include credentials, secrets, OTP/MFA values, PII, endpoints,
or account identifiers.

Return a completed result only for a complete contract package. Return a
schema-valid blocked result for material gaps, with each unresolved decision in
`openQuestions` and a `user-decision` next action.
