#!/usr/bin/env node

/**
 * Audit: diff the seed templates in agents/ and tools/ against the files
 * installed in the home directory. Reports which installed files have drifted
 * so a human (or the audit-local-config skill) can decide what belongs back
 * in the repo.
 *
 * Usage:
 *   node scripts/audit-seeds.js            # full report
 *   node scripts/audit-seeds.js --full     # include full unified diffs
 *
 * Source of truth for the seed -> home mapping.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { isWindows, getPowerShellProfilePath } = require('./platform');

const REPO_ROOT = path.resolve(__dirname, '..');
const FULL_DIFFS = process.argv.includes('--full');
const DIFF_TRUNCATE = 40;

function homePath(...segments) {
    return path.join(os.homedir(), ...segments);
}

function normalize(filepath) {
    return path.normalize(filepath);
}

function resolveSeed(...segments) {
    return path.join(REPO_ROOT, ...segments);
}

function readFileSafe(filepath) {
    try {
        return fs.readFileSync(filepath, 'utf8');
    } catch (error) {
        return null;
    }
}

function walkFiles(dir, skipTopDirs) {
    const results = [];
    if (!fs.existsSync(dir)) {
        return results;
    }
    function walk(current, prefix) {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            if (!prefix && Array.isArray(skipTopDirs) && skipTopDirs.includes(entry.name)) {
                continue;
            }
            const rel = prefix ? path.join(prefix, entry.name) : entry.name;
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                walk(full, rel);
            } else if (entry.isFile()) {
                results.push(rel);
            }
        }
    }
    walk(dir, '');
    return results.sort();
}

function unifiedDiff(seedPath, targetPath) {
    try {
        const out = execSync(`diff -u "${seedPath}" "${targetPath}"`, { encoding: 'utf8' });
        return out;
    } catch (error) {
        return error.stdout || '(no diff output)';
    }
}

function truncateDiff(diff) {
    const lines = diff.split('\n');
    if (lines.length <= DIFF_TRUNCATE) {
        return diff;
    }
    return `${lines.slice(0, DIFF_TRUNCATE).join('\n')}\n... (${lines.length - DIFF_TRUNCATE} more lines)`;
}

function printDiff(seedPath, targetPath) {
    const diff = unifiedDiff(seedPath, targetPath);
    console.log('    ---');
    console.log(truncateDiff(diff)
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n'));
    if (!FULL_DIFFS) {
        console.log('    (run with --full for the complete diff)');
    }
    console.log('    ---');
}

function compareFile(seedPath, targetPath) {
    const exists = fs.existsSync(targetPath);
    if (!exists) {
        return {
            status: 'NOT IDENTICAL - NOT INSTALLED',
            short: 'seed present, target missing'
        };
    }
    const seedContent = readFileSafe(seedPath);
    const targetContent = readFileSafe(targetPath);
    if (seedContent === targetContent) {
        return { status: 'identical', short: 'match' };
    }
    return {
        status: 'DIFFERS - LOCAL DRIFT',
        short: 'content differs'
    };
}

function auditConfigEntry(entry) {
    const seedPath = resolveSeed(entry.seed);
    const targetPath = normalize(entry.target());
    const label = entry.label;

    if (!fs.existsSync(seedPath)) {
        console.log(`  [WARN] seed missing at ${seedPath}`);
        return { count: 0, statusCounts: {} };
    }

    const result = compareFile(seedPath, targetPath);
    const count = { identical: 0, differs: 0, missing: 0 };

    switch (result.status) {
        case 'identical':
            count.identical = 1;
            console.log(`  ${label.padEnd(28)} IDENTICAL   -> ${targetPath}`);
            break;
        case 'DIFFERS - LOCAL DRIFT':
            count.differs = 1;
            console.log(`  ${label.padEnd(28)} DIFFERS     -> ${targetPath}`);
            printDiff(seedPath, targetPath);
            break;
        default:
            count.missing = 1;
            console.log(`  ${label.padEnd(28)} NOT INSTALLED -> ${targetPath}`);
            break;
    }

    return { count, statusCounts: count };
}

function auditDirEntry(entry) {
    const seedDir = resolveSeed(entry.seed);
    const targetDir = normalize(entry.target());

    if (!fs.existsSync(seedDir)) {
        console.log(`  [WARN] seed directory missing at ${seedDir}`);
        return { count: { identical: 0, differs: 0, missing: 0 } };
    }

    const seedFiles = walkFiles(seedDir);
    const targetFiles = walkFiles(targetDir, entry.ignoreTargetTopDirs);
    const allFiles = [...new Set([...seedFiles, ...targetFiles])];

    const count = { identical: 0, differs: 0, missing: 0 };
    let localOnly = 0;

    for (const rel of allFiles) {
        const seedPath = path.join(seedDir, rel);
        const targetPath = path.join(targetDir, rel);
        const seedExists = fs.existsSync(seedPath);
        const targetExists = fs.existsSync(targetPath);
        const displayPath = path.join(entry.label, rel);

        if (!seedExists && targetExists) {
            localOnly++;
            console.log(`  ${displayPath.padEnd(36)} LOCAL ONLY  (no repo seed)`);
            continue;
        }
        if (seedExists && !targetExists) {
            count.missing++;
            console.log(`  ${displayPath.padEnd(36)} NOT INSTALLED`);
            continue;
        }

        const seedContent = readFileSafe(seedPath);
        const targetContent = readFileSafe(targetPath);
        if (seedContent === targetContent) {
            count.identical++;
            console.log(`  ${displayPath.padEnd(36)} identical`);
        } else {
            count.differs++;
            console.log(`  ${displayPath.padEnd(36)} DIFFERS`);
            printDiff(seedPath, targetPath);
        }
    }

    if (seedFiles.length === 0) {
        count.missing++;
    }

    return { count, localOnly };
}

function summarize(section, counts) {
    if (!counts) {
        return;
    }
    const total = counts.identical + counts.differs + counts.missing;
    if (total === 0 && counts.localOnly === undefined) {
        return;
    }
    const bits = [
        `${counts.identical} identical`,
        `${counts.differs} differ`,
        `${counts.missing} not installed`
    ];
    if (counts.localOnly) {
        bits.push(`${counts.localOnly} local-only`);
    }
    console.log(`  (${section}: ${bits.join(', ')})\n`);
}

function audit() {
    const configSeeds = [
        { label: '.zshrc', seed: 'tools/zshrc', target: () => homePath('.zshrc'), platforms: ['darwin'] },
        { label: '.bash_profile', seed: 'tools/bash_profile', target: () => homePath('.bash_profile'), platforms: ['darwin'] },
        { label: 'powershell profile', seed: 'tools/powershell-profile.ps1', target: () => getPowerShellProfilePath(), platforms: ['win32'] },
        { label: 'starship.toml', seed: 'tools/starship.toml', target: () => homePath('.config', 'starship.toml'), platforms: ['darwin', 'win32'] },
        { label: '.tmux.conf', seed: 'tools/tmux.conf', target: () => homePath('.tmux.conf'), platforms: ['darwin'] },
        { label: 'wezterm.lua', seed: 'tools/wezterm.lua', target: () => homePath('.config', 'wezterm', 'wezterm.lua'), platforms: ['darwin', 'win32'] },
        { label: '.vimrc', seed: 'tools/vimrc', target: () => homePath('.vimrc'), platforms: ['darwin', 'win32'] },
        { label: 'nvim init.lua', seed: 'tools/nvim/init.lua', target: () => isWindows ? path.join(process.env.LOCALAPPDATA || homePath('AppData', 'Local'), 'nvim', 'init.lua') : homePath('.config', 'nvim', 'init.lua'), platforms: ['darwin', 'win32'] },
        { label: 'lfrc', seed: 'tools/lfrc', target: () => homePath('.config', 'lf', 'lfrc'), platforms: ['darwin'] }
    ];

    const agentSeeds = [
        { label: 'Cursor rules', seed: 'agents/cursor/rules', target: () => homePath('.cursor', 'rules'), dir: true },
        { label: 'cursor README', seed: 'agents/cursor/README.md', target: () => homePath('.cursor', 'rules', 'README.md') },
        { label: 'codex AGENTS.md', seed: 'agents/codex/AGENTS.md', target: () => homePath('.codex', 'AGENTS.md') },
        { label: 'codex skills', seed: 'agents/codex/skills', target: () => homePath('.codex', 'skills'), dir: true, ignoreTargetTopDirs: ['.system'] },
        { label: 'claude CLAUDE.md', seed: 'agents/claude/CLAUDE.md', target: () => homePath('.claude', 'CLAUDE.md') }
    ];

    const platform = isWindows ? 'win32' : 'darwin';

    console.log('Workspace Setup seed audit');
    console.log(`Platform: ${platform}`);
    console.log(`Repo: ${REPO_ROOT}`);
    console.log('');

    console.log('=== Configuration files (tools/) ===');
    const configCounts = { identical: 0, differs: 0, missing: 0, localOnly: 0 };
    for (const entry of configSeeds) {
        if (!entry.platforms.includes(platform)) {
            continue;
        }
        const result = auditConfigEntry(entry);
        configCounts.identical += result.count.identical;
        configCounts.differs += result.count.differs;
        configCounts.missing += result.count.missing;
    }
    summarize('config', configCounts);

    console.log('=== AI agent starter files (agents/) ===');
    const agentCounts = { identical: 0, differs: 0, missing: 0, localOnly: 0 };
    for (const entry of agentSeeds) {
        let result;
        if (entry.dir) {
            result = auditDirEntry(entry);
            agentCounts.localOnly += result.localOnly || 0;
        } else {
            result = auditConfigEntry(entry);
        }
        agentCounts.identical += result.count.identical;
        agentCounts.differs += result.count.differs;
        agentCounts.missing += result.count.missing;
    }
    summarize('agents', agentCounts);

    console.log('Notes:');
    console.log('  ~/.gitignore is generated (not a repo seed). ~/.nvm and ~/.zsh/');
    console.log('  git completions are created/downloaded, so they are not audited.');
    console.log('  ~/.codex/skills/.system/ holds Codex built-in skills and is skipped.');
    console.log('  LOCAL ONLY files usually belong to a single machine - do not copy');
    console.log('  them into agents/ or tools/ without reviewing them first.');
    console.log('');
}

audit();