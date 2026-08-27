import { TextDecoder } from "node:util";

import { parseReviewFindingsPayload, validateReviewFindingsPayload } from "./independent-review-contract.mjs";

export const codexReviewEventContractRevision = "codex-jsonl-final-agent-v1";
export const codexReviewEventBounds = Object.freeze({
  totalBytes: 16 * 1024 * 1024,
  lineBytes: 2 * 1024 * 1024,
  eventCount: 100_000,
  candidateBytes: 1024 * 1024
});

const eventTypes = new Set([
  "thread.started", "turn.started", "item.started", "item.updated",
  "item.completed", "turn.completed", "turn.failed", "error"
]);
const itemTypes = new Set([
  "agent_message", "reasoning", "command_execution", "file_change",
  "mcp_tool_call", "web_search", "todo_list"
]);

const diagnostics = (state, code, terminalState = "unavailable") => Object.freeze({
  contractRevision: codexReviewEventContractRevision,
  code,
  terminalState,
  eventBytes: state.totalBytes,
  eventCount: state.eventCount,
  candidateCount: state.candidateCount,
  toolEventCount: state.toolEventCount
});

const unavailable = (state, code, { retryEligible = false } = {}) => Object.freeze({
  available: false,
  code,
  retryEligible,
  diagnostics: diagnostics(state, code)
});

function boundedInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function normalizedBounds(overrides = {}) {
  return Object.freeze({
    totalBytes: boundedInteger(overrides.totalBytes, codexReviewEventBounds.totalBytes),
    lineBytes: boundedInteger(overrides.lineBytes, codexReviewEventBounds.lineBytes),
    eventCount: boundedInteger(overrides.eventCount, codexReviewEventBounds.eventCount),
    candidateBytes: boundedInteger(overrides.candidateBytes, codexReviewEventBounds.candidateBytes)
  });
}

/**
 * Incrementally consumes only Codex JSONL stdout. No event body is retained
 * except the latest completed agent message, and no raw content is returned in
 * diagnostics.
 */
export function createCodexReviewEventParser({ bounds: requestedBounds } = {}) {
  const bounds = normalizedBounds(requestedBounds);
  const utf8 = new TextDecoder("utf-8", { fatal: true });
  const state = {
    totalBytes: 0,
    eventCount: 0,
    candidateCount: 0,
    toolEventCount: 0,
    itemStates: new Map(),
    threadStarted: false,
    turnStarted: false,
    turnCompleted: false,
    candidate: null,
    buffered: Buffer.alloc(0),
    failure: null,
    result: null
  };

  const fail = (code, options) => {
    if (!state.failure) state.failure = unavailable(state, code, options);
    return state.failure;
  };

  const consumeEvent = (event) => {
    if (!event || typeof event !== "object" || Array.isArray(event) || !eventTypes.has(event.type)) {
      return fail("codex-jsonl-event-unsupported");
    }
    if (event.type === "turn.failed" || event.type === "error") return fail("codex-jsonl-turn-failed");
    if (state.turnCompleted) return fail("codex-jsonl-event-after-turn-completed");
    if (event.type === "thread.started") {
      if (state.threadStarted || state.turnStarted) return fail("codex-jsonl-thread-start-duplicate");
      if (!safeEventIdentity(event.thread_id)) return fail("codex-jsonl-thread-start-invalid");
      state.threadStarted = true;
      return null;
    }
    if (!state.threadStarted) return fail("codex-jsonl-thread-start-missing");
    if (event.type === "turn.started") {
      if (state.turnStarted) return fail("codex-jsonl-turn-start-duplicate");
      state.turnStarted = true;
      return null;
    }
    if (!state.turnStarted) return fail("codex-jsonl-turn-start-missing");
    if (event.type === "turn.completed") {
      if ([...state.itemStates.values()].some((itemState) => itemState.state !== "completed")) {
        return fail("codex-jsonl-item-lifecycle-incomplete");
      }
      state.turnCompleted = true;
      return null;
    }
    const item = event.item;
    if (!item || typeof item !== "object" || Array.isArray(item) || !itemTypes.has(item.type) || !safeEventIdentity(item.id)) {
      return fail("codex-jsonl-item-unsupported");
    }
    const itemState = state.itemStates.get(item.id);
    if (event.type === "item.started") {
      if (itemState) return fail("codex-jsonl-item-lifecycle-ambiguous");
      state.itemStates.set(item.id, { state: "started", type: item.type });
    } else if (event.type === "item.updated") {
      if (itemState?.state !== "started" || itemState.type !== item.type) {
        return fail("codex-jsonl-item-lifecycle-ambiguous");
      }
    } else if (event.type === "item.completed") {
      // Codex JSONL supports terminal-only item records: a completed item can
      // be the first event for its id. Treat that as its immutable terminal
      // state, while still rejecting every later duplicate, type change, or
      // update for the same id.
      if (itemState?.state === "completed" || (itemState && itemState.type !== item.type)) {
        return fail("codex-jsonl-item-lifecycle-ambiguous");
      }
      state.itemStates.set(item.id, { state: "completed", type: item.type });
    }
    if (item.type !== "agent_message") {
      state.toolEventCount += 1;
      return null;
    }
    if (event.type === "item.completed") {
      if (typeof item.text !== "string" || !item.text.trim()) return fail("codex-jsonl-agent-message-invalid");
      const bytes = Buffer.byteLength(item.text, "utf8");
      if (bytes > bounds.candidateBytes) return fail("codex-jsonl-candidate-bound-exceeded");
      state.candidate = item.text;
      state.candidateCount += 1;
    }
    return null;
  };

  const consumeLine = (line) => {
    if (state.failure) return state.failure;
    const normalized = line.length > 0 && line.at(-1) === 0x0d ? line.subarray(0, -1) : line;
    if (line.length > bounds.lineBytes) return fail("codex-jsonl-line-bound-exceeded");
    if (normalized.length === 0) return fail("codex-jsonl-empty-line");
    state.eventCount += 1;
    if (state.eventCount > bounds.eventCount) return fail("codex-jsonl-event-count-bound-exceeded");
    let event;
    try {
      event = JSON.parse(utf8.decode(normalized));
    } catch {
      return fail("codex-jsonl-line-malformed");
    }
    return consumeEvent(event);
  };

  const write = (chunk) => {
    if (state.result) return state.result;
    if (state.failure) return state.failure;
    if (!Buffer.isBuffer(chunk) && typeof chunk !== "string") return fail("codex-jsonl-chunk-invalid");
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "utf8");
    state.totalBytes += bytes.length;
    if (state.totalBytes > bounds.totalBytes) return fail("codex-jsonl-stream-bound-exceeded");
    state.buffered = Buffer.concat([state.buffered, bytes]);
    let newline;
    while (!state.failure && (newline = state.buffered.indexOf(0x0a)) !== -1) {
      const line = state.buffered.subarray(0, newline);
      state.buffered = state.buffered.subarray(newline + 1);
      consumeLine(line);
    }
    if (!state.failure && state.buffered.length > bounds.lineBytes) return fail("codex-jsonl-line-bound-exceeded");
    return state.failure;
  };

  const end = () => {
    if (state.result) return state.result;
    if (!state.failure && state.buffered.length > 0) consumeLine(state.buffered);
    state.buffered = Buffer.alloc(0);
    if (state.failure) {
      state.result = state.failure;
      return state.result;
    }
    if (!state.threadStarted) state.result = unavailable(state, "codex-jsonl-thread-start-missing");
    else if (!state.turnStarted) state.result = unavailable(state, "codex-jsonl-turn-start-missing");
    else if (!state.turnCompleted) state.result = unavailable(state, "codex-jsonl-turn-completed-missing", { retryEligible: true });
    else if (state.candidate === null) state.result = unavailable(state, "codex-jsonl-final-agent-missing", { retryEligible: true });
    else {
      const parsed = parseReviewFindingsPayload(state.candidate, { allowEnvelope: false });
      if (!parsed.parsed) state.result = unavailable(state, "codex-jsonl-final-agent-malformed");
      else if (!validateReviewFindingsPayload(parsed.payload).valid) state.result = unavailable(state, "codex-jsonl-final-agent-schema-invalid");
      else state.result = Object.freeze({
        available: true,
        code: "codex-jsonl-final-agent-complete",
        payload: parsed.payload,
        candidateText: state.candidate,
        retryEligible: false,
        diagnostics: diagnostics(state, "codex-jsonl-final-agent-complete", "completed")
      });
    }
    return state.result;
  };

  return Object.freeze({ write, end, bounds });
}

function safeEventIdentity(value) {
  return typeof value === "string" && value.length > 0 && !/[\r\n\0]/.test(value);
}

export function parseCodexReviewEventStream(input, options) {
  const parser = createCodexReviewEventParser(options);
  parser.write(input);
  return parser.end();
}
