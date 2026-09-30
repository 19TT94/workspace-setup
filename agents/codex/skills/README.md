# Codex-only skills

Skills installed to `~/.codex/skills/` but **not** to Cursor or Claude.

Most skills belong in `agents/skills/` instead — that directory is copied to
every selected agent. Use this folder only when a skill is genuinely Codex
specific (Codex built-ins, `AGENTS.md` conventions, etc.).

`~/.codex/skills/.system/` holds Codex's own built-in skills. It is not a repo
seed and `npm run audit` skips it.

Shared skills are installed first, then these, so a name collision here would
overwrite the shared copy. Keep skill names unique across `agents/skills/` and
`agents/codex/skills/`.
