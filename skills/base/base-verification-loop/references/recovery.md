# Recovery

Reread current authorization, runtime permission, intended behavior, changed
paths, trusted check definitions, head or workspace binding, selected checks,
correction attempts by failure signature, local findings, CI evidence, and the
canonical strict-review gate. Resume at the first incomplete ordered stage.

Do not reuse evidence whose workspace or commit binding or changed-path set has
changed, repeat a materially identical correction beyond its budget, replace a
failed check with not applicable, or translate strict-review unavailability
into a local-review success. A latest failed correction keeps readiness open;
an exhausted failed signature is blocked. Preserve implementation and evidence
when pausing and name the exact prerequisite for a safe retry.
