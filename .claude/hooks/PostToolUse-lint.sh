#!/usr/bin/env bash
# PostToolUse hook — lints TS/TSX files after Edit/Write.
# Surfaces lint errors back to Claude in the same turn.
# Reads JSON event from stdin.

input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null)

# Only lint TS/TSX/JS/JSX files that exist
if [[ ! "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then exit 0; fi
if [[ ! -f "$file" ]]; then exit 0; fi

REPO_ROOT="$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null)"
[[ -z "$REPO_ROOT" ]] && exit 0
[[ ! -f "$REPO_ROOT/package.json" ]] && exit 0

# Run eslint quietly; only print if there are issues
output=$(cd "$REPO_ROOT" && npx --no-install eslint --no-error-on-unmatched-pattern --max-warnings 0 "$file" 2>&1)
status=$?

if [[ $status -ne 0 ]]; then
  echo "=== eslint issues in $file ==="
  echo "$output" | head -40
fi

exit 0
