---
description: Workspace Setup review rules — installer code, seed content, dry-run safety
---

# Review guide (Workspace Setup)

Applied by the global `code-review` skill (and Claude's built-in `/code-review`) to every change in this repo.

## Before reviewing

1. Read [`.cursor/BUGBOT.md`](../BUGBOT.md) and [`.cursor/rules/workspace-setup.mdc`](../rules/workspace-setup.mdc) for review rules and conventions.
2. Compare against `master` (the default branch) unless the user specifies otherwise.
3. Syntax-check anything touched: `node --check <file>`. Do not run a real install.

## Checklist

- [ ] `node --check` on edited scripts
- [ ] `npm run dry-run` passes if flows/prompts changed
- [ ] Seed ↔ home mapping in `scripts/audit-seeds.js` matches installer + README
- [ ] No repo-dev rules leaked into `agents/` (would seed every user’s global config)
- [ ] Global core rules identical across Claude, Codex, and Cursor seeds

## Priority areas

| Area | Paths |
|------|--------|
| Flows & CLI | `index.js` (`--all`, `--devtools`, `--dry-run`), `scripts/install.js` |
| Menus & registries | `scripts/platform.js` (`AGENT_INSTALL_PATHS`, `getConfigChoices`, `getDevtoolChoices`) |
| Installers | `scripts/installers/brew.js`, `scripts/installers/winget.js` (keep parity) |
| Dry-run behavior | `scripts/dry-run.js` — anything mutating must branch on `isDryRun()` + log `Would ...` |
| Seed content | `tools/` (dotfiles), `agents/` (global Cursor/Codex/Claude config) |
| Audit | `scripts/audit-seeds.js` — mapping is the source of truth |

## Workspace Setup-specific checks

- **Seed vs installer separation** — new template content belongs in `agents/`/`tools/`; new installer behavior belongs in `scripts/`. Do not mix.
- **Copy map in sync** — a new seed must be registered in `scripts/platform.js` (agents) — including any per-agent `skip` list, mirrored as `skipSeedTopDirs` in the audit — or `scripts/install.js` (config), added to `scripts/audit-seeds.js`, and documented in the README tables.
- **Platform parity** — macOS (apps) vs Windows (agents in `--all`, no apps). Shared tools behave the same in `brew.js` and `winget.js`.
- **Dry run coverage** — file copies, dir creation, downloads, and repo deletion all log `Would ...` instead of acting in dry-run.
- **No repo-dev rules under `agents/`** — `.cursor/` holds rules for working on this repo; `agents/cursor/` is seeded to every user.
- **Global rules stay identical** — `agents/claude/CLAUDE.md` and `agents/codex/AGENTS.md` share the same body below their title and intro line; `agents/cursor/rules/*.mdc` carry the same sections split across files (frontmatter aside). A rule added, removed, or reworded in one must change in all three. Compare with `diff <(tail -n +4 agents/claude/CLAUDE.md) <(tail -n +4 agents/codex/AGENTS.md)` and check each section against the Cursor rules.
- **Drift policy** — local file changes that belong in seeds should go through the `audit-local-config` skill; do not bulk-copy home files.

## After local review

Remind the user: commit, push, and open a PR only through the `pr-prepare` skill, and only when asked.