# Cursor starter files

These files install as global Cursor config:

| Seed | Target |
| --- | --- |
| `rules/` | `~/.cursor/rules/` |
| `README.md` | `~/.cursor/rules/README.md` |
| `skills/` | `~/.cursor/skills/` (plus the shared `agents/skills/`) |

Cursor also supports project-scoped rules and skills under `.cursor/` inside each repository. Copy or adapt these files there when you want team-shared config in version control.

## Seeded global skills

Shared skills from `agents/skills/` (see `skills/README.md` for Cursor-only ones):

| Skill | Purpose |
| --- | --- |
| `pr-prepare` | Draft PR title/body from the default or repo template, ask before creating, comment the PR; CLI/IDE copy handoff |
| `feature-planning` | Triage work and draft concise (or full) tickets |

Default PR body: `~/.config/agent-templates/pull_request_template.md`. Configure ticket key / tracker URL in `skills/feature-planning/reference.md`.
