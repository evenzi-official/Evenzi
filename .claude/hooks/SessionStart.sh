#!/usr/bin/env bash
# SessionStart hook — injects Evenzi connector context at session start
# Output goes to Claude's context as additional info.

REPO_ROOT="$(git -C "$(dirname "$0")/../.." rev-parse --show-toplevel 2>/dev/null || pwd)"
BRANCH="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo unknown)"

cat <<EOF
=== Evenzi session context ===
Branch: $BRANCH
Repo:   $REPO_ROOT

Active connectors (this project ONLY — do not default to other workspaces):
  • ClickUp   → Workspace 90161512057 / Product space 90166506901
  • Supabase  → Project smjkbmkxweevqpvygabe (ap-northeast-1)
  • Vercel    → Team evenzi / Project evenzi (prj_dXWmfgGtBOJDsBO18BOmcNxfwwoX)
  • Figma     → File LjoTKwL7pkpYVnAW6hr4s8 (canonical, locked designs)
  • Stitch    → Project 3859360114226566614 (workshop drafts)

Design rule: prefer Figma. Fall back to Stitch only if a screen isn't yet in Figma.
See CLAUDE.md > "Project Connectors" for full table.
EOF

exit 0
