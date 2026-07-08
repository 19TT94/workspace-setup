# Workspace Setup

Interactive CLI for bootstrapping a new Mac or Windows machine with dotfiles, devtools, AI agent starter files, and (on macOS) desktop apps.

The installer is prompt-driven: you pick a flow, uncheck anything you do not want, and confirm overwrites when target files already exist.

## Purpose

This repository is a **starting template for organization developer onboarding** or **personal developer setup**, not a one-size-fits-all installer you run as-is forever.

Fork it for you or your team, then customize the seed files and install lists to match how your org works:

- **`tools/`** — shell profiles, editor config, and other dotfiles every developer should get
- **`agents/`** — global Cursor, Codex, and Claude rules and skills that reflect your coding standards
- **`scripts/install.js`** and **`scripts/installers/`** — which devtools and apps are offered during setup

New hires clone **your fork**, run the bootstrap script once, and get a consistent baseline environment without IT hand-installing the same packages on every machine. Teams can still uncheck items in the prompts when a role does not need everything (e.g. skip mobile tooling or specific apps).

Typical workflow for an organization:

1. Fork this repo into your org’s GitHub (or equivalent)
2. Edit `tools/`, `agents/`, and installer choices for your stack and policies
3. Document your fork’s clone URL in internal onboarding docs
4. Point new developers at `./run.sh` (macOS) or `.\run.ps1` (Windows) on day one

Use `npm run dry-run` while customizing so you can verify flows before asking anyone to run a real install.

## What it does

- **Configuration files** — copies shell profiles, gitignore rules, and editor config into your home directory
- **Devtools** — installs common CLI tools via Homebrew (macOS) or winget (Windows)
- **AI agent starter files** — seeds Cursor, Codex, and Claude global config from `agents/`
- **Desktop apps** — installs selected GUI apps via Homebrew Cask (**macOS only**)
- **Dry run** — walk through every prompt and preview actions without changing anything

## Prerequisites

### macOS

- Terminal access
- `run.sh` bootstraps Xcode Command Line Tools, Homebrew, and Node if they are missing

### Windows

- PowerShell 5.1+ or PowerShell 7
- [App Installer](https://apps.microsoft.com/detail/9nblggh4nns1) / winget (Windows 10 1709+ or Windows 11)
- `run.ps1` bootstraps Node via winget if it is missing

### Both platforms

- Node.js and npm (installed automatically by the bootstrap scripts above if needed)

## Quick start

### macOS

```bash
git clone git@github.com:YOUR-ORG/workspace-setup.git
cd workspace-setup
./run.sh
```

### Windows (PowerShell)

```powershell
git clone git@github.com:YOUR-ORG/workspace-setup.git
cd workspace-setup
.\run.ps1
```

Replace `YOUR-ORG` with your fork’s org or username. The examples below use the upstream repo.

### Already have Node?

```bash
npm install
npm start
```

Preview a run without making changes:

```bash
npm run dry-run
```

## Interactive flows

If you launch without CLI flags, you choose one of these flows:

| Flow                                          |          macOS           |            Windows            |
| --------------------------------------------- | :----------------------: | :---------------------------: |
| Install everything                            | config + devtools + apps | config + devtools + AI agents |
| Install everything except configuration files |     devtools + apps      |         devtools only         |
| Install devtools and configuration files      |           yes            |              yes              |
| Install devtools only                         |           yes            |              yes              |
| Install apps only                             |           yes            |               —               |
| Install AI agent starter files                |           yes            |              yes              |

Each flow uses checkbox prompts so you can unselect individual items before anything runs.

## CLI flags

| Flag             | Description                                                                |
| ---------------- | -------------------------------------------------------------------------- |
| `-a, --all`      | Run the full platform-supported install without the main menu              |
| `-t, --devtools` | Install devtools only, without the main menu                               |
| `-d, --dry-run`  | Show prompts and log `[dry-run]` actions; no files or packages are changed |
| `-v, --version`  | Print version                                                              |

Examples:

```bash
# Preview the interactive experience safely
node ./index.js --dry-run

# Non-interactive full install (platform-specific scope)
node ./index.js --all

# Devtools only, preview mode
node ./index.js --dry-run --devtools
```

**Note:** `--all` behavior differs by platform. On macOS it includes apps but not AI agent files. On Windows it includes AI agent files but not apps.

## Project layout

```text
workspace-setup/
  index.js                 # CLI entry point
  run.sh / run.ps1         # Platform bootstrap scripts
  agents/                  # AI agent starter files (Cursor, Codex, Claude)
  tools/                   # Dotfile templates (zshrc, vimrc, starship, PowerShell profile, ...)
  scripts/
    install.js             # Install orchestration and file-copy helpers
    platform.js            # OS detection and platform-specific menus
    dry-run.js             # Dry-run mode
    installers/
      brew.js              # macOS Homebrew installs
      winget.js            # Windows winget installs
  shells/                  # Legacy shell scripts (not used by index.js)
```

Seed files in `tools/` and `agents/` are copied into your home directory. Edit them in this repo first if you want to change defaults for future machines.

## Configuration files

Prompts let you pick which dotfiles to install. Existing files trigger an overwrite confirmation.

### macOS

| Option    | Source            | Target                                             |
| --------- | ----------------- | -------------------------------------------------- |
| gitignore | generated         | `~/.gitignore` (`*.DS_Store`)                      |
| zshrc     | `tools/zshrc`     | `~/.zshrc` (+ git shell completions in `~/.zsh/`)  |
| nvm       | —                 | creates `~/.nvm`                                   |
| tmux.conf | `tools/tmux.conf` | `~/.tmux.conf`                                     |
| vimrc     | `tools/vimrc`     | `~/.vimrc` (+ pathogen and NERDTree when selected) |

### Windows

| Option             | Source                         | Target                                                       |
| ------------------ | ------------------------------ | ------------------------------------------------------------ |
| gitignore          | generated                      | `%USERPROFILE%\.gitignore` (`Thumbs.db`, `desktop.ini`, ...) |
| PowerShell profile | `tools/powershell-profile.ps1` | `$PROFILE`                                                   |
| nvm                | —                              | prepares `%LOCALAPPDATA%\nvm` for NVM for Windows            |
| vimrc              | `tools/vimrc`                  | `%USERPROFILE%\.vimrc`                                       |

## AI agent starter files

Available on both platforms as a standalone flow or as part of Windows `--all`.

| Agent        | Source                      | Target (macOS)                    | Target (Windows)                                      |
| ------------ | --------------------------- | --------------------------------- | ----------------------------------------------------- |
| Cursor rules | `agents/cursor/rules/`      | `~/.cursor/rules/`                | `%USERPROFILE%\.cursor\rules\`                        |
| Cursor docs  | `agents/cursor/README.md`   | `~/.cursor/rules/README.md`       | `%USERPROFILE%\.cursor\rules\README.md`               |
| Codex        | `agents/codex/AGENTS.md`    | `~/.codex/AGENTS.md`              | `%USERPROFILE%\.codex\AGENTS.md`                      |
| Codex skills | `agents/codex/skills/`      | `~/.codex/skills/`                | `%USERPROFILE%\.codex\skills\`                        |
| Claude Code  | `agents/claude/CLAUDE.md`   | `~/.claude/CLAUDE.md`             | `%USERPROFILE%\.claude\CLAUDE.md`                     |

Customize the files under `agents/` before running the installer to change what gets copied.

## Devtools

Installed only when selected in the devtools checkbox. The installer checks whether each tool is already present before attempting installation.

### macOS (Homebrew)

`xcode-select`, `homebrew`, `homebrew cask` (verification only), `node`, `php`, `python`, `starship`, `nvm`, `npm`, `yarn`, `composer`, `vue`, `laravel`, `tmux`, `docker`, `github cli`

`react` appears in the menu but has no install step yet.

### Windows (winget)

`git`, `winget` (verification only), `node`, `php`, `python`, `starship`, `nvm-windows`, `npm`, `yarn`, `composer`, `vue`, `laravel`, `docker` (CLI only), `github cli`

## Desktop apps (macOS only)

Installed via `brew install --cask` when selected:

`virtualbox`, `vagrant`, `docker desktop`, `slack`, `atom`, `vscode`, `sublime text`, `sequel pro`, `postman`, `cyberduck`, `spotify`, `android studio`, `google chrome`, `firefox`, `brave`, `mark text`, `iterm2`

## After installation

### macOS

```bash
source ~/.zshrc
```

Or restart Terminal / iTerm.

### Windows

Restart Windows Terminal, or reload your profile:

```powershell
. $PROFILE
```

## Dry run

Use dry run to explore flows on a machine you do not want to change yet:

```bash
npm run dry-run
```

- All menus and overwrite prompts still appear
- Package installs, file copies, and directory creation are logged as `[dry-run] Would ...`
- Read-only checks (e.g. whether `node` is installed) still run so summaries are realistic
- Choosing to delete the repo at the end logs the action instead of removing files

## Contributing / local development

```bash
git clone git@github.com:19tt94/workspace-setup.git
cd workspace-setup
npm install
npm run dry-run   # safe way to test prompt changes
```

The global `setup` bin is registered in `package.json` and points at `index.js`.

## Legacy scripts

The `shells/` directory contains older bash installers (`settings.sh`, `devtools.sh`, `apps.sh`). They are **not** called by `index.js`. Prefer `run.sh` / `run.ps1` and the Node installer.

## Limitations

- **Linux** is not supported yet (macOS and Windows only)
- **Windows apps** are out of scope; only devtools and config are supported there
- **WSL** is not a separate install target; run the Windows or Linux flow manually as needed
- Some menu items (e.g. macOS `react`) are placeholders without install logic
- Package installs may require admin rights or manual approval (especially winget on Windows)

## License

ISC — see [package.json](package.json).
