// Uniform JSON payload entrypoint contract for helpers that export functions
// but provide no command line of their own.
//
// Two shapes are supported, both reading one JSON request and writing one JSON
// result to stdout:
//
//   payload   <helper> --input <file> | --stdin      request: {operation, payload}
//   subcommand <helper> <verb> --input <file> | --stdin   request: payload
//
// Neither shape exposes a filesystem path to a runtime module, and neither
// makes an authorization decision.

import fs from "node:fs";

const USAGE_EXIT = 2;
const OPERATION_EXIT = 1;

const text = (value) => typeof value === "string" && value.trim().length > 0;

export function parseEntrypointArgs(argv, { invocation }) {
  const args = { help: false, stdin: false, input: undefined, verb: undefined };
  const rest = [...argv];
  if (rest[0] === "--help" || rest[0] === "-h") return { ok: true, args: { ...args, help: true } };
  if (invocation === "subcommand") {
    const verb = rest.shift();
    if (!text(verb) || verb.startsWith("-")) return { ok: false, code: "verb-required" };
    args.verb = verb;
  }
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--stdin") args.stdin = true;
    else if (arg === "--input") {
      const value = rest.shift();
      if (!text(value)) return { ok: false, code: "input-path-required" };
      args.input = value;
    } else return { ok: false, code: "unexpected-argument", detail: arg };
  }
  if (!args.help && !args.stdin && !text(args.input)) return { ok: false, code: "request-source-required" };
  if (args.stdin && text(args.input)) return { ok: false, code: "request-source-ambiguous" };
  return { ok: true, args };
}

export function readRequest(args, { readFile = fs.readFileSync } = {}) {
  let raw;
  try {
    raw = args.stdin ? readFile(0, "utf8") : readFile(args.input, "utf8");
  } catch {
    return { ok: false, code: "request-unreadable" };
  }
  try {
    return { ok: true, request: JSON.parse(raw) };
  } catch {
    return { ok: false, code: "request-not-json" };
  }
}

function usage(helper, invocation, operations) {
  const names = Object.keys(operations).sort();
  const shape = invocation === "subcommand"
    ? `${helper} <verb> (--input <file> | --stdin)`
    : `${helper} (--input <file> | --stdin)`;
  const label = invocation === "subcommand" ? "verbs" : "operations";
  return [
    `usage: ${shape}`,
    invocation === "subcommand"
      ? "request: the verb's JSON payload object"
      : 'request: {"operation": "<name>", "payload": {...}}',
    `${label}: ${names.join(", ")}`
  ].join("\n");
}

/**
 * @param {object} options
 * @param {string} options.helper declared manifest helper name
 * @param {"payload"|"subcommand"} options.invocation
 * @param {Record<string, Function>} options.operations explicit verb registry;
 *   never a dynamic lookup on a module namespace
 */
export function runHelperEntrypoint({ helper, invocation, operations, argv = process.argv.slice(2), io = {} }) {
  const write = io.write ?? ((line) => process.stdout.write(`${line}\n`));
  const writeError = io.writeError ?? ((line) => process.stderr.write(`${line}\n`));
  const emit = (payload) => write(JSON.stringify(payload, null, 2));

  const parsed = parseEntrypointArgs(argv, { invocation });
  if (!parsed.ok) {
    writeError(usage(helper, invocation, operations));
    emit({ ok: false, helper, error: { code: parsed.code, ...(parsed.detail ? { detail: parsed.detail } : {}) } });
    return USAGE_EXIT;
  }
  if (parsed.args.help) {
    write(usage(helper, invocation, operations));
    return 0;
  }

  const read = readRequest(parsed.args, io);
  if (!read.ok) {
    emit({ ok: false, helper, error: { code: read.code } });
    return USAGE_EXIT;
  }

  const operation = invocation === "subcommand" ? parsed.args.verb : read.request?.operation;
  if (!text(operation) || !Object.hasOwn(operations, operation)) {
    emit({ ok: false, helper, operation: text(operation) ? operation : null, error: { code: "operation-not-declared" } });
    return USAGE_EXIT;
  }
  const payload = invocation === "subcommand" ? read.request : read.request?.payload;

  try {
    const result = operations[operation](payload);
    emit({ ok: true, helper, operation, result: result === undefined ? null : result });
    return 0;
  } catch (error) {
    emit({ ok: false, helper, operation, error: { code: "operation-failed", message: error?.message ?? "operation failed" } });
    return OPERATION_EXIT;
  }
}

export function runAsMain(options) {
  // Do not force-exit immediately after writing a response. stdout is
  // asynchronous when piped, so process.exit() can truncate a valid large
  // payload before the downstream declared helper receives it.
  process.exitCode = runHelperEntrypoint(options);
}
