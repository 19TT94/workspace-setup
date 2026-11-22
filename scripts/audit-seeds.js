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
 *   node scripts/audit-seeds.js --quiet    # hide identical files, show drift only
 *   node scripts/audit-seeds.js --agents   # only agents/ seeds (or --tools for tools/)
 *
 * The seed -> home mapping lives in scripts/seed-map.js.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { mergeJson, ensureTomlKeys, parseTomlFragment } = require('./merge-config');
const { isWindows } = require('./platform');
const { getConfigSeeds, getAgentSeeds } = require('./seed-map');

const REPO_ROOT = path.resolve(__dirname, '..');
const FULL_DIFFS = process.argv.includes('--full');
const QUIET = process.argv.includes('--quiet');
const ONLY_AGENTS = process.argv.includes('--agents');
const ONLY_TOOLS = process.argv.includes('--tools');
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
            if (!QUIET) {
                console.log(`  ${label.padEnd(28)} IDENTICAL   -> ${targetPath}`);
            }
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

// Guard fragments are merged into files the user owns, so "identical" means
// every seeded entry is already present (merging again would change nothing).
function auditMergeEntry(entry) {
    const targetPath = normalize(entry.target());
    const count = { identical: 0, differs: 0, missing: 0 };
    if (!fs.existsSync(targetPath)) {
        count.missing = 1;
        console.log(`  ${entry.label.padEnd(28)} NOT INSTALLED -> ${targetPath}`);
        return { count };
    }
    const current = readFileSafe(targetPath);
    let complete;
    try {
        if (entry.merge === 'json') {
            const parsed = JSON.parse(current || '{}');
            complete = entry.seeds.every((seed) => {
                const fragment = JSON.parse(readFileSafe(resolveSeed(seed)));
                return JSON.stringify(mergeJson(parsed, fragment)) === JSON.stringify(parsed);
            });
        } else {
            const result = ensureTomlKeys(current, parseTomlFragment(readFileSafe(resolveSeed(entry.seeds[0]))));
            complete = result.text === current && result.warnings.length === 0;
        }
    } catch (error) {
        complete = false;
    }
    if (complete) {
        count.identical = 1;
        if (!QUIET) {
            console.log(`  ${entry.label.padEnd(28)} INCLUDES GUARD -> ${targetPath}`);
        }
    } else {
        count.differs = 1;
        console.log(`  ${entry.label.padEnd(28)} MISSING GUARD ENTRIES -> ${targetPath}`);
    }
    return { count };
}

// An agent's skills dir is seeded by more than one repo dir (agents/skills/ plus
// its own agents/<agent>/skills/), and the agent-specific one wins on conflict,
// matching the installer's copy order. Later seeds overwrite earlier ones in the
// seedPath map, so a relative path resolves to the seed that actually wins.
function collectSeedFiles(seedDirs, skipSeedTopDirs) {
    const seedPathByRel = new Map();

    for (const seedDir of seedDirs) {
        for (const rel of walkFiles(seedDir, skipSeedTopDirs)) {
            seedPathByRel.set(rel, path.join(seedDir, rel));
        }
    }

    return seedPathByRel;
}

function auditDirEntry(entry) {
    const seedDirs = (entry.seeds || [entry.seed]).map((seed) => resolveSeed(seed));
    const targetDir = normalize(entry.target());

    const existingSeeds = seedDirs.filter((dir) => fs.existsSync(dir));
    if (existingSeeds.length === 0) {
        console.log(`  [WARN] seed directory missing at ${seedDirs.join(', ')}`);
        return { count: { identical: 0, differs: 0, missing: 0 } };
    }

    const seedPathByRel = collectSeedFiles(existingSeeds, entry.skipSeedTopDirs);
    const targetFiles = walkFiles(targetDir, entry.ignoreTargetTopDirs);
    const allFiles = [...new Set([...seedPathByRel.keys(), ...targetFiles])];

    const count = { identical: 0, differs: 0, missing: 0 };
    let localOnly = 0;

    for (const rel of allFiles) {
        const seedPath = seedPathByRel.get(rel);
        const targetPath = path.join(targetDir, rel);
        const seedExists = Boolean(seedPath);
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
            if (!QUIET) {
                console.log(`  ${displayPath.padEnd(36)} identical`);
            }
        } else {
            count.differs++;
            console.log(`  ${displayPath.padEnd(36)} DIFFERS`);
            printDiff(seedPath, targetPath);
        }
    }

    if (seedPathByRel.size === 0) {
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

function auditConfigSection(configSeeds, platform) {
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
}

function auditAgentSection(agentSeeds) {
    console.log('=== AI agent starter files (agents/) ===');
    const agentCounts = { identical: 0, differs: 0, missing: 0, localOnly: 0 };
    for (const entry of agentSeeds) {
        if (entry.platforms && !entry.platforms.includes(isWindows ? 'win32' : 'darwin')) {
            continue;
        }
        let result;
        if (entry.merge) {
            result = auditMergeEntry(entry);
        } else if (entry.dir) {
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
}

function audit() {
    const configSeeds = getConfigSeeds();
    const agentSeeds = getAgentSeeds();

    const platform = isWindows ? 'win32' : 'darwin';

    console.log('Workspace Setup seed audit');
    console.log(`Platform: ${platform}`);
    console.log(`Repo: ${REPO_ROOT}`);
    console.log('');

    if (!ONLY_AGENTS) {
        auditConfigSection(configSeeds, platform);
    }
    if (!ONLY_TOOLS) {
        auditAgentSection(agentSeeds);
    }

    console.log('Notes:');
    console.log('  ~/.gitignore is generated (not a repo seed). ~/.nvm and ~/.zsh/');
    console.log('  git completions are created/downloaded, so they are not audited.');
    console.log('  ~/.codex/skills/.system/ holds Codex built-in skills and is skipped.');
    console.log('  ~/.claude/skills/synced/ holds skills synced from claude.ai and is skipped.');
    console.log('  The shared code-review skill is not installed for Claude, which has its own.');
    console.log('  Each agent skills dir is seeded by agents/skills/ + its own');
    console.log('  agents/<agent>/skills/; the agent-specific seed wins on conflict.');
    console.log('  LOCAL ONLY files usually belong to a single machine - do not copy');
    console.log('  them into agents/ or tools/ without reviewing them first.');
    console.log('');
}

audit();
