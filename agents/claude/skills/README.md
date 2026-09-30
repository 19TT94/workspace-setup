# Claude-only skills

Skills installed to `~/.claude/skills/` but **not** to Cursor or Codex.

Most skills belong in `agents/skills/` instead — that directory is copied to
every selected agent. Use this folder only when a skill is genuinely
Claude-specific (Claude Code hooks, `CLAUDE.md` conventions, etc.).

Shared skills are installed first, then these, so a name collision here would
overwrite the shared copy. Keep skill names unique across `agents/skills/` and
`agents/claude/skills/`.
