#!/usr/bin/env node

/**
 * Sync: bring seed changes merged into the repo since this machine last synced
 * onto the installed files, keeping local edits.
 *
 * Usage (from an up-to-date clone):
 *   node scripts/sync.js           # preview what would change, write nothing
 *   node scripts/sync.js --apply   # write clean merges and new files
 *   node scripts/sync.js --mark    # record HEAD as synced (after a first sync)
 *
 * The last synced commit is kept in ~/.config/workspace-setup/last-sync.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { targetsForSeed } = require('./seed-map');
const { mergeJson, ensureTomlKeys, parseTomlFragment } = require('./merge-config');
const { getDevtoolChoices } = require('./platform');

function installedSeedChanges(changedPaths, platform) {
    return changedPaths.flatMap((seedRel) => targetsForSeed(seedRel, platform));
}

// base: the seed at the last synced commit; local: the installed file;
// theirs: the seed now. null means the file does not exist on that side.
function mergeFile({ base, local, theirs }) {
    if (theirs === null) {
        return { status: 'removed', content: local };
    }
    if (local === null) {
        return { status: 'new', content: theirs };
    }
    // Seeds come from git as LF; on Windows the installed copy may be CRLF.
    // Merge on LF and hand the result back in the installed file's line endings.
    const crlf = local.includes('\r\n');
    const toLf = (text) => (text === null ? null : text.replace(/\r\n/g, '\n'));
    const restore = (text) => (crlf ? text.replace(/\n/g, '\r\n') : text);
    const result = mergeLf({ base: toLf(base), local: toLf(local), theirs: toLf(theirs) });
    return result.status === 'merged' ? { status: 'merged', content: restore(result.content) } : { status: result.status, content: local };
}

function mergeLf({ base, local, theirs }) {
    if (local === theirs) {
        return { status: 'unchanged', content: local };
    }
    if (base === null) {
        return { status: 'conflict', content: local };
    }

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-sync-'));
    try {
        const files = { local, base, theirs };
        for (const [name, text] of Object.entries(files)) {
            fs.writeFileSync(path.join(dir, name), text);
        }
        // git merge-file exits with the number of conflicts, or < 0 on error.
        const result = spawnSync('git', ['merge-file', '-p', 'local', 'base', 'theirs'], { cwd: dir, encoding: 'utf8' });
        if (result.status === 0) {
            return { status: 'merged', content: result.stdout };
        }
        return { status: 'conflict', content: local };
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function readFileSafe(filepath) {
    try {
        return fs.readFileSync(filepath, 'utf8');
    } catch (error) {
        return null;
    }
}

// Guard fragments are merged into files the user owns, the same way the
// installer does, so there is no base to compare against.
function mergeConfig(kind, local, fragmentText) {
    if (kind === 'json') {
        const current = JSON.parse(local || '{}');
        const merged = mergeJson(current, JSON.parse(fragmentText));
        return `${JSON.stringify(merged, null, 2)}\n`;
    }
    return ensureTomlKeys(local || '', parseTomlFragment(fragmentText)).text;
}

// Each change: { seed, target, base, theirs, root?, merge?, mode? }. Writes only files
// that merged cleanly or are new; conflicts, unreadable configs and removed seeds are reported.
function applyChanges(changes, { write = true } = {}) {
    return changes.map((change) => {
        const local = readFileSafe(change.target);
        // A missing file is only created inside an install this machine already
        // has (a new skill in an existing skills dir); otherwise it was opted out of.
        const installed = local !== null || Boolean(change.root && fs.existsSync(change.root));
        let result;
        if (!installed) {
            result = { status: 'not installed' };
        } else if (change.merge && change.theirs !== null) {
            try {
                const content = mergeConfig(change.merge, local, change.theirs);
                result = { status: content === local ? 'unchanged' : 'merged', content };
            } catch (error) {
                result = { status: 'unreadable' };
            }
        } else {
            result = mergeFile({ base: change.base, local, theirs: change.theirs });
        }
        if (write && (result.status === 'merged' || result.status === 'new')) {
            fs.mkdirSync(path.dirname(change.target), { recursive: true });
            fs.writeFileSync(change.target, result.content, change.mode ? { mode: change.mode } : undefined);
        }
        return { seed: change.seed, target: change.target, status: result.status };
    });
}

function git(repoRoot, ...args) {
    const result = spawnSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8' });
    return result.status === 0 ? result.stdout : null;
}

function splitLines(output) {
    return (output || '').split('\n').filter(Boolean);
}

// Tracked files only, so stray files in the clone (.DS_Store) are not seeds.
function trackedSeedFiles(repoRoot) {
    return splitLines(git(repoRoot, 'ls-files', '--', 'agents', 'tools')).sort();
}

// --no-renames lists a renamed seed as a delete plus an add, so the old
// installed copy is reported as removed instead of silently left behind.
function changedSeedPaths(repoRoot, from, to) {
    return splitLines(git(repoRoot, 'diff', '--name-only', '--no-renames', from, to));
}

function unifiedDiff(localPath, seedPath) {
    // git diff --no-index works on every platform git does; exit 1 means "differs".
    const result = spawnSync('git', ['diff', '--no-index', '--no-color', localPath, seedPath], { encoding: 'utf8' });
    return result.stdout;
}

// Diff against seed content (the committed blob the merge used), not a path in the clone.
function conflictDiff(localPath, seedContent) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-sync-'));
    try {
        const seedPath = path.join(dir, path.basename(localPath));
        fs.writeFileSync(seedPath, seedContent);
        return unifiedDiff(localPath, seedPath);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

// First sync on a machine: there is no base to merge against, so report every
// installed file that differs from the current seed and leave it to the user.
function listDrift({ repoRoot, platform }) {
    const drift = [];
    for (const target of installedSeedChanges(trackedSeedFiles(repoRoot), platform)) {
        const seedPath = path.join(repoRoot, ...target.seed.split('/'));
        const theirs = readFileSafe(seedPath);
        const local = readFileSafe(target.target);
        if (local === null) {
            // Agents this machine never installed are not drift.
            if (!target.root || fs.existsSync(target.root)) {
                drift.push({ ...target, status: 'missing' });
            }
            continue;
        }
        let expected;
        try {
            expected = target.merge ? mergeConfig(target.merge, local, theirs) : theirs;
        } catch (error) {
            drift.push({ ...target, status: 'unreadable' });
            continue;
        }
        if (expected !== local) {
            // A merged config never matches its fragment; the diff would be noise.
            const diff = target.merge ? null : unifiedDiff(target.target, seedPath);
            drift.push({ ...target, status: 'differs', diff });
        }
    }
    return drift;
}

// A removed seed is only reported (sync never deletes), so it does not hold
// the record back; a conflict or skipped file does, so the next sync retries it.
const SETTLED = ['merged', 'new', 'unchanged', 'removed', 'not installed'];

function nextLastSync(results, previous, head) {
    return results.every((result) => SETTLED.includes(result.status)) ? head : previous;
}

function newDevtools(previousChoices, currentChoices) {
    const known = new Set(previousChoices.map((choice) => choice.value));
    return currentChoices.filter((choice) => !known.has(choice.value));
}

const REPO_ROOT = path.resolve(__dirname, '..');

function lastSyncPath() {
    return path.join(os.homedir(), '.config', 'workspace-setup', 'last-sync');
}

function gitShow(commit, seedRel) {
    return git(REPO_ROOT, 'show', `${commit}:${seedRel}`);
}

// The old devtool list comes from platform.js as it was at the last sync.
function devtoolsAt(commit, platform) {
    const source = gitShow(commit, 'scripts/platform.js');
    if (source === null) {
        return null;
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-sync-'));
    try {
        const file = path.join(dir, 'platform.js');
        fs.writeFileSync(file, source);
        return require(file).getDevtoolChoices(platform);
    } catch (error) {
        return null;
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function writeLastSync(commit) {
    fs.mkdirSync(path.dirname(lastSyncPath()), { recursive: true });
    fs.writeFileSync(lastSyncPath(), `${commit}\n`);
}

function printDrift(drift) {
    if (drift.length === 0) {
        console.log('Every installed file matches the repo.');
        return;
    }
    for (const item of drift) {
        console.log(`  ${item.status.toUpperCase().padEnd(8)} ${item.target}  (${item.seed})`);
        if (item.diff) {
            console.log(item.diff.trimEnd().split('\n').map((line) => `    ${line}`).join('\n'));
        }
    }
}

function main() {
    const apply = process.argv.includes('--apply');
    const mark = process.argv.includes('--mark');
    const platform = process.platform === 'win32' ? 'win32' : 'darwin';
    const head = (git(REPO_ROOT, 'rev-parse', 'HEAD') || '').trim();
    if (!head) {
        console.error(`Not a git checkout: ${REPO_ROOT}`);
        process.exit(1);
    }
    const last = (readFileSafe(lastSyncPath()) || '').trim();

    if (mark) {
        writeLastSync(head);
        console.log(`Recorded ${head.slice(0, 7)} as this machine's last sync.`);
        return;
    }

    if (!last) {
        console.log('No last sync recorded, so there is nothing to merge against.');
        console.log('Installed files that differ from the repo (nothing was written):\n');
        printDrift(listDrift({ repoRoot: REPO_ROOT, platform }));
        console.log('\nOnce these are reconciled, run with --mark to record this commit.');
        return;
    }
    if (last === head) {
        console.log(`Up to date with ${head.slice(0, 7)}.`);
        return;
    }
    if (git(REPO_ROOT, 'cat-file', '-e', `${last}^{commit}`) === null) {
        console.error(`Last sync ${last.slice(0, 7)} is not a commit in this clone (${lastSyncPath()}).`);
        console.error('If the clone is shallow, run git fetch --unshallow and retry. Otherwise run with --mark to start over from the current commit.');
        process.exit(1);
    }

    const changedPaths = changedSeedPaths(REPO_ROOT, last, head);
    const changes = installedSeedChanges(changedPaths, platform).map((change) => ({
        ...change,
        base: gitShow(last, change.seed),
        theirs: gitShow(head, change.seed),
        mode: fs.existsSync(path.join(REPO_ROOT, change.seed)) ? fs.statSync(path.join(REPO_ROOT, change.seed)).mode : undefined
    }));
    const results = applyChanges(changes, { write: apply });

    console.log(`Changes since ${last.slice(0, 7)} -> ${head.slice(0, 7)}${apply ? '' : ' (preview, nothing written)'}:\n`);
    if (results.length === 0) {
        console.log('  No installed files changed.');
    }
    const notInstalled = results.filter((result) => result.status === 'not installed').length;
    for (const result of results.filter((r) => r.status !== 'not installed')) {
        console.log(`  ${result.status.toUpperCase().padEnd(13)} ${result.target}  (${result.seed})`);
        if (result.status === 'conflict') {
            const theirs = changes.find((change) => change.target === result.target && change.seed === result.seed).theirs;
            console.log(conflictDiff(result.target, theirs).trimEnd().split('\n').map((line) => `    ${line}`).join('\n'));
        }
    }

    if (notInstalled > 0) {
        console.log(`  (${notInstalled} changed file(s) belong to things this machine never installed; left alone)`);
    }

    const previousTools = devtoolsAt(last, platform);
    if (previousTools) {
        const added = newDevtools(previousTools, getDevtoolChoices(platform));
        if (added.length > 0) {
            console.log(`\nNew devtools since the last sync (not installed): ${added.map((choice) => choice.value).join(', ')}`);
        }
    }

    if (apply) {
        const next = nextLastSync(results, last, head);
        if (next === head) {
            writeLastSync(head);
            console.log(`\nRecorded ${head.slice(0, 7)} as this machine's last sync.`);
        } else {
            console.log('\nSome files were not applied; the last sync stays put so the next sync retries them.');
        }
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    installedSeedChanges,
    mergeFile,
    applyChanges,
    listDrift,
    nextLastSync,
    newDevtools,
    changedSeedPaths,
    conflictDiff
};
