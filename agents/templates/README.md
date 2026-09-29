# Shared agent templates

Canonical defaults referenced by global skills. Edit here first, then copy into each skill package so installs stay self-contained.

| File | Used by | Install location |
| --- | --- | --- |
| `pull_request_template.md` | `pr-prepare` | Copied into `agents/cursor/skills/pr-prepare/` and `agents/claude/skills/pr-prepare/` (then `~/.cursor/skills/...` / `~/.claude/skills/...`) |

Skills prefer a **repo** `.github/pull_request_template.md` when present; otherwise they use the bundled copy.
