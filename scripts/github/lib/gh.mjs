import { spawnSync } from "node:child_process";

export function ghCommand(args, options = {}) {
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    throw new TypeError("ghCommand args must be an array of strings");
  }

  const command = ["gh", ...args];
  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      command,
      stdout: "",
      stderr: "",
      json: null
    };
  }

  const result = spawnSync("gh", args, {
    cwd: options.cwd,
    encoding: "utf8",
    input: options.input
  });

  const response = {
    ok: result.status === 0,
    dryRun: false,
    command,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    json: null
  };

  if (options.json && response.ok) {
    try {
      response.json = response.stdout.trim() ? JSON.parse(response.stdout) : null;
    } catch (error) {
      response.ok = false;
      response.parseError = error.message;
    }
  }

  return response;
}
