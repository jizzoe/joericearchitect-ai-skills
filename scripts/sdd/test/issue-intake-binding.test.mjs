import assert from "node:assert/strict";
import test from "node:test";

import { createOrFindIssue, replaceManagedBlock } from "../../github/lib/issues.mjs";
import { planAddToProject, planSetProjectStatus } from "../../github/lib/projects.mjs";
import { checkOperationAuthorization } from "../check-operation-authorization.mjs";
import {
  authorizeBoundIssueIntake,
  createIssueIntakeBinding,
  issueIntakePayloadDigest
} from "../issue-intake-binding.mjs";

const selectedEntry = "frictionless-prototype";
const managedBlock = "<!-- sdd-managed:start -->\nOpenSpec change: `frictionless-prototype`\n<!-- sdd-managed:end -->";
const payload = {
  repository: "example/repository",
  title: "Frictionless prototype",
  body: `Human context\n\n${managedBlock}`,
  labels: ["type:feature", "sdd"],
  managedBlock
};
const expiresAt = "2026-08-14T00:00:00.000Z";
const binding = createIssueIntakeBinding({ selectedEntry, payload, expiresAt }).binding;
const runtime = { permittedOperations: ["issue-create-or-update"] };

test("reviewed issue payload canonicalizes labels and binds an exact digest", () => {
  assert.deepEqual(binding.labels, ["sdd", "type:feature"]);
  assert.equal(binding.payloadDigest, issueIntakePayloadDigest({ ...payload, labels: ["sdd", "type:feature"] }));
  const result = authorizeBoundIssueIntake({ binding, selectedEntry, payload, runtime, now: "2026-08-13T12:00:00.000Z" });
  assert.equal(result.allowed, true);
  assert.equal(result.promptRequired, false);
});

test("bound create-or-reuse finds an exact duplicate without a second prompt", () => {
  const result = createOrFindIssue({
    repo: payload.repository,
    title: payload.title,
    body: payload.body,
    labels: payload.labels,
    managedBlock,
    intakeBinding: binding,
    selectedEntry,
    runtime,
    now: "2026-08-13T12:00:00.000Z",
    existingIssues: [{ number: 9, title: payload.title, url: "https://github.com/example/repository/issues/9", state: "OPEN" }]
  });
  assert.equal(result.ok, true);
  assert.equal(result.action, "found");
  assert.equal(result.promptRequired, false);
  assert.equal(result.payloadDigest, binding.payloadDigest);
});

test("payload drift, expiry, and host denial fail closed without requesting a skill prompt", () => {
  const cases = [
    [{ ...payload, title: "Changed" }, runtime, "2026-08-13T12:00:00.000Z", "issue-intake-payload-mismatch"],
    [payload, runtime, expiresAt, "issue-intake-binding-expired"],
    [payload, { permittedOperations: [] }, "2026-08-13T12:00:00.000Z", "runtime-permission-gap"]
  ];
  for (const [candidate, host, now, code] of cases) {
    const result = authorizeBoundIssueIntake({ binding, selectedEntry, payload: candidate, runtime: host, now });
    assert.equal(result.allowed, false);
    assert.equal(result.promptRequired, false);
    assert.equal(result.issues[0].code, code);
    assert.match(result.recoveryReference, /reconcile exact title/);
  }
});

test("operation authorization retains exact target, expiry, and runtime gates for bound intake", () => {
  const authorization = {
    allowedMutations: ["issue-create-or-update"],
    targets: ["issue-intake:frictionless-prototype"],
    expiresAt
  };
  const request = {
    profile: "sdd-delivery",
    operation: "issue-create-or-update",
    target: "issue-intake:frictionless-prototype",
    selectedEntry,
    issueIntakeBinding: binding,
    issuePayload: payload
  };
  assert.equal(checkOperationAuthorization({ authorization, runtime, request, now: "2026-08-13T12:00:00.000Z" }).allowed, true);
  assert.equal(checkOperationAuthorization({ authorization, runtime: { permittedOperations: [] }, request, now: "2026-08-13T12:00:00.000Z" }).issues[0].code, "runtime-permission-gap");
  assert.equal(checkOperationAuthorization({ authorization: { ...authorization, targets: ["issue-intake:other"] }, runtime, request, now: "2026-08-13T12:00:00.000Z" }).issues[0].code, "unauthorized-target");
});

test("managed content, tracking-adjacent Project plans, and human text remain reconcilable", () => {
  const body = replaceManagedBlock(`Human context\n\n${managedBlock}\n\nHuman footer`, managedBlock.replace("frictionless-prototype", "frictionless-prototype"), {
    start: "<!-- sdd-managed:start -->",
    end: "<!-- sdd-managed:end -->"
  });
  assert.match(body, /^Human context/);
  assert.match(body, /Human footer$/);
  const project = { owner: "example", number: 1, statusField: { name: "Status", options: ["Ready"] } };
  const url = "https://github.com/example/repository/issues/9";
  assert.equal(planAddToProject({ project, issueUrl: url }).operation, "project.itemAdd");
  assert.equal(planSetProjectStatus({ project, issueUrl: url, status: "Ready" }).operation, "project.setStatus");
});
