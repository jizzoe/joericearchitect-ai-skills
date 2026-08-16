# Independent review correction: path provenance and atomic research writes

## Review evidence

- Review record: `strict-01e03e36-b2a6-44af-bb9c-b65b58a580b0`
- Reviewed head: `893d3c5642ba6ffb6e2aaa2b12d71771d4358ba7`
- Manifest digest: `033eb7a3609e40bf0425e94d22e38c92ac0b9cc0f5525ce22c3945966eb49114`
- Assurance: `strict-isolated`; canonical result validation passed and detached
  review cleanup completed.

## Path-backed provenance binding

- Failure signature: `independent-review/high/IR-001`
- Correction: a path-backed source must use a `urlOrPath` whose canonical
  location equals the exact workspace-relative `path` supplied to the bounded
  reader. A source cannot provide both inline content and a path. Relabeling
  one local document with fabricated distinct URLs now fails before reading.

## Atomic research artifact transaction

- Failure signature: `independent-review/high/IR-002`
- Correction: the research workflow no longer calls a single-artifact writer
  twice. It requires one bounded atomic-writer callback, supplies both frozen
  operations in one transaction, and reports completion only after a committed
  receipt. A failed or uncommitted transaction returns a structured blocked
  result.
- Regression evidence proves both operations are presented together and a
  synthetic transaction failure does not produce a completed result.
