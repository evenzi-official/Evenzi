#!/usr/bin/env bash
# Stop hook — warns when UI files were edited but preview tools were never used.
# Heuristic only; outputs a warning to stderr (non-blocking).

input=$(cat)
transcript=$(echo "$input" | jq -r '.transcript_path // ""' 2>/dev/null)
[[ -z "$transcript" || ! -f "$transcript" ]] && exit 0

# Did this session edit any UI file (.tsx/.jsx/.css)?
ui_edited=$(grep -oE '"file_path":\s*"[^"]+\.(tsx|jsx|css)"' "$transcript" 2>/dev/null | head -1)

# Did this session use any preview MCP tool?
preview_used=$(grep -oE '"name":\s*"mcp__Claude_Preview__[a-z_]+"' "$transcript" 2>/dev/null | head -1)

if [[ -n "$ui_edited" ]] && [[ -z "$preview_used" ]]; then
  echo "⚠️  UI files were edited but no preview_* tools were used this session." >&2
  echo "   CLAUDE.md says: verify in browser before claiming done." >&2
fi

exit 0
