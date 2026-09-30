# Global skills

Skills installed to every AI agent on this machine (`~/.cursor/skills/`,
`~/.codex/skills/`, `~/.claude/skills/`). One copy of each serves them all, so
changes here apply everywhere.

| Skill | Purpose |
| --- | --- |
| `pr-prepare` | Draft a PR title/body from the repo or shared template; CLI/IDE copy handoff |
| `feature-planning` | Triage work and draft concise (or full) tickets |

Customize here, not in a single agent's folder. Agent-only skills belong in that
agent's `skills/` directory instead; a name must never exist in both places, or
one copy overwrites the other.

The default PR body lives alongside this dir at `~/.config/agent-templates/`.