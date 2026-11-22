/**
 * Source of truth for the seed -> home mapping, shared by the audit
 * (scripts/audit-seeds.js) and sync (scripts/sync.js).
 */

const os = require('os');
const path = require('path');
const { isWindows, getPowerShellProfilePath, getVSCodeSettingsPath, getCursorSettingsPath, getAgentTemplatesPath } = require('./platform');

function homePath(...segments) {
    return path.join(os.homedir(), ...segments);
}

function getConfigSeeds() {
    return [
        { label: '.zshrc', seed: 'tools/zshrc', target: () => homePath('.zshrc'), platforms: ['darwin'] },
        { label: '.bash_profile', seed: 'tools/bash_profile', target: () => homePath('.bash_profile'), platforms: ['darwin'] },
        { label: 'powershell profile', seed: 'tools/powershell-profile.ps1', target: () => getPowerShellProfilePath(), platforms: ['win32'] },
        { label: 'starship.toml', seed: 'tools/starship.toml', target: () => homePath('.config', 'starship.toml'), platforms: ['darwin', 'win32'] },
        { label: '.tmux.conf', seed: 'tools/tmux.conf', target: () => homePath('.tmux.conf'), platforms: ['darwin'] },
        { label: 'wezterm.lua', seed: 'tools/wezterm.lua', target: () => homePath('.config', 'wezterm', 'wezterm.lua'), platforms: ['darwin', 'win32'] },
        { label: '.vimrc', seed: 'tools/vimrc', target: () => homePath('.vimrc'), platforms: ['darwin', 'win32'] },
        { label: 'nvim init.lua', seed: 'tools/nvim/init.lua', target: () => isWindows ? path.join(process.env.LOCALAPPDATA || homePath('AppData', 'Local'), 'nvim', 'init.lua') : homePath('.config', 'nvim', 'init.lua'), platforms: ['darwin', 'win32'] },
        { label: 'lfrc', seed: 'tools/lfrc', target: () => homePath('.config', 'lf', 'lfrc'), platforms: ['darwin'] },
        { label: 'hints', seed: 'tools/hints.md', target: () => homePath('.config', 'shell', 'hints.md'), platforms: ['darwin', 'win32'] },
        { label: 'pstash', seed: 'tools/pstash', target: () => homePath('.local', 'bin', 'pstash'), platforms: ['darwin'] },
        { label: 'vscode settings', seed: 'tools/vscode-settings.json', target: () => getVSCodeSettingsPath(), platforms: ['darwin', 'win32'] },
        { label: 'cursor settings', seed: 'tools/cursor-settings.json', target: () => getCursorSettingsPath(), platforms: ['darwin', 'win32'] }
    ];
}

// seeds: shared first, agent-specific second - later entries win, matching
// the installer's copy order in scripts/install.js.
function getAgentSeeds() {
    return [
        // README.md in ~/.cursor/rules/ is seeded by the 'cursor README' entry below.
        { label: 'Cursor rules', seed: 'agents/cursor/rules', target: () => homePath('.cursor', 'rules'), dir: true, ignoreTargetTopDirs: ['README.md'] },
        { label: 'cursor README', seed: 'agents/cursor/README.md', target: () => homePath('.cursor', 'rules', 'README.md'), root: () => homePath('.cursor') },
        { label: 'cursor skills', seeds: ['agents/skills', 'agents/cursor/skills'], target: () => homePath('.cursor', 'skills'), dir: true },
        { label: 'codex AGENTS.md', seed: 'agents/codex/AGENTS.md', target: () => homePath('.codex', 'AGENTS.md'), root: () => homePath('.codex') },
        { label: 'codex skills', seeds: ['agents/skills', 'agents/codex/skills'], target: () => homePath('.codex', 'skills'), dir: true, ignoreTargetTopDirs: ['.system'] },
        { label: 'claude CLAUDE.md', seed: 'agents/claude/CLAUDE.md', target: () => homePath('.claude', 'CLAUDE.md'), root: () => homePath('.claude') },
        { label: 'claude skills', seeds: ['agents/skills', 'agents/claude/skills'], target: () => homePath('.claude', 'skills'), dir: true, ignoreTargetTopDirs: ['synced'], skipSeedTopDirs: ['code-review'] },
        { label: 'agent templates', seed: 'agents/templates', target: () => getAgentTemplatesPath(), dir: true },
        { label: 'claude guard settings', merge: 'json', seeds: isWindows ? ['agents/claude/settings.json'] : ['agents/claude/settings.json', 'agents/claude/settings.hooks.json'], target: () => homePath('.claude', 'settings.json'), root: () => homePath('.claude') },
        { label: 'claude guard hook', seed: 'agents/claude/hooks/guard.py', target: () => homePath('.claude', 'hooks', 'guard.py'), root: () => homePath('.claude'), platforms: ['darwin'] },
        { label: 'codex guard rules', seed: 'agents/codex/rules/guard.rules', target: () => homePath('.codex', 'rules', 'guard.rules'), root: () => homePath('.codex') },
        { label: 'codex approval settings', merge: 'toml', seeds: ['agents/codex/config.toml'], target: () => homePath('.codex', 'config.toml'), root: () => homePath('.codex') },
        { label: 'cursor CLI guard', merge: 'json', seeds: ['agents/cursor/cli-config.json'], target: () => homePath('.cursor', 'cli-config.json'), root: () => homePath('.cursor') }
    ];
}

function entrySeeds(entry) {
    return entry.seeds || [entry.seed];
}

// Every installed location of one repo-relative seed file (forward slashes,
// as git prints them). Merge entries come back with `merge` set: their target
// is a user-owned file the seed is merged into, not a copy of it. `root` is the
// directory whose presence means this machine has that install at all.
function targetsForSeed(seedRel, platform) {
    const rel = seedRel.split(path.sep).join('/');
    const targets = [];
    for (const entry of [...getConfigSeeds(), ...getAgentSeeds()]) {
        if (entry.platforms && !entry.platforms.includes(platform)) {
            continue;
        }
        for (const seed of entrySeeds(entry)) {
            if (!entry.dir) {
                if (seed === rel) {
                    targets.push({ label: entry.label, seed: rel, target: entry.target(), merge: entry.merge, root: entry.root && entry.root() });
                }
                continue;
            }
            if (!rel.startsWith(`${seed}/`)) {
                continue;
            }
            const inner = rel.slice(seed.length + 1);
            const topDir = inner.split('/')[0];
            if ((entry.skipSeedTopDirs || []).includes(topDir)) {
                continue;
            }
            targets.push({ label: entry.label, seed: rel, target: path.join(entry.target(), ...inner.split('/')), root: entry.target() });
        }
    }
    return targets;
}

module.exports = {
    getConfigSeeds,
    getAgentSeeds,
    targetsForSeed
};
