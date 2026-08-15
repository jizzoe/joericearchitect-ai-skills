const diagnosticVersion = 1;
const text = (value) => typeof value === "string" && value.trim().length > 0;
const safeToken = (value) => text(value) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const safeMessage = (value) => text(value) && !/[\r\n\0]/.test(value);

export const reviewDiagnosticCategories = Object.freeze([
  "request-invalid",
  "validation-failed",
  "verification-failed",
  "ownership-invalid",
  "request-expired",
  "authorization-denied",
  "runtime-unavailable",
  "authentication-unavailable",
  "permission-denied",
  "network-unavailable",
  "output-contract-invalid",
  "artifact-invalid",
  "resource-unavailable",
  "execution-failed",
  "unclassified-runtime-failure",
  "cleanup-failed"
]);

/** A safe, portable control-plane failure record. Never put raw tool output here. */
export function createReviewDiagnostic({ stage, operation, code, category, subject, exitCode, safeMessage: message } = {}) {
  const supplied = arguments[0];
  const allowedKeys = new Set(["stage", "operation", "code", "category", "subject", "exitCode", "safeMessage"]);
  if (!supplied || Object.keys(supplied).some((key) => !allowedKeys.has(key))) return null;
  if (![stage, operation, code, category, subject].every(safeToken) || !reviewDiagnosticCategories.includes(category) || !safeMessage(message)) {
    return null;
  }
  if (exitCode !== undefined && !Number.isInteger(exitCode)) return null;
  return Object.freeze({
    schemaVersion: diagnosticVersion,
    stage,
    operation,
    code,
    category,
    subject,
    ...(exitCode === undefined ? {} : { exitCode }),
    safeMessage: message
  });
}

export function validReviewDiagnostic(value) {
  if (!value || value.schemaVersion !== diagnosticVersion) return false;
  const { schemaVersion, ...fields } = value;
  const created = createReviewDiagnostic(fields);
  return created !== null && Object.keys(value).length === Object.keys(created).length;
}

export function unavailableOutcome(diagnostic, additional = {}) {
  if (!validReviewDiagnostic(diagnostic)) throw new Error("invalid-review-diagnostic");
  // The envelope is authoritative even when a wrapper forwards other fields
  // from a child outcome.  That prevents stale child status/code pairs from
  // disagreeing with the preserved diagnostic.
  return { ...additional, status: "unavailable", code: diagnostic.code, diagnostic };
}

/**
 * Classify a local Error without retaining its message, path, stack, or other
 * process details. Callers supply the stable stage/operation and fallback.
 */
export function diagnosticFromError({ stage, operation, code, subject, safeMessage: message, error, exitCode } = {}) {
  const runtimeCode = error?.code;
  const category = runtimeCode === "EACCES" || runtimeCode === "EPERM"
    ? "permission-denied"
    : runtimeCode === "ENOENT"
      ? "runtime-unavailable"
      : runtimeCode === "ENOSPC" || runtimeCode === "EDQUOT"
        ? "resource-unavailable"
        : "execution-failed";
  return createReviewDiagnostic({
    stage,
    operation,
    code,
    category,
    subject,
    ...(Number.isInteger(exitCode) ? { exitCode } : {}),
    safeMessage: message
  });
}

/**
 * Convert a stable, already-safe control-plane code into the shared envelope.
 * This is for validation and policy paths which do not have a local Error to
 * classify.  It deliberately never accepts a caller-provided error message.
 */
export function diagnosticFromCode({ stage, operation, code, subject, safeMessage: message, exitCode } = {}) {
  const category = code?.includes("expired")
    ? "request-expired"
    : code?.includes("authorization") || code?.includes("self-review") || code?.includes("scope")
      ? "authorization-denied"
      : code?.includes("ownership") || code?.includes("mismatch")
        ? "ownership-invalid"
        : code?.includes("cleanup")
          ? "cleanup-failed"
          : code?.includes("result") || code?.includes("output") || code?.includes("schema")
            ? "output-contract-invalid"
            : code?.includes("runtime") || code?.includes("transport") || code?.includes("capability") || code?.includes("invocation")
              ? "runtime-unavailable"
              : code?.includes("package") || code?.includes("request") || code?.includes("validation")
                ? "validation-failed"
                : "unclassified-runtime-failure";
  return createReviewDiagnostic({
    stage,
    operation,
    code,
    category,
    subject,
    ...(Number.isInteger(exitCode) ? { exitCode } : {}),
    safeMessage: message
  });
}

export function unclassifiedRuntimeDiagnostic({ stage, operation, code, subject, exitCode, safeMessage: message } = {}) {
  return createReviewDiagnostic({
    stage,
    operation,
    code,
    category: "unclassified-runtime-failure",
    subject,
    ...(Number.isInteger(exitCode) ? { exitCode } : {}),
    safeMessage: message
  });
}

/** A wrapper preserves a child's valid diagnostic rather than replacing it. */
export function preservedDiagnostic(value) {
  return validReviewDiagnostic(value?.diagnostic) ? value.diagnostic : null;
}
