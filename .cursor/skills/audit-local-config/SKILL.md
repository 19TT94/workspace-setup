---
name: audit-local-config
description: >-
  Audits the locally installed workspace-setup files (dotfiles in tools/ targets plus the
  Cursor/Codex/Claude agent files in agents/ targets) against the seed templates in THIS repo.
  Use when the user asks what has drifted on their machine, whether a local config change should
  be committed back to the repo, or to reconcile installed files with the seed templates.
---

# Audit local config vs repo seeds

Workspace-setup is a template: `agents/` and `tools/` are seeds that the installer copies into the home directory. Over time the installed copies drift (users edit `~/.zshrc`, `~/.codex/AGENTS.md`, `~/.claude/CLAUDE.md`, etc.). This skill finds that drift and decides what belongs back in the repo.

## Steps

1. **Run the audit.** From the repo root:

   ```bash
   node scripts/audit-seeds.js --full     # full unified diffs
   node scripts/audit-seeds.js            # compact report
   ```

   `scripts/audit-seeds.js` is the source of truth for the seed → home mapping. Keep this skill’s table in sync with it.

2. **Read each status.**

   | Status | Meaning |
   |--------|---------|
   | `identical` | Installed file matches the seed — nothing to do. |
   | `DIFFERS` | Installed file exists and was edited locally. Review the diff. |
   | `NOT INSTALLED` | Seed is in the repo but not present in the home directory (e.g. an agent flow was never run on this machine). |
   | `LOCAL ONLY` | File exists in the home directory with no repo seed (e.g. Codex’s `~/.codex/skills/.system/` built-ins are skipped). Usually machine-local. |

3. **Classify every `DIFFERS` file** using the drift policy in the repo-root `AGENTS.md`:

   - **Machine-local** — personal paths, secrets, machine-specific preferences. Do **not** touch the seed. Leave the installed file as-is.
   - **Template-worthy** — a fix or improvement that benefits any new machine built from this repo. Propose copying the installed file back into the matching seed.
   - **Undetermined** — ask the user before acting.

4. **Pull a template-worthy change back into the repo** (reverse of the install direction):

   - Dotfile → write its content into the matching file under `tools/` (e.g. `~/.zshrc` → `tools/zshrc`).
   - Agent file → write into the matching file under `agents/` (e.g. `~/.codex/AGENTS.md` → `agents/codex/AGENTS.md`, `~/.cursor/rules/*.mdc` → `agents/cursor/rules/`).
   - Only copy files already mapped in the audit. Do **not** bulk-copy, and never commit unless the user asks.

5. **Verify nothing broke.** After editing a seed, run `npm run dry-run` to confirm the installer still walks cleanly, and `node --check` on any edited JS. For non-code seeds there is no compile step — confirm the mapping row still points at the file.

## Seed → home mapping

| Repo seed | Installed target |
| --- | --- |
| `tools/zshrc` | `~/.zshrc` |
| `tools/bash_profile` | `~/.bash_profile` |
| `tools/powershell-profile.ps1` | PowerShell `$PROFILE` |
| `tools/starship.toml` | `~/.config/starship.toml` |
| `tools/tmux.conf` | `~/.tmux.conf` |
| `tools/wezterm.lua` | `~/.config/wezterm/wezterm.lua` |
| `tools/lfrc` | `~/.config/lf/lfrc` |
| `tools/vimrc` | `~/.vimrc` |
| `agents/cursor/rules/` (dir) | `~/.cursor/rules/` |
| `agents/cursor/README.md` | `~/.cursor/rules/README.md` |
| `agents/codex/AGENTS.md` | `~/.codex/AGENTS.md` |
| `agents/codex/skills/` (dir) | `~/.codex/skills/` |
| `agents/claude/CLAUDE.md` | `~/.claude/CLAUDE.md` |

Not seed-backed (not audited as diffs): `~/.gitignore` is generated; `~/.nvm` and `~/.zsh/` git completions are created/downloaded; `~/.codex/skills/.system/` is Codex built-in content.

## Output format

```markdown
## Drift summary
- N seeded files identical, M differ, K not installed, L local-only
- Template-worthy candidates: <files>

| File | Target | Status | Action |
| --- | --- | --- | --- |
| tools/zshrc | ~/.zshrc | DIFFERS | Copy local → seed (template-worthy) |
| ... | | | |

## Recommended changes
- tools/zshrc: adopt local NVM guard + starship init
- tools/tmux.conf: adopt vi mode + pane binding block
- (each with a 1-line rationale)
```

## Do not

- Write local files into seeds without classifying them first.
- Commit secrets, machine paths, or editor-specific personalization into seeds.
- Overwrite installed home files with seeds without prompting (match the installer’s behavior).
- Run a real `npm start` to test anything — use `npm run dry-run`.