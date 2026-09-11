# Code review rules (Cursor Agent Review + Bugbot)

Project rules for [Cursor Agent Review](https://cursor.com/docs/agent/agent-review) (local, before push) and [Bugbot](https://cursor.com/docs/bugbot) (GitHub PR reviews). Conventions live in [`rules/workspace-setup.mdc`](rules/workspace-setup.mdc).

## Repo layout

- **Installer:** `index.js`, `run.sh` / `run.ps1`, `scripts/` — prompts, copies, installs
- **Seeds:** `agents/` (global Cursor/Codex/Claude config), `tools/` (dotfile templates)
- **Mapping source of truth:** `scripts/audit-seeds.js`

## Always check

- Correctness of flows in `index.js` and `scripts/install.js` (`--all`, `--dry-run`, `--devtools`)
- **Dry-run discipline** — every mutating action (file copy, dir create, download, repo delete) must branch on `isDryRun()` and log `Would ...`
- Seed ↔ installer sync — new seeds registered in `scripts/platform.js` / `scripts/install.js`, mapped in `scripts/audit-seeds.js`, documented in README tables
- **Platform parity** — macOS (apps + agents flow) vs Windows (agents in `--all`, no apps); `brew.js` ↔ `winget.js` aligned for shared tools
- Platform-specific path bugs (home dir vs `%USERPROFILE%`, PowerShell profile detection)

## Prefer

- Existing patterns in neighboring files over new abstractions
- `shell.exec` helpers in `scripts/installers/` over raw `child_process` calls
- `node --check` + `npm run dry-run` for verification — never a real `npm start`
- Keeping repo-dev rules in `.cursor/` and this file, never in `agents/`

## Deprioritize in review

- Style nits in seed template content that don’t affect installer behavior
- Refactors outside the PR scope unless they fix a real bug
- Legacy `shells/` content — it is not called by `index.js`

## Security-sensitive areas

Flag blockers for:

- Secrets or machine paths committed into `tools/` or `agents/` templates (they seed every machine)
- Installing packages without the existing checks (or logging them in dry-run)
- Path handling that could write outside the home directory
- `node_modules/`, `.env*`, `.DS_Store` accidentally committed

## Priority paths

| Area | Paths |
|------|--------|
| Flows & CLI | `index.js`, `scripts/install.js` |
| Menus & registries | `scripts/platform.js` |
| Installers | `scripts/installers/brew.js`, `scripts/installers/winget.js` |
| Dry-run | `scripts/dry-run.js` |
| Dotfile seeds | `tools/` |
| Agent seeds | `agents/` |
| Audit map | `scripts/audit-seeds.js` |