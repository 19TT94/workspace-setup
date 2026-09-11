---
name: code-review
description: >-
  Reviews Workspace Setup changes using the installer/seed conventions from AGENTS.md
  and .cursor/rules/workspace-setup.mdc. Use when the user asks for a code review, PR review,
  pre-push review, Agent Review help, or findings before opening a PR.
---

# Code review (Workspace Setup)

## When to use

- User asks to review changes, a branch diff, or a PR
- Before opening a PR (this repo commits straight to `master`)
- Complementing (not replacing) Cursor Agent Review or Bugbot

## Instructions

1. Read [`.cursor/BUGBOT.md`](../../BUGBOT.md) and [`.cursor/rules/workspace-setup.mdc`](../../rules/workspace-setup.mdc) for review rules and conventions.
2. Compare against `master` (the default branch) unless the user specifies otherwise.
3. Do **not** edit files unless the user asks — review only.
4. Syntax-check anything touched: `node --check <file>`. Do not run a real install.

## Output format

```markdown
## Summary
[1–2 sentences]

## Findings

### Blocker
- `path:line` — issue — suggested fix

### Suggestion
- ...

### Nit
- ... (skip items covered by tooling)

## Checklist
- [ ] `node --check` on edited scripts
- [ ] `npm run dry-run` passes if flows/prompts changed
- [ ] Seed ↔ home mapping in `scripts/audit-seeds.js` matches installer + README
- [ ] No repo-dev rules leaked into `agents/` (would seed every user’s global config)
```

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
- **Copy map in sync** — a new seed must be registered in `scripts/platform.js` (agents) or `scripts/install.js` (config), added to `scripts/audit-seeds.js`, and documented in the README tables.
- **Platform parity** — macOS (apps) vs Windows (agents in `--all`, no apps). Shared tools behave the same in `brew.js` and `winget.js`.
- **Dry run coverage** — file copies, dir creation, downloads, and repo deletion all log `Would ...` instead of acting in dry-run.
- **No repo-dev rules under `agents/`** — `.cursor/` holds rules for working on this repo; `agents/cursor/` is seeded to every user.
- **Drift policy** — local file changes that belong in seeds should go through the `audit-local-config` skill; do not bulk-copy home files.

## After local review

Remind the user: squash-commit to `master` only when asked; no PR flow is used in this repo.