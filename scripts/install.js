const fs = require('fs');
const os = require('os');
const path = require('path');
const { prompt } = require('inquirer');
const shell = require('./shell');
const {
    isWindows,
    homePath,
    getConfigChoices,
    getDevtoolChoices,
    getAgentChoices,
    getAgentInstallPaths,
    getGitignoreEntries,
    getPowerShellProfilePath
} = require('./platform');
const { installSelectedDevtools: installBrewDevtools, installSelectedApps } = require('./installers/brew');
const { installSelectedDevtools: installWingetDevtools } = require('./installers/winget');
const { isDryRun, log, promptMessage } = require('./dry-run');

const REPO_ROOT = path.resolve(__dirname, '..');

module.exports = {
    install_config,
    install_agents,
    install_apps,
    install_devtools
};

function expandHome(filepath) {
    if (filepath === '~') {
        return os.homedir();
    }
    if (filepath.startsWith('~/')) {
        return path.join(os.homedir(), filepath.slice(2));
    }
    return filepath;
}

function ensureDir(dirPath) {
    const resolved = typeof dirPath === 'string' && (dirPath.startsWith('~') || path.isAbsolute(dirPath))
        ? expandHome(dirPath)
        : dirPath;
    if (isDryRun()) {
        log(`Would create directory ${resolved}`);
        return resolved;
    }
    shell.mkdir('-p', resolved);
    return resolved;
}

function dryRunExec(description) {
    if (isDryRun()) {
        log(`Would run: ${description}`);
        return { code: 0 };
    }
    return null;
}

async function promptOverwrite(message) {
    const response = await prompt([
        {
            type: 'expand',
            message: promptMessage(message),
            name: 'overwrite',
            choices: isDryRun()
                ? [
                    {
                        key: 'Y',
                        name: 'Preview overwrite (no changes)',
                        value: 'overwrite'
                    },
                    {
                        key: 'n',
                        name: 'Skip',
                        value: 'skip'
                    }
                ]
                : [
                    {
                        key: 'Y',
                        name: 'Overwrite',
                        value: 'overwrite'
                    },
                    {
                        key: 'n',
                        name: 'Skip',
                        value: 'skip'
                    }
                ]
        }
    ]);

    return response.overwrite === 'overwrite';
}

async function copyFileWithPrompt(source, target, label) {
    const resolvedSource = path.resolve(source);
    const resolvedTarget = typeof target === 'string' ? expandHome(target) : target;

    if (!fs.existsSync(resolvedSource)) {
        console.log(`Skipping ${label}: source not found at ${resolvedSource}`);
        return false;
    }

    ensureDir(path.dirname(resolvedTarget));

    if (fs.existsSync(resolvedTarget)) {
        if (!await promptOverwrite(`File exists: Overwrite ${label}?`)) {
            if (isDryRun()) {
                log(`Would skip ${label}`);
            } else {
                console.log(`Skipped ${label}`);
            }
            return false;
        }
    }

    if (isDryRun()) {
        log(`Would copy ${resolvedSource} -> ${resolvedTarget}`);
        return true;
    }

    const result = shell.cp(resolvedSource, resolvedTarget);
    if (result.code !== 0) {
        console.error(`Failed to copy ${label}`);
        return false;
    }

    console.log(`Installed ${label} -> ${resolvedTarget}`);
    return true;
}

async function copyDirContentsWithPrompt(sourceDir, targetDir, label) {
    const resolvedSource = path.resolve(sourceDir);
    const resolvedTarget = ensureDir(targetDir);

    if (!fs.existsSync(resolvedSource)) {
        console.log(`Skipping ${label}: source not found at ${resolvedSource}`);
        return false;
    }

    const entries = fs.readdirSync(resolvedSource, { withFileTypes: true });
    if (entries.length === 0) {
        console.log(`Skipping ${label}: source directory is empty`);
        return false;
    }

    let copied = 0;
    for (const entry of entries) {
        const sourcePath = path.join(resolvedSource, entry.name);
        const targetPath = path.join(resolvedTarget, entry.name);
        const entryLabel = `${label}/${entry.name}`;

        if (entry.isDirectory()) {
            if (fs.existsSync(targetPath)) {
                if (!await promptOverwrite(`Directory exists: Overwrite ${entryLabel}?`)) {
                    if (isDryRun()) {
                        log(`Would skip ${entryLabel}`);
                    } else {
                        console.log(`Skipped ${entryLabel}`);
                    }
                    continue;
                }
                if (isDryRun()) {
                    log(`Would remove directory ${targetPath}`);
                } else {
                    shell.rm('-rf', targetPath);
                }
            }

            if (isDryRun()) {
                log(`Would copy directory ${sourcePath} -> ${targetPath}`);
                copied++;
                continue;
            }

            const result = shell.cp('-r', sourcePath, targetPath);
            if (result.code !== 0) {
                console.error(`Failed to copy ${entryLabel}`);
                continue;
            }

            console.log(`Installed ${entryLabel} -> ${targetPath}`);
            copied++;
            continue;
        }

        if (await copyFileWithPrompt(sourcePath, targetPath, entryLabel)) {
            copied++;
        }
    }

    return copied > 0;
}

function setupGitignore(overwrite = false) {
    const gitignorePath = homePath('.gitignore');
    const entries = getGitignoreEntries();
    const content = `${entries.join('\n')}\n`;

    if (fs.existsSync(gitignorePath) && !overwrite) {
        return false;
    }

    if (isDryRun()) {
        log(`Would write .gitignore -> ${gitignorePath} (${entries.join(', ')})`);
        log(`Would run: git config --global core.excludesfile "${gitignorePath}"`);
        return true;
    }

    if (overwrite && fs.existsSync(gitignorePath)) {
        fs.unlinkSync(gitignorePath);
    }

    fs.writeFileSync(gitignorePath, content, 'utf8');
    shell.exec(`git config --global core.excludesfile "${gitignorePath}"`);
    console.log(`Installed .gitignore -> ${gitignorePath}`);
    return true;
}

async function installGitignore() {
    const gitignorePath = homePath('.gitignore');
    if (!fs.existsSync(gitignorePath)) {
        setupGitignore(false);
        return;
    }

    if (await promptOverwrite('File exists: Overwrite .gitignore?')) {
        setupGitignore(true);
    }
}

async function installMacShellConfig() {
    ensureDir(homePath('.zsh'));
    dryRunExec(`curl git-completion.bash -> ${homePath('.zsh', 'git-completion.bash')}`);
    dryRunExec(`curl git-completion.zsh -> ${homePath('.zsh', '_git')}`);
    if (!isDryRun()) {
        shell.exec(`curl -o "${homePath('.zsh', 'git-completion.bash')}" https://raw.githubusercontent.com/git/git/master/contrib/completion/git-completion.bash`);
        shell.exec(`curl -o "${homePath('.zsh', '_git')}" https://raw.githubusercontent.com/git/git/master/contrib/completion/git-completion.zsh`);
    }
    await copyFileWithPrompt(
        path.join(REPO_ROOT, 'tools/zshrc'),
        homePath('.zshrc'),
        '.zshrc'
    );
}

async function installWindowsShellConfig() {
    const profilePath = getPowerShellProfilePath();
    await copyFileWithPrompt(
        path.join(REPO_ROOT, 'tools/powershell-profile.ps1'),
        profilePath,
        'PowerShell profile'
    );
}

async function installNvmConfig() {
    if (isWindows) {
        const nvmHome = homePath('AppData', 'Local', 'nvm');
        ensureDir(nvmHome);
        if (isDryRun()) {
            log(`Would prepare NVM for Windows directory -> ${nvmHome}`);
        } else {
            console.log(`Prepared NVM for Windows directory -> ${nvmHome}`);
        }
        return;
    }

    ensureDir(homePath('.nvm'));
}

async function installTmuxConfig() {
    if (await copyFileWithPrompt(
        path.join(REPO_ROOT, 'tools/tmux.conf'),
        homePath('.tmux.conf'),
        '.tmux.conf'
    )) {
        dryRunExec(`tmux source-file "${homePath('.tmux.conf')}"`);
        if (!isDryRun()) {
            shell.exec(`tmux source-file "${homePath('.tmux.conf')}"`);
        }
    }
}

async function installVimConfig() {
    if (await copyFileWithPrompt(
        path.join(REPO_ROOT, 'tools/vimrc'),
        homePath('.vimrc'),
        '.vimrc'
    )) {
        ensureDir(homePath('.vim', 'autoload'));
        ensureDir(homePath('.vim', 'bundle'));
        dryRunExec(`curl pathogen.vim -> ${homePath('.vim', 'autoload', 'pathogen.vim')}`);
        if (!isDryRun()) {
            shell.exec(`curl -LSso "${homePath('.vim', 'autoload', 'pathogen.vim')}" https://tpo.pe/pathogen.vim`);
        }
        if (!fs.existsSync(homePath('.vim', 'bundle', 'nerdtree'))) {
            dryRunExec(`git clone nerdtree -> ${homePath('.vim', 'bundle', 'nerdtree')}`);
            if (!isDryRun()) {
                shell.exec(`git clone https://github.com/scrooloose/nerdtree.git "${homePath('.vim', 'bundle', 'nerdtree')}"`);
            }
        }
    }
}

async function install_config() {
    const response = await prompt([
        {
            type: 'checkbox',
            name: 'config',
            message: promptMessage('Unselect any config files to skip'),
            choices: getConfigChoices()
        }
    ]);

    for (const item of response.config) {
        if (item === 'gitignore') {
            await installGitignore();
        }

        if (item === 'zshrc') {
            await installMacShellConfig();
        }

        if (item === 'powershell profile') {
            await installWindowsShellConfig();
        }

        if (item === 'nvm') {
            await installNvmConfig();
        }

        if (item === 'tmux.conf') {
            await installTmuxConfig();
        }

        if (item === 'vimrc') {
            await installVimConfig();
        }
    }
}

async function install_agents() {
    const response = await prompt([
        {
            type: 'checkbox',
            name: 'agents',
            message: promptMessage('Unselect any AI agent starter files to skip'),
            choices: getAgentChoices()
        }
    ]);

    const agentInstallPaths = getAgentInstallPaths();

    for (const agent of response.agents) {
        const config = agentInstallPaths[agent];
        if (!config) {
            continue;
        }

        for (const entry of config.paths) {
            const source = path.join(REPO_ROOT, ...entry.source);
            const target = homePath(...entry.target);

            if (entry.type === 'dir') {
                await copyDirContentsWithPrompt(source, target, entry.label);
            } else {
                await copyFileWithPrompt(source, target, entry.label);
            }
        }
    }
}

async function install_devtools() {
    const response = await prompt([
        {
            type: 'checkbox',
            name: 'config',
            message: promptMessage('Unselect any devtools to skip'),
            choices: getDevtoolChoices()
        }
    ]);

    const helpers = { copyFileWithPrompt };

    if (isWindows) {
        await installWingetDevtools(response.config, helpers);
        return;
    }

    await installBrewDevtools(response.config, helpers);
}

async function install_apps() {
    if (isWindows) {
        console.log('App installation is only available on macOS in this installer.');
        return;
    }

    const response = await prompt([
        {
            type: 'checkbox',
            name: 'config',
            message: promptMessage('Unselect any apps to skip'),
            choices: [
                { name: 'virtualbox', value: 'virtualbox', checked: true },
                { name: 'vagrant', value: 'vagrant', checked: true },
                { name: 'docker desktop', value: 'docker desktop', checked: true },
                { name: 'slack', value: 'slack', checked: true },
                { name: 'atom', value: 'atom', checked: false },
                { name: 'vscode', value: 'vscode', checked: true },
                { name: 'sublime text', value: 'sublime text', checked: false },
                { name: 'sequel pro', value: 'sequel pro', checked: true },
                { name: 'postman', value: 'postman', checked: true },
                { name: 'cyberduck', value: 'cyberduck', checked: true },
                { name: 'spotify', value: 'spotify', checked: true },
                { name: 'android studio', value: 'android studio', checked: false },
                { name: 'google chrome', value: 'google chrome', checked: true },
                { name: 'firefox', value: 'firefox', checked: true },
                { name: 'brave', value: 'brave', checked: false },
                { name: 'mark text', value: 'mark text', checked: false },
                { name: 'iterm2', value: 'iterm2', checked: false }
            ]
        }
    ]);

    await installSelectedApps(response.config);
}
