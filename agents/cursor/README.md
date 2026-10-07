# Cursor starter files

These files install as global Cursor config:

| Seed | Target |
| --- | --- |
| `rules/` | `~/.cursor/rules/` |
| `README.md` | `~/.cursor/rules/README.md` |
| `skills/` | `~/.cursor/skills/` (plus the shared `agents/skills/`) |

Cursor also supports project-scoped rules and skills under `.cursor/` inside each repository. Copy or adapt these files there when you want team-shared config in version control.

## Shared files

Shared skills from `agents/skills/` install to `~/.cursor/skills/` alongside the Cursor-only ones. The shared PR template installs to `~/.config/agent-templates/pull_request_template.md`.
