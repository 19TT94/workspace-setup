# Cursor-only skills

Skills installed to `~/.cursor/skills/` but **not** to Codex or Claude.

Most skills belong in `agents/skills/` instead — that directory is copied to
every selected agent. Use this folder only when a skill is genuinely Cursor-only
(Cursor-specific APIs, `.mdc` conventions, editor UI affordances).

Shared skills are installed first, then these, so a name collision here would
overwrite the shared copy. Keep skill names unique across `agents/skills/` and
`agents/cursor/skills/`.
