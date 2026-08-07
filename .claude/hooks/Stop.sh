#!/usr/bin/env bash
# Stop hook — warns when UI files were edited but preview tools were never used.
# Heuristic only; outputs a warning to stderr (non-blocking).

input=$(cat)
transcript=$(echo "$input" | jq -r '.transcript_path // ""' 2>/dev/null)
[[ -z "$transcript" || ! -f "$transcript" ]] && exit 0

# Did this session edit any UI file (.tsx/.jsx/.css)?
ui_edited=$(grep -oE '"file_path":\s*"[^"]+\.(tsx|jsx|css)"' "$transcript" 2>/dev/null | head -1)

# Did this session use any browser/preview MCP tool?
# NOTE: the namespace is mcp__Claude_Browser__ (preview_start, navigate, read_page, computer, ...).
# This used to grep for mcp__Claude_Preview__, which never existed — the warning fired on every UI session.
preview_used=$(grep -oE '"name":\s*"mcp__(Claude_Browser|claude-in-chrome)__[a-z_]+"' "$transcript" 2>/dev/null | head -1)

if [[ -n "$ui_edited" ]] && [[ -z "$preview_used" ]]; then
  echo "⚠️  UI files were edited but no browser/preview tools were used this session." >&2
  echo "   CLAUDE.md says: verify in browser before claiming done." >&2
fi

exit 0
