# Correction Loop

The runner may correct objective, narrowly scoped failures without routine
approval. It must not use correction as a way to change approved behavior or
avoid a human decision.

## Failure Signatures

A failure signature is the stable identity used for retry budgeting. Build it
from:

- command, review, or gate name
- normalized error class
- affected artifact or external target
- lifecycle transition or task batch

Do not include timestamps, temporary paths, random identifiers, or full
untrusted output in the signature.

## Correction Budget

For one failure signature, attempt no more than three materially different
corrections. A correction is materially different when it changes the diagnosis
or the fix strategy, not just when it reruns the same command.

After each correction:

1. record the attempted fix and affected files or targets
2. rerun every affected check
3. classify remaining findings
4. update task evidence only if the gate now passes

After three unresolved materially different attempts, pause in a blocked state
and report the signature, attempts, current evidence, and safest resume path.

## Allowed Automatic Corrections

- formatting, lint, type, schema, deterministic test, link, generated exposure,
  stale fixture, or narrow review failures
- missing evidence that can be produced without changing behavior
- stale generated adapter output when canonical source is unchanged

## Human-Pause Corrections

Pause when a fix would require a new requirement, changed behavior, broader
credential access, destructive operation, security weakening, license or
governance decision, or mutation outside the active authorization.
