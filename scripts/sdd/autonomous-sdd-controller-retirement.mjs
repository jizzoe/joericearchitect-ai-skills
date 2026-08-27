import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { digestValue, validateDomainRecord } from "./autonomous-sdd-run-contract.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
const timestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));

export const controllerRetirementMarkerName = "controller-retirement.json";
export const controllerTerminalMarkerName = "controller-terminal.json";

function identityMatches(marker, controller) {
  return marker.controllerRunId === controller?.runId && marker.authorizationDigest === controller?.authorizationDigest &&
    marker.parentRunId === controller?.v2Admission?.parentRunId && marker.workUnitId === controller?.v2Admission?.workUnitId &&
    marker.claimId === controller?.v2Admission?.claimId && marker.repositoryId === controller?.v2Admission?.repositoryId &&
    marker.approvedChangeId === controller?.selectedEntry;
}

function receiptIdentityMatches(receipt, marker) {
  return receipt?.controllerRunId === marker.controllerRunId && receipt?.parentRunId === marker.parentRunId &&
    receipt?.workUnitId === marker.workUnitId && receipt?.claimId === marker.claimId &&
    receipt?.repositoryId === marker.repositoryId && receipt?.approvedChangeId === marker.approvedChangeId;
}

export function buildControllerRetirementMarker({ controller, retirement, requestDigest, cancellationReceipt, createdAt } = {}) {
  const validation = validateDomainRecord(cancellationReceipt);
  if (!validation.valid || cancellationReceipt.kind !== "cancellation-receipt" || !digest(requestDigest) || !timestamp(createdAt) ||
      retirement?.controllerRunId !== controller?.runId || retirement?.parentRunId !== controller?.v2Admission?.parentRunId ||
      retirement?.workUnitId !== controller?.v2Admission?.workUnitId || retirement?.claimId !== controller?.v2Admission?.claimId ||
      retirement?.repositoryId !== controller?.v2Admission?.repositoryId || retirement?.approvedChangeId !== controller?.selectedEntry ||
      cancellationReceipt.requestDigest !== requestDigest || !receiptIdentityMatches(cancellationReceipt, {
        controllerRunId: retirement.controllerRunId,
        parentRunId: retirement.parentRunId,
        workUnitId: retirement.workUnitId,
        claimId: retirement.claimId,
        repositoryId: retirement.repositoryId,
        approvedChangeId: retirement.approvedChangeId
      })) return null;
  return {
    kind: "controller-retirement",
    schemaVersion: 1,
    state: "retiring",
    controllerRunId: controller.runId,
    authorizationDigest: controller.authorizationDigest,
    parentRunId: retirement.parentRunId,
    workUnitId: retirement.workUnitId,
    claimId: retirement.claimId,
    repositoryId: retirement.repositoryId,
    approvedChangeId: retirement.approvedChangeId,
    retirementRequestDigest: requestDigest,
    cancellationReceiptDigest: validation.digest,
    createdAt
  };
}

export function validControllerRetirementMarker(marker, { controller, cancellationReceipt } = {}) {
  const keys = ["kind", "schemaVersion", "state", "controllerRunId", "authorizationDigest", "parentRunId", "workUnitId", "claimId",
    "repositoryId", "approvedChangeId", "retirementRequestDigest", "cancellationReceiptDigest", "createdAt"];
  if (!exactKeys(marker, keys) || marker.kind !== "controller-retirement" || marker.schemaVersion !== 1 || marker.state !== "retiring" ||
      !identityMatches(marker, controller) || !digest(marker.retirementRequestDigest) || !digest(marker.cancellationReceiptDigest) ||
      !timestamp(marker.createdAt)) return false;
  if (cancellationReceipt === undefined) return true;
  const validation = validateDomainRecord(cancellationReceipt);
  return validation.valid && cancellationReceipt.kind === "cancellation-receipt" &&
    receiptIdentityMatches(cancellationReceipt, marker) && cancellationReceipt.requestDigest === marker.retirementRequestDigest &&
    cancellationReceipt.createdAt === marker.createdAt && validation.digest === marker.cancellationReceiptDigest;
}

export function buildControllerTerminalMarker({ controller, retirementMarker, cancellationReceipt, archiveManifest } = {}) {
  const receiptValidation = validateDomainRecord(cancellationReceipt);
  const manifestValidation = validateDomainRecord(archiveManifest);
  if (!validControllerRetirementMarker(retirementMarker, { controller, cancellationReceipt }) || !receiptValidation.valid ||
      !manifestValidation.valid || archiveManifest.kind !== "archive-manifest" ||
      archiveManifest.parentRunId !== retirementMarker.parentRunId || archiveManifest.reason !== "owner-authorized-blocked-controller" ||
      archiveManifest.archivedAt !== cancellationReceipt.createdAt) return null;
  return {
    kind: "controller-terminal",
    schemaVersion: 1,
    state: "retired",
    controllerRunId: controller.runId,
    authorizationDigest: controller.authorizationDigest,
    parentRunId: retirementMarker.parentRunId,
    workUnitId: retirementMarker.workUnitId,
    claimId: retirementMarker.claimId,
    repositoryId: retirementMarker.repositoryId,
    approvedChangeId: retirementMarker.approvedChangeId,
    retirementMarkerDigest: digestValue(retirementMarker),
    cancellationReceiptDigest: receiptValidation.digest,
    archiveManifestDigest: manifestValidation.digest,
    retiredAt: cancellationReceipt.createdAt
  };
}

export function validControllerTerminalMarker(marker, { controller, retirementMarker, cancellationReceipt, archiveManifest } = {}) {
  const keys = ["kind", "schemaVersion", "state", "controllerRunId", "authorizationDigest", "parentRunId", "workUnitId", "claimId",
    "repositoryId", "approvedChangeId", "retirementMarkerDigest", "cancellationReceiptDigest", "archiveManifestDigest", "retiredAt"];
  if (!exactKeys(marker, keys) || marker.kind !== "controller-terminal" || marker.schemaVersion !== 1 || marker.state !== "retired" ||
      !identityMatches(marker, controller) || !digest(marker.retirementMarkerDigest) || !digest(marker.cancellationReceiptDigest) ||
      !digest(marker.archiveManifestDigest) || !timestamp(marker.retiredAt) ||
      !validControllerRetirementMarker(retirementMarker, { controller, cancellationReceipt }) ||
      marker.retirementMarkerDigest !== digestValue(retirementMarker) || marker.retiredAt !== retirementMarker.createdAt) return false;
  if (cancellationReceipt === undefined || archiveManifest === undefined) {
    return marker.cancellationReceiptDigest === retirementMarker.cancellationReceiptDigest;
  }
  const receiptValidation = validateDomainRecord(cancellationReceipt);
  const manifestValidation = validateDomainRecord(archiveManifest);
  return receiptValidation.valid && manifestValidation.valid && marker.cancellationReceiptDigest === receiptValidation.digest &&
    marker.archiveManifestDigest === manifestValidation.digest && marker.retiredAt === cancellationReceipt.createdAt &&
    archiveManifest.parentRunId === marker.parentRunId && archiveManifest.reason === "owner-authorized-blocked-controller" &&
    archiveManifest.archivedAt === marker.retiredAt;
}

function markerDirectory(stateRoot, controller, fileSystem = fs) {
  if (!text(stateRoot) || !text(controller?.checkpointPath) || path.isAbsolute(controller.checkpointPath) ||
      path.basename(controller.checkpointPath) !== "controller.json") return null;
  try {
    const root = fileSystem.realpathSync(stateRoot);
    const directory = path.resolve(root, path.dirname(controller.checkpointPath));
    if (directory === root || !directory.startsWith(`${root}${path.sep}`) || !fileSystem.existsSync(directory) ||
        fileSystem.lstatSync(directory).isSymbolicLink() || fileSystem.realpathSync(directory) !== directory) return null;
    return directory;
  } catch { return null; }
}

function readMarker(directory, name, fileSystem = fs) {
  try {
    const target = path.join(directory, name);
    const entry = fileSystem.lstatSync(target);
    if (!entry.isFile() || entry.isSymbolicLink()) return null;
    return JSON.parse(fileSystem.readFileSync(target, "utf8"));
  } catch { return null; }
}

export function readControllerRetirementEvidence({ stateRoot, controller, fileSystem = fs } = {}) {
  const directory = markerDirectory(stateRoot, controller, fileSystem);
  if (!directory) return { present: false, valid: false, reason: "controller-retirement-state-unavailable" };
  const retirementMarker = readMarker(directory, controllerRetirementMarkerName, fileSystem);
  const terminalMarker = readMarker(directory, controllerTerminalMarkerName, fileSystem);
  if (!retirementMarker && !terminalMarker) return { present: false, valid: true, state: "active" };
  if (!validControllerRetirementMarker(retirementMarker, { controller })) {
    return { present: true, valid: false, reason: "controller-retirement-marker-invalid" };
  }
  if (!terminalMarker) return { present: true, valid: true, state: "retiring", retirementMarker };
  if (!validControllerTerminalMarker(terminalMarker, { controller, retirementMarker })) {
    return { present: true, valid: false, reason: "controller-terminal-marker-invalid" };
  }
  return { present: true, valid: true, state: "retired", retirementMarker, terminalMarker };
}

export function publishControllerMarker({ stateRoot, controller, name, marker, validate, fileSystem = fs } = {}) {
  const directory = markerDirectory(stateRoot, controller, fileSystem);
  if (!directory || ![controllerRetirementMarkerName, controllerTerminalMarkerName].includes(name) || typeof validate !== "function" || !validate(marker)) {
    return { valid: false, reason: "controller-marker-publication-input-invalid" };
  }
  const destination = path.join(directory, name);
  const temporary = path.join(directory, `.${name}.${process.pid}.${crypto.randomUUID()}.tmp`);
  try {
    if (fileSystem.existsSync(destination)) {
      const existing = readMarker(directory, name, fileSystem);
      return existing && digestValue(existing) === digestValue(marker) && validate(existing)
        ? { valid: true, classification: "already-published", path: destination, digest: digestValue(existing) }
        : { valid: false, reason: "controller-marker-conflict" };
    }
    const descriptor = fileSystem.openSync(temporary, "wx", 0o600);
    try {
      fileSystem.writeFileSync(descriptor, `${JSON.stringify(marker, null, 2)}\n`, "utf8");
      fileSystem.fsyncSync(descriptor);
    } finally { fileSystem.closeSync(descriptor); }
    fileSystem.linkSync(temporary, destination);
    fileSystem.unlinkSync(temporary);
    if (process.platform !== "win32") {
      const descriptor = fileSystem.openSync(directory, "r");
      try { fileSystem.fsyncSync(descriptor); } finally { fileSystem.closeSync(descriptor); }
    }
    return { valid: true, classification: "published", path: destination, digest: digestValue(marker) };
  } catch (error) {
    try { fileSystem.unlinkSync(temporary); } catch {}
    if (error?.code === "EEXIST") {
      const existing = readMarker(directory, name, fileSystem);
      return existing && digestValue(existing) === digestValue(marker) && validate(existing)
        ? { valid: true, classification: "already-published", path: destination, digest: digestValue(existing) }
        : { valid: false, reason: "controller-marker-conflict" };
    }
    return { valid: false, reason: "controller-marker-publication-failed" };
  }
}
