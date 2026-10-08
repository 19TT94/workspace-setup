# Shared agent templates

Canonical defaults referenced by global skills. Installed to
`~/.config/agent-templates/` on both macOS and Windows, and shared by every agent
— a skill points at that one path instead of carrying a private copy.

| File | Used by | Install location |
| --- | --- | --- |
| `pull_request_template.md` | `pr-prepare` | `~/.config/agent-templates/pull_request_template.md` |
| `OPINIONS.md` | global rules (judgment calls) | `~/.config/agent-templates/OPINIONS.md` |

Edit here before running the installer to change the default for future machines.
Installed copies drift — run `npm run audit` to compare, and see the
`audit-local-config` skill to decide whether a local change belongs back here.

Skills prefer a **repo** `.github/pull_request_template.md` when present;
otherwise they use the shared default.
