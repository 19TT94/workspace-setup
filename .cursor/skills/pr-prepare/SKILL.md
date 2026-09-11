---
name: pr-prepare
description: >-
  Prepares a Workspace Setup branch for commit/PR: syntax checks, dry run, seed sync, and a
  commit-message reminder. Use when the user is about to commit, open a PR, or wants a pre-merge
  checklist.
disable-model-invocation: true
---

# Prepare pull request (Workspace Setup)

## Repo layout

- **Installer code:** `index.js`, `run.sh` / `run.ps1`, `scripts/`
- **Seed templates:** `agents/` (global Cursor/Codex/Claude config), `tools/` (dotfiles)
- **Mapping source of truth:** `scripts/audit-seeds.js`
- **Legacy (do not touch):** `shells/`

## Checklist (run in order)

1. **Git status**
   ```bash
   git status
   git diff
   ```
   Confirm `node_modules/` is never staged.

2. **Syntax-check every edited JS**
   ```bash
   node --check index.js scripts/install.js scripts/platform.js scripts/audit-seeds.js
   ```
   Or target only the files you changed.

3. **Dry run**
   ```bash
   npm run dry-run
   ```
   Walks every prompt and logs `Would ...` actions. Never test with a real `npm start` — it overwrites shell config and can delete this repo.

4. **Seed sync check** (if `agents/` or `tools/` changed)
   ```bash
   node scripts/audit-seeds.js
   ```
   If you touched a dotfile or agent seed, confirm the audit map and README tables still point at the right files. If you are reconciling local drift, use the `audit-local-config` skill instead of guessing.

5. **Platform parity** — if you changed a shared tool/flow, confirm `brew.js` and `winget.js` (or macOS and Windows branches in `scripts/platform.js`) behave symmetrically.

## Commit message hints

- Short imperative summary (e.g. `add seed audit script and local-config skill`).
- Mention seed/README/audit-map sync in the body when a new seed was added.
- Only commit when the user explicitly asks.

## Do not

- Commit secrets, `.env*`, `.DS_Store`, or `node_modules/`
- Extend `shells/` — it is legacy content not called by `index.js`
- Add repo-dev rules under `agents/` (that seeds every user’s global config)
- Run a real install to "test" the installer