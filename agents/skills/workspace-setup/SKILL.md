---
name: workspace-setup
description: Keep this machine in step with the workspace-setup repo. Use when the user wants to share a config change they made locally (a shell function, alias, dotfile tweak, agent rule or skill) as a pull request, sync this machine with changes merged since it was last synced, notice a tool or config from another machine is missing here, or rerun part of the installer.
---

# Workspace Setup

This machine was set up from `19tt94/workspace-setup`. The repo's `agents/` and `tools/` seeds are what every machine installs; this skill moves changes between them and this machine in both directions.

## The clone

Both modes work from one clone at `~/.config/workspace-setup/repo`.

1. Check GitHub access: `gh auth status`, then `gh repo view 19tt94/workspace-setup`. If either fails, stop and tell the user. On a work machine, `gh` must be signed in to an account that can push to this repo.
2. If the clone is missing, run `gh repo clone 19tt94/workspace-setup ~/.config/workspace-setup/repo`, then `npm install` inside it. Use a full clone, not a shallow one: sync needs history back to this machine's last sync.
3. Otherwise run `git -C ~/.config/workspace-setup/repo pull --ff-only` on its default branch. If it has local changes or isn't on the default branch, ask before touching it.

## Share a change

Use when the user changed something on this machine (for example "I added lfcd, open a PR") and wants every machine to get it.

1. Ask what changed if it isn't clear, and read the installed file to find it.
2. Prepare the clone (above), then make a branch.
3. Find the seed for each installed file in `scripts/seed-map.js` (for example `~/.zshrc` -> `tools/zshrc`).
4. Copy over **only the change**, never the whole installed file. Installed files carry machine-local settings (work paths, tokens, personal aliases) that must stay out of the repo. If a hunk looks machine-specific, ask.
5. Add whatever else the change needs so a fresh machine gets a working result:
   - the matching Windows seed for parity (`tools/powershell-profile.ps1` alongside `tools/zshrc`) when the change applies there, or say why not;
   - a new tool in both `scripts/installers/brew.js` and `scripts/installers/winget.js`, and in `getDevtoolChoices` in `scripts/platform.js`;
   - a line in `tools/hints.md` for anything the user will want a reminder of;
   - the README and `AGENTS.md` tables when a seed or tool is added.
6. Hand off to the `pr-prepare` skill to run the checks and open the PR. Don't commit or push outside it.

## Sync this machine

Use when the user asks to sync, or something from another machine is missing here (a function, alias, rule or tool that "should" exist).

1. Prepare the clone (above).
2. Preview: `npm run sync` in the clone. It writes nothing and lists, for every installed file whose seed changed since the last sync:
   - `MERGED`: the repo change merged cleanly with any local edits;
   - `NEW`: a new file inside an install this machine already has;
   - `CONFLICT`: a local edit overlaps the repo change (the diff is shown);
   - `NOT INSTALLED`: this machine never installed it, so it stays that way;
   - `UNREADABLE`: a settings file isn't valid JSON or TOML, so the guard entries couldn't be merged (fix the file, then sync again);
   - `REMOVED`: the seed was deleted; the installed file is left in place.
   It also lists devtools added since the last sync.
3. Show the user the preview. On their go-ahead, run `npm run sync -- --apply`.
4. Resolve each conflict with the user, editing the installed file by hand, then run the preview again. The last-sync record only advances once nothing is left unapplied, so the next sync retries anything that was skipped.
5. Offer to install each new devtool (for example `brew install lf`, or `winget install` on Windows). Never install without asking.
6. If the user changed a file during the conflict step in a way every machine should get, offer **Share a change**.

**First sync on a machine** (no record yet): the preview lists every installed file that differs from the repo, with diffs, and writes nothing. Go through them with the user: bring the repo version in, keep the local one, or share the local edit. When they're settled, run `npm run sync -- --mark` to record the current commit.

## Rerun part of the installer

From the clone: `npm start` for the full menu, `node ./index.js --devtools` for devtools only. `npm run dry-run` walks every prompt without changing anything.

To set up a **new** machine, this skill isn't installed there yet: clone the repo and run `./run.sh`.
