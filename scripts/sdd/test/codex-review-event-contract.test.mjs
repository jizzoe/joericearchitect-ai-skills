import assert from "node:assert/strict";
import test from "node:test";

import { createCodexReviewEventParser, parseCodexReviewEventStream } from "../codex-review-event-contract.mjs";

const payload = (status = "passed", findings = []) => JSON.stringify({ schemaVersion: 1, findings, status });
const event = (type, rest = {}) => JSON.stringify({ type, ...rest });
const stream = (events, newline = "\n") => `${events.join(newline)}${newline}`;
const lifecycle = (items = [], terminal = event("turn.completed", { usage: {} })) => [
  event("thread.started", { thread_id: "thread-fixture" }),
  event("turn.started"),
  ...items,
  terminal
];
const message = (text, id = "message") => event("item.completed", { item: { id, type: "agent_message", text } });

test("terminal parser accepts no-tool and multi-tool final messages only after EOF", () => {
  const noTool = parseCodexReviewEventStream(stream(lifecycle([message(payload())])));
  assert.equal(noTool.available, true);
  assert.equal(noTool.payload.status, "passed");

  const first = payload("passed");
  const finding = { id: "IR-1", severity: "high", evidence: "scripts/sdd/example.mjs", recommendation: "Fix it." };
  const final = payload("failed", [finding]);
  const parser = createCodexReviewEventParser();
  const input = stream(lifecycle([
    message(first, "intermediate"),
    event("item.started", { item: { id: "command", type: "command_execution", command: "must-not-retain" } }),
    event("item.completed", { item: { id: "command", type: "command_execution", aggregated_output: "secret-output" } }),
    message(final, "final")
  ]));
  parser.write(Buffer.from(input.slice(0, 37)));
  parser.write(Buffer.from(input.slice(37)));
  const multiTool = parser.end();
  assert.equal(multiTool.available, true);
  assert.deepEqual(multiTool.payload.findings, [finding]);
  assert.equal(multiTool.candidateText, final);
  assert.equal(multiTool.diagnostics.candidateCount, 2);
  assert.equal(multiTool.diagnostics.toolEventCount, 2);
  assert.equal(JSON.stringify(multiTool.diagnostics).includes("secret-output"), false);
});

test("terminal parser accepts CRLF and a final line without a newline", () => {
  assert.equal(parseCodexReviewEventStream(stream(lifecycle([message(payload())]), "\r\n")).available, true);
  assert.equal(parseCodexReviewEventStream(lifecycle([message(payload())]).join("\n")).available, true);
});

test("terminal parser rejects malformed, unknown, failed, duplicate, incomplete, and post-terminal streams", () => {
  const cases = [
    ["codex-jsonl-line-malformed", "{bad-json}\n"],
    ["codex-jsonl-event-unsupported", stream([event("future.event")])],
    ["codex-jsonl-turn-failed", stream(lifecycle([], event("turn.failed", { error: { message: "do-not-retain" } })))],
    ["codex-jsonl-thread-start-invalid", stream([event("thread.started")])],
    ["codex-jsonl-thread-start-duplicate", stream([event("thread.started", { thread_id: "one" }), event("thread.started", { thread_id: "two" })])],
    ["codex-jsonl-turn-start-duplicate", stream([event("thread.started", { thread_id: "one" }), event("turn.started"), event("turn.started")])],
    ["codex-jsonl-turn-completed-missing", stream(lifecycle([message(payload())]).slice(0, -1))],
    ["codex-jsonl-final-agent-missing", stream(lifecycle([]))],
    ["codex-jsonl-event-after-turn-completed", stream([...lifecycle([message(payload())]), event("item.completed", { item: { type: "reasoning" } })])],
    ["codex-jsonl-final-agent-malformed", stream(lifecycle([message("not-json")]))],
    ["codex-jsonl-final-agent-schema-invalid", stream(lifecycle([message(JSON.stringify({ schemaVersion: 1, findings: [], status: "passed", extra: true }))]))]
  ];
  for (const [code, input] of cases) {
    const result = parseCodexReviewEventStream(input);
    assert.equal(result.available, false, code);
    assert.equal(result.code, code);
    assert.equal(JSON.stringify(result).includes("do-not-retain"), false);
  }
  assert.equal(parseCodexReviewEventStream(stream([event("thread.started", { thread_id: "thread-fixture" }), event("turn.started"), message(payload())])).retryEligible, true);
  assert.equal(parseCodexReviewEventStream(stream(lifecycle([]))).retryEligible, true);
});

test("terminal parser rejects invalid UTF-8 and ambiguous item lifecycles", () => {
  const invalidUtf8 = Buffer.concat([
    Buffer.from('{"type":"thread.started","thread_id":"'), Buffer.from([0xff]), Buffer.from('"}\n')
  ]);
  assert.equal(parseCodexReviewEventStream(invalidUtf8).code, "codex-jsonl-line-malformed");
  const duplicateItem = stream(lifecycle([
    message(payload(), "same-message"),
    message(payload(), "same-message")
  ]));
  assert.equal(parseCodexReviewEventStream(duplicateItem).code, "codex-jsonl-item-lifecycle-ambiguous");
  const updateWithoutStart = stream(lifecycle([
    event("item.updated", { item: { id: "command", type: "command_execution" } }),
    message(payload())
  ]));
  assert.equal(parseCodexReviewEventStream(updateWithoutStart).code, "codex-jsonl-item-lifecycle-ambiguous");
  const changedType = stream(lifecycle([
    event("item.started", { item: { id: "shared", type: "command_execution" } }),
    event("item.completed", { item: { id: "shared", type: "agent_message", text: payload() } })
  ]));
  assert.equal(parseCodexReviewEventStream(changedType).code, "codex-jsonl-item-lifecycle-ambiguous");
  const incompleteItem = stream(lifecycle([
    event("item.started", { item: { id: "command", type: "command_execution" } }),
    message(payload())
  ]));
  assert.equal(parseCodexReviewEventStream(incompleteItem).code, "codex-jsonl-item-lifecycle-incomplete");
});

test("terminal parser enforces every byte and count bound", () => {
  const valid = stream(lifecycle([message(payload())]));
  assert.equal(parseCodexReviewEventStream(valid, { bounds: { totalBytes: Buffer.byteLength(valid) - 1 } }).code, "codex-jsonl-stream-bound-exceeded");
  assert.equal(parseCodexReviewEventStream(valid, { bounds: { lineBytes: 8 } }).code, "codex-jsonl-line-bound-exceeded");
  assert.equal(parseCodexReviewEventStream(valid, { bounds: { eventCount: 2 } }).code, "codex-jsonl-event-count-bound-exceeded");
  assert.equal(parseCodexReviewEventStream(stream(lifecycle([message(payload())])), { bounds: { candidateBytes: 8 } }).code, "codex-jsonl-candidate-bound-exceeded");
});

test("terminal parser returns one stable terminal result", () => {
  const parser = createCodexReviewEventParser();
  parser.write(stream(lifecycle([message(payload())])));
  const first = parser.end();
  assert.equal(parser.end(), first);
  assert.equal(parser.write("untrusted later bytes"), first);
});
