#!/usr/bin/env bash
# Build the shared SDD runtime from this working tree and report the override
# that points the launcher at it.
#
# This never edits a shell startup file and never changes the installed active
# runtime. It prints the export line for the operator to apply. Every launcher
# result produced through the override is labelled mode: dev.
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_root="${AI_SKILLS_DEV_RUNTIME_ROOT:-${TMPDIR:-/tmp}/ai-skills-dev-runtime}"
output="${output_root%/}/runtime"

if ! command -v node >/dev/null 2>&1; then
  printf 'node-unavailable: install Node 20 or newer before linking a development runtime\n' >&2
  exit 1
fi

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "${node_major}" -lt 20 ]; then
  printf 'node-version-unsupported: found %s, required >=20\n' "$(node -p 'process.versions.node')" >&2
  exit 1
fi

rm -rf "${output}"
mkdir -p "${output_root}"

build_result="$(node "${repository_root}/scripts/runtime/build-runtime.mjs" --source "${repository_root}" --output "${output}")"
printf '%s\n' "${build_result}"

if [ "${1:-}" = "--quiet" ]; then
  exit 0
fi

cat <<EOF

Development runtime built at: ${output}
Apply the override in this shell:

  export AI_SKILLS_RUNTIME_ROOT="${output}"

Launcher results produced with the override set report "mode": "dev".
Unset the variable to return to the installed runtime.
EOF
