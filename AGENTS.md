# Workspace Setup — coding agents

Interactive CLI (Node.js, CommonJS) that bootstraps a Mac or Windows machine with dotfiles, devtools, AI agent starter files, and (on macOS) desktop apps. It is a **seed template**: fork it, customize `agents/` and `tools/`, and point new hires at `./run.sh` / `.\run.ps1`.

```bash
npm install
npm start          # interactive install
npm run dry-run    # walk every prompt, change nothing
npm run audit      # diff installed home-dir files vs repo seeds
```

This file is the **tool-agnostic** entrypoint for coding agents (Cursor, Codex, opencode, Claude Code, etc.) working **on** this repo.

## Two kinds of content — don’t mix them

| Kind | Paths | What it is |
| --- | --- | --- |
| **Installer code** | `index.js`, `run.sh` / `run.ps1`, `scripts/` | The CLI that asks questions and copies/installs things |
| **Seed content** | `agents/`, `tools/` | Templates copied into the home directory on install |

`agents/` holds global Cursor, Codex, and Claude rules + skills. `tools/` holds dotfile templates (`zshrc`, `vimrc`, `tmux.conf`, `starship.toml`, `powershell-profile.ps1`, `bash_profile`). Edit those files here to change what future machines get.

The legacy `shells/` directory is **not** called by `index.js`; do not extend it.

## Repo-level rules vs seeded rules

| Path | Role | Installed? |
| --- | --- | --- |
| `AGENTS.md` (this file) + `.cursor/rules/` | Rules for agents working **on this repo** (`CLAUDE.md` imports this file) | No |
| `.cursor/skills/` (`.claude/skills` symlinks here) | Skills for agents working **on this repo** | No |
| `agents/skills/` | Shared skills seeded to every agent's `skills/` dir | Yes |
| `agents/templates/` | Shared templates (e.g. PR body) seeded to `~/.config/agent-templates/` | Yes |
| `agents/cursor/rules/` | Global Cursor rules seeded to `~/.cursor/rules/` | Yes |
| `agents/cursor/skills/` | Cursor-only skills seeded to `~/.cursor/skills/` | Yes |
| `agents/codex/` | Global Codex `AGENTS.md` + Codex-only skills seeded to `~/.codex/` | Yes |
| `agents/claude/CLAUDE.md` | Global Claude config seeded to `~/.claude/CLAUDE.md` | Yes |
| `agents/claude/skills/` | Claude-only skills seeded to `~/.claude/skills/` | Yes |

Never add repo-dev rules under `agents/` — that would push them into every user’s global config. Keep repo-dev config in `.cursor/` and this file.

## Shared vs agent-specific seeds

A skill or template goes in **one** of two places:

- `agents/skills/` — works for every agent. Installed to all three skills dirs. Never name a specific agent's home path in here; describe your own location generically instead.
- `agents/<agent>/skills/` — only that agent. Use for Cursor/Codex/Claude-specific behavior.

**A skill name must live in exactly one seed.** `agents/skills/foo/` and `agents/cursor/skills/foo/` both target `~/.cursor/skills/foo/`, so one copy silently overwrites the other. Shared seeds are installed first, then the agent-specific ones; `install_agents` warns when it finds a collision.

Shared templates in `agents/templates/` install once to `~/.config/agent-templates/` rather than being copied into each skill, so a skill points at one path instead of carrying a private duplicate.

## Seed → home mapping (source of truth: `scripts/audit-seeds.js`)

| Seed | Target |
| --- | --- |
| `tools/zshrc` | `~/.zshrc` |
| `tools/bash_profile` | `~/.bash_profile` |
| `tools/powershell-profile.ps1` | PowerShell `$PROFILE` |
| `tools/starship.toml` | `~/.config/starship.toml` |
| `tools/tmux.conf` | `~/.tmux.conf` |
| `tools/wezterm.lua` | `~/.config/wezterm/wezterm.lua` |
| `tools/lfrc` | `~/.config/lf/lfrc` |
| `tools/vimrc` | `~/.vimrc` |
| `tools/nvim/init.lua` | `~/.config/nvim/init.lua` (macOS) / `%LOCALAPPDATA%\nvim\init.lua` (Windows) |
| `tools/hints.md` | `~/.config/shell/hints.md` |
| `tools/pstash` | `~/.local/bin/pstash` (macOS; prompts are kept in `~/.config/shell/prompts.md`, which is not a seed) |
| `tools/vscode-settings.json` | VS Code User `settings.json` (`~/Library/Application Support/Code/User/` on macOS, `%APPDATA%\Code\User\` on Windows) |
| `tools/cursor-settings.json` | Cursor User `settings.json` (`~/Library/Application Support/Cursor/User/` on macOS, `%APPDATA%\Cursor\User\` on Windows) |
| `agents/cursor/rules/` (dir) | `~/.cursor/rules/` |
| `agents/cursor/README.md` | `~/.cursor/rules/README.md` |
| `agents/skills/` + `agents/cursor/skills/` (dirs) | `~/.cursor/skills/` |
| `agents/codex/AGENTS.md` | `~/.codex/AGENTS.md` |
| `agents/skills/` + `agents/codex/skills/` (dirs) | `~/.codex/skills/` |
| `agents/claude/CLAUDE.md` | `~/.claude/CLAUDE.md` |
| `agents/skills/` + `agents/claude/skills/` (dirs) | `~/.claude/skills/` |
| `agents/templates/` (dir) | `~/.config/agent-templates/` |

Rows that list two seeds are installed shared-first, agent-specific-second. `~/.gitignore` is generated (not a repo seed); `~/.nvm` and git completions in `~/.zsh/` are created/downloaded, not copied. Keep this list in sync whenever seeds change.

## Drift policy — local edits vs repo seeds

Machines drift: users edit `~/.zshrc`, `~/.codex/AGENTS.md`, etc. after install. When the user asks whether local changes should come back into the repo, use the **audit-local-config** skill and `scripts/audit-seeds.js`, then classify each diff:

- **Machine-local** — personal/machine-specific tweaks (paths, secrets, personal preferences). Do **not** commit into seeds. Leave the installed file as-is.
- **Template-worthy** — fixes/improvements that benefit every new machine. Copy the local file back into the matching seed under `agents/` or `tools/`, then commit only when asked.
- **Undetermined** — ask the user before acting.

Do not silently overwrite installed files with seeds (the installer prompts before overwriting; so should any manual sync). Do not commit local files wholesale.

## Conventions

- **Test with dry run, never a real install.** `npm run dry-run` / `node ./index.js --dry-run` walks prompts and logs `Would ...` actions. Real `npm start` takes over your shell config and may delete the repo at the end.
- **Never drive the installer with `yes` or a pty.** `yes "" | script -q /dev/null node ./index.js ...` is a runaway: the pty echoes every injected newline, inquirer re-renders a full screen per keypress, and the echo is written back out in a loop. It pegs the CPU and can lock up the machine. If a flow must run non-interactively, script bounded keystrokes (`printf '\n\n\n'`) and cap any log capture — never pipe `yes` into it.
- **Dry run is default-deny at the `shell.js` layer.** `shell.exec`, `mkdir`, `cp`, `rm`, and `ShellString.toEnd` refuse to mutate when `isDryRun()` and log `Would ... (blocked by dry run)` instead. A call site may omit its own `isDryRun()` guard without touching the machine. Use `shell.execProbe` / `shell.execCapture` for read-only checks — those still run so summaries stay accurate.
- **A bare Enter is always the safe answer.** The `expand` prompts in `index.js` (`keep`) and `scripts/install.js` (`promptOverwrite`) list Keep/Skip **first**, so Enter can never overwrite a dotfile or delete the repo. Keep it that way if you add prompts.
- **CommonJS + no new dependencies.** Match the existing style (`require`, 4-space indent, `commander`, `inquirer`). Prefer `shell.exec` helpers in `scripts/installers/`.
- **Registry mappings live in `scripts/platform.js`** — `AGENT_INSTALL_PATHS`, `getConfigChoices`, `getDevtoolChoices`. `scripts/install.js` consumes them. Keep installer source→target in sync with the audit map and README tables.
- **Platform parity** — flows differ by OS (apps are macOS-only; agent seeds are in Windows `--all`). Respect `isWindows` branches; keep `brew.js` and `winget.js` behaviorally aligned for shared tools.
- **Syntax check any edited JS**: `node --check scripts/foo.js`.
- Commit only when explicitly asked.

## Review guide

[`.cursor/review/workspace-setup.md`](.cursor/review/workspace-setup.md) holds this repo's review rules. The global `code-review` skill (Cursor, Codex) and Claude's built-in `/code-review` apply it.

## Skills

| Skill | Purpose |
| --- | --- |
| [`audit-local-config`](.cursor/skills/audit-local-config/SKILL.md) | Diff installed home-dir files vs repo seeds; decide what belongs back in the repo |
| [`pr-prepare`](.cursor/skills/pr-prepare/SKILL.md) | Pre-PR checklist (syntax checks, dry run, README/seed sync) |