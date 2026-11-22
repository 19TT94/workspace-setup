// Tests for scripts/seed-map.js and scripts/sync.js: bringing merged repo
// changes onto an already set-up machine. Run: node --test tests/

const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { targetsForSeed } = require('../scripts/seed-map');
const { installedSeedChanges, mergeFile, applyChanges, listDrift, nextLastSync, newDevtools, changedSeedPaths, conflictDiff } = require('../scripts/sync');
const { getDevtoolChoices } = require('../scripts/platform');

const home = (...segments) => path.join(os.homedir(), ...segments);

const git = (cwd, ...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd, encoding: 'utf8' }).stdout.trim();

function useFakeHome(t) {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-home-'));
    const realHome = process.env.HOME;
    process.env.HOME = fakeHome;
    t.after(() => {
        process.env.HOME = realHome;
        fs.rmSync(fakeHome, { recursive: true, force: true });
    });
    return fakeHome;
}

// A throwaway repo with the given files committed; untracked files are added after.
function makeRepo(t, files, untracked = {}) {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-repo-'));
    t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
    const write = (entries) => {
        for (const [rel, text] of Object.entries(entries)) {
            fs.mkdirSync(path.dirname(path.join(repoRoot, rel)), { recursive: true });
            fs.writeFileSync(path.join(repoRoot, rel), text);
        }
    };
    git(repoRoot, 'init', '-q');
    write(files);
    git(repoRoot, 'add', '-A');
    git(repoRoot, 'commit', '-qm', 'seed');
    write(untracked);
    return repoRoot;
}

// 1. A changed seed path resolves to where it is installed.
test('maps a tools seed to its home file', () => {
    assert.deepStrictEqual(targetsForSeed('tools/zshrc', 'darwin').map((t) => t.target), [home('.zshrc')]);
});

test('maps a shared skill into every agent skills dir', () => {
    const targets = targetsForSeed('agents/skills/grill/SKILL.md', 'darwin').map((t) => t.target);
    assert.deepStrictEqual(targets.sort(), [
        home('.claude', 'skills', 'grill', 'SKILL.md'),
        home('.codex', 'skills', 'grill', 'SKILL.md'),
        home('.cursor', 'skills', 'grill', 'SKILL.md')
    ].sort());
});

test('does not map the shared code-review skill for Claude', () => {
    const targets = targetsForSeed('agents/skills/code-review/SKILL.md', 'darwin').map((t) => t.target);
    assert.ok(!targets.some((target) => target.startsWith(home('.claude'))));
    assert.strictEqual(targets.length, 2);
});

test('maps a macOS-only seed nowhere on Windows', () => {
    assert.deepStrictEqual(targetsForSeed('tools/zshrc', 'win32'), []);
});

// 2. Only changed files that get installed somewhere are synced.
test('keeps changed seeds and drops installer code, docs, and tests', () => {
    const changes = installedSeedChanges(['tools/zshrc', 'index.js', 'README.md', 'tests/sync.test.js', 'scripts/install.js'], 'darwin');
    assert.deepStrictEqual(changes.map((c) => c.seed), ['tools/zshrc']);
    assert.strictEqual(changes[0].target, home('.zshrc'));
});

test('expands one shared skill change to each agent that installs it', () => {
    const changes = installedSeedChanges(['agents/skills/grill/SKILL.md'], 'darwin');
    assert.strictEqual(changes.length, 3);
});

const baseZshrc = [
    'export EDITOR=nvim',
    '',
    'alias ll="ls -la"',
    'alias gs="git status"',
    '',
    'eval "$(starship init zsh)"',
    ''
].join('\n');

// 3. A local-only edit and a repo change elsewhere in the file both survive.
test('three-way merge keeps a local alias and the new lfcd function', () => {
    const local = baseZshrc.replace('export EDITOR=nvim', 'export EDITOR=nvim\nalias work="cd ~/work"');
    const theirs = baseZshrc.replace('eval "$(starship init zsh)"', 'eval "$(starship init zsh)"\n\nlfcd() { cd "$(command lf -print-last-dir "$@")"; }');
    const result = mergeFile({ base: baseZshrc, local, theirs });
    assert.strictEqual(result.status, 'merged');
    assert.ok(result.content.includes('alias work="cd ~/work"'));
    assert.ok(result.content.includes('lfcd()'));
});

// 4. Overlapping edits are reported as a conflict and the installed file is left alone.
test('a conflicting file is reported and left untouched', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-test-'));
    const target = path.join(dir, '.zshrc');
    const local = baseZshrc.replace('export EDITOR=nvim', 'export EDITOR=code');
    fs.writeFileSync(target, local);
    const theirs = baseZshrc.replace('export EDITOR=nvim', 'export EDITOR=vim');

    const [result] = applyChanges([{ seed: 'tools/zshrc', target, base: baseZshrc, theirs }]);

    assert.strictEqual(result.status, 'conflict');
    assert.strictEqual(fs.readFileSync(target, 'utf8'), local);
    fs.rmSync(dir, { recursive: true, force: true });
});

// 5. With no last-sync record, sync lists what differs and writes nothing.
test('without a last sync, lists differing files with diffs and writes nothing', (t) => {
    const fakeHome = useFakeHome(t);
    const repoRoot = makeRepo(t, {
        'tools/zshrc': baseZshrc,
        'tools/vimrc': 'set number\n',
        'tools/tmux.conf': 'set -g mouse on\n'
    });
    const localZshrc = baseZshrc.replace('export EDITOR=nvim', 'export EDITOR=code');
    fs.writeFileSync(path.join(fakeHome, '.zshrc'), localZshrc);
    fs.writeFileSync(path.join(fakeHome, '.vimrc'), 'set number\n');

    const drift = listDrift({ repoRoot, platform: 'darwin' });

    assert.deepStrictEqual(drift.map((d) => [d.seed, d.status]), [
        ['tools/tmux.conf', 'missing'],
        ['tools/zshrc', 'differs']
    ]);
    assert.ok(drift[1].diff.includes('export EDITOR=code'));
    assert.strictEqual(fs.readFileSync(path.join(fakeHome, '.zshrc'), 'utf8'), localZshrc);
    assert.ok(!fs.existsSync(path.join(fakeHome, '.tmux.conf')));
});

// 6. The last-sync record only advances when every change was applied.
test('advances the last sync when every change applied', () => {
    const results = [{ status: 'merged' }, { status: 'new' }, { status: 'unchanged' }];
    assert.strictEqual(nextLastSync(results, 'old', 'new'), 'new');
});

test('keeps the old last sync when any change conflicted or was skipped', () => {
    assert.strictEqual(nextLastSync([{ status: 'merged' }, { status: 'conflict' }], 'old', 'new'), 'old');
    assert.strictEqual(nextLastSync([{ status: 'skipped' }], 'old', 'new'), 'old');
});

// 7. Tools new to this platform's devtool list are offered, not installed.
test('returns devtools added to this platform since the last sync', () => {
    const now = getDevtoolChoices('darwin');
    const before = now.filter((choice) => choice.value !== 'lf');
    assert.deepStrictEqual(newDevtools(before, now).map((choice) => choice.value), ['lf']);
});

test('a macOS-only tool is not offered on Windows', () => {
    assert.ok(getDevtoolChoices('darwin').some((choice) => choice.value === 'lf'));
    assert.ok(!getDevtoolChoices('win32').some((choice) => choice.value === 'lf'));
});

// 8. Sync never installs what this machine never installed.
test('leaves seeds for uninstalled agents alone and writes new files into existing installs', (t) => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-home-'));
    const realHome = process.env.HOME;
    process.env.HOME = fakeHome;
    t.after(() => {
        process.env.HOME = realHome;
        fs.rmSync(fakeHome, { recursive: true, force: true });
    });
    fs.mkdirSync(path.join(fakeHome, '.claude', 'skills'), { recursive: true });

    const changes = installedSeedChanges(['agents/codex/AGENTS.md', 'agents/skills/new-skill/SKILL.md'], 'darwin')
        .map((change) => ({ ...change, base: null, theirs: '# new\n' }));
    const results = applyChanges(changes);
    const statusOf = (target) => results.find((result) => result.target === target).status;

    assert.strictEqual(statusOf(path.join(fakeHome, '.codex', 'AGENTS.md')), 'not installed');
    assert.strictEqual(statusOf(path.join(fakeHome, '.cursor', 'skills', 'new-skill', 'SKILL.md')), 'not installed');
    assert.strictEqual(statusOf(path.join(fakeHome, '.claude', 'skills', 'new-skill', 'SKILL.md')), 'new');
    assert.ok(fs.existsSync(path.join(fakeHome, '.claude', 'skills', 'new-skill', 'SKILL.md')));
    assert.ok(!fs.existsSync(path.join(fakeHome, '.codex')));
    assert.strictEqual(nextLastSync(results, 'old', 'new'), 'new');
});

// Review fix 1. CRLF installed files merge against LF seeds and stay CRLF.
test('merges a CRLF installed file against LF seeds and keeps CRLF', () => {
    const local = baseZshrc.replace('export EDITOR=nvim', 'export EDITOR=nvim\nalias work="cd ~/work"').replace(/\n/g, '\r\n');
    const theirs = baseZshrc.replace('eval "$(starship init zsh)"', 'eval "$(starship init zsh)"\n\nlfcd() { :; }');
    const result = mergeFile({ base: baseZshrc, local, theirs });
    assert.strictEqual(result.status, 'merged');
    assert.ok(result.content.includes('alias work="cd ~/work"\r\n'));
    assert.ok(result.content.includes('lfcd() { :; }\r\n'));
    assert.ok(!/[^\r]\n/.test(result.content));
});

// Review fix 2. A settings file that is not valid JSON is reported, not fatal.
test('reports an unparseable settings file and still applies the rest', (t) => {
    const fakeHome = useFakeHome(t);
    fs.mkdirSync(path.join(fakeHome, '.claude'), { recursive: true });
    const settings = path.join(fakeHome, '.claude', 'settings.json');
    fs.writeFileSync(settings, '{ "theme": "dark", }');
    fs.writeFileSync(path.join(fakeHome, '.zshrc'), baseZshrc);

    const changes = [
        ...installedSeedChanges(['agents/claude/settings.json'], 'darwin').map((c) => ({ ...c, base: null, theirs: '{"permissions":{"ask":[]}}' })),
        ...installedSeedChanges(['tools/zshrc'], 'darwin').map((c) => ({ ...c, base: baseZshrc, theirs: `${baseZshrc}# new\n` }))
    ];
    const results = applyChanges(changes);

    assert.deepStrictEqual(results.map((r) => r.status), ['unreadable', 'merged']);
    assert.strictEqual(fs.readFileSync(settings, 'utf8'), '{ "theme": "dark", }');
    assert.strictEqual(nextLastSync(results, 'old', 'new'), 'old');
});

// Review fix 3. A first sync does not list files for agents never installed.
test('first sync skips agents this machine never installed', (t) => {
    const fakeHome = useFakeHome(t);
    fs.mkdirSync(path.join(fakeHome, '.claude', 'skills'), { recursive: true });
    const repoRoot = makeRepo(t, {
        'agents/codex/AGENTS.md': '# codex\n',
        'agents/skills/grill/SKILL.md': '# grill\n'
    });

    const drift = listDrift({ repoRoot, platform: 'darwin' });

    assert.deepStrictEqual(drift.map((d) => d.target), [path.join(fakeHome, '.claude', 'skills', 'grill', 'SKILL.md')]);
});

// Review fix 4. A first sync only looks at files git tracks.
test('first sync ignores untracked files in the clone', (t) => {
    const fakeHome = useFakeHome(t);
    fs.mkdirSync(path.join(fakeHome, '.claude', 'skills'), { recursive: true });
    const repoRoot = makeRepo(t, { 'agents/skills/grill/SKILL.md': '# grill\n' }, { 'agents/skills/.DS_Store': 'junk' });
    fs.mkdirSync(path.join(fakeHome, '.claude', 'skills', 'grill'));
    fs.writeFileSync(path.join(fakeHome, '.claude', 'skills', 'grill', 'SKILL.md'), '# grill\n');

    assert.deepStrictEqual(listDrift({ repoRoot, platform: 'darwin' }), []);
});

// Review fix 5. A renamed seed lists both paths, so the old copy is reported removed.
test('a renamed seed lists both the old and new path', (t) => {
    const repoRoot = makeRepo(t, { 'agents/skills/foo/SKILL.md': '# a skill\nwith enough lines\nto be seen\nas a rename\n' });
    const before = git(repoRoot, 'rev-parse', 'HEAD');
    git(repoRoot, 'mv', 'agents/skills/foo', 'agents/skills/bar');
    git(repoRoot, 'commit', '-qm', 'rename');

    assert.deepStrictEqual(changedSeedPaths(repoRoot, before, 'HEAD').sort(), ['agents/skills/bar/SKILL.md', 'agents/skills/foo/SKILL.md']);
});

// Review fix 6. An unknown last-sync commit points at --mark, not only --unshallow.
test('an unknown last sync suggests starting over with --mark', (t) => {
    const fakeHome = useFakeHome(t);
    fs.mkdirSync(path.join(fakeHome, '.config', 'workspace-setup'), { recursive: true });
    fs.writeFileSync(path.join(fakeHome, '.config', 'workspace-setup', 'last-sync'), `${'d'.repeat(40)}\n`);

    const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'sync.js')], { env: { ...process.env, HOME: fakeHome }, encoding: 'utf8' });

    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /--mark/);
});

// Review fix 7. A conflict's diff is against the committed seed content, not the clone's working copy.
test('conflict diff compares the installed file with the given seed content', (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-test-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const target = path.join(dir, '.zshrc');
    fs.writeFileSync(target, 'export EDITOR=code\n');

    const diff = conflictDiff(target, 'export EDITOR=vim\n');

    assert.match(diff, /-export EDITOR=code/);
    assert.match(diff, /\+export EDITOR=vim/);
});
