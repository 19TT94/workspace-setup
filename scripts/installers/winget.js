const fs = require('fs');
const path = require('path');
const shell = require('../shell');
const { homePath, getShellConfigPath } = require('../platform');
const { addDockerCliPluginDir, commandExists, installIfMissing, logInstallSummary } = require('./common');
const { isDryRun, log } = require('../dry-run');

const REPO_ROOT = path.resolve(__dirname, '../..');
const WINGET_FLAGS = '--accept-package-agreements --accept-source-agreements';

function wingetList(packageId) {
    return shell.execProbe(`winget list --id ${packageId} -e`).code === 0;
}

function wingetInstall(packageId) {
    shell.exec(`winget install --id ${packageId} -e ${WINGET_FLAGS}`);
}

function wingetCommand(packageId) {
    return `winget install --id ${packageId} -e ${WINGET_FLAGS}`;
}

// The winget tree-sitter CLI is an MSVC build, so it looks for cl.exe via
// Visual Studio's installer metadata rather than a gcc/clang on PATH.
function hasMsvcBuildTools() {
    const vswhere = path.join(
        process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
        'Microsoft Visual Studio', 'Installer', 'vswhere.exe'
    );
    if (!fs.existsSync(vswhere)) {
        return false;
    }

    const result = shell.execCapture(
        `"${vswhere}" -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`
    );
    return result.code === 0 && result.stdout.trim() !== '';
}

// Build Tools is a multi-GB download, so point at it instead of installing it.
function warnIfNoCCompiler() {
    if (process.env.CC || hasMsvcBuildTools()) {
        return;
    }

    console.log('tree-sitter-cli needs a C compiler to build nvim-treesitter parsers. Install the MSVC Build Tools:');
    console.log(`  winget install --id Microsoft.VisualStudio.BuildTools -e ${WINGET_FLAGS} --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"`);
    console.log('  (or set CC to an existing gcc/clang)');
}

function appendToFile(filePath, content) {
    if (isDryRun()) {
        log(`Would append to ${filePath} (blocked by dry run)`);
        return;
    }

    fs.appendFileSync(filePath, content, 'utf8');
}

function appendStarshipToProfile() {
    const profilePath = getShellConfigPath();
    const profileDir = path.dirname(profilePath);

    if (isDryRun()) {
        log(`Would append starship init to ${profilePath} (blocked by dry run)`);
        return;
    }

    if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
    }

    if (!fs.existsSync(profilePath)) {
        fs.writeFileSync(profilePath, '', 'utf8');
    }

    const block = '\n\nif (Get-Command starship -ErrorAction SilentlyContinue) {\n  Invoke-Expression (&starship init powershell)\n}\n';
    appendToFile(profilePath, block);
}

async function installSelectedDevtools(selected, helpers) {
    const installed = [];
    const exist = [];

    for (const tool of selected) {
        if (tool === 'git') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('git --version'),
                install: () => wingetInstall('Git.Git'),
                command: wingetCommand('Git.Git'),
                installed,
                exist
            });
        }

        if (tool === 'winget') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('winget --version'),
                install: () => {
                    console.log('winget should be installed via the Microsoft Store or App Installer.');
                },
                command: 'verify winget is available',
                installed,
                exist
            });
        }

        if (tool === 'node') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('node -v'),
                install: () => wingetInstall('OpenJS.NodeJS.LTS'),
                command: wingetCommand('OpenJS.NodeJS.LTS'),
                installed,
                exist
            });
        }

        if (tool === 'php') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('php --version'),
                install: () => wingetInstall('PHP.PHP.8.3'),
                command: wingetCommand('PHP.PHP.8.3'),
                installed,
                exist
            });
        }

        if (tool === 'python') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('python --version'),
                install: () => wingetInstall('Python.Python.3.12'),
                command: wingetCommand('Python.Python.3.12'),
                installed,
                exist
            });
        }

        if (tool === 'neovim') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('nvim --version'),
                install: () => wingetInstall('Neovim.Neovim'),
                command: wingetCommand('Neovim.Neovim'),
                installed,
                exist
            });
            // nvim-treesitter compiles parsers with the tree-sitter CLI.
            await installIfMissing({
                label: 'tree-sitter-cli',
                isInstalled: () => commandExists('tree-sitter --version'),
                install: () => wingetInstall('tree-sitter.tree-sitter-cli'),
                command: wingetCommand('tree-sitter.tree-sitter-cli'),
                installed,
                exist
            });
            warnIfNoCCompiler();
        }

        if (tool === 'wezterm') {
            await installIfMissing({
                label: tool,
                isInstalled: () => wingetList('wez.wezterm'),
                install: () => wingetInstall('wez.wezterm'),
                command: wingetCommand('wez.wezterm'),
                installed,
                exist
            });
        }

        if (tool === 'starship') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('starship --version'),
                install: async () => {
                    wingetInstall('Starship.Starship');
                    appendStarshipToProfile();
                    await helpers.copyFileWithPrompt(
                        path.join(REPO_ROOT, 'tools/starship.toml'),
                        homePath('.config', 'starship.toml'),
                        'starship.toml'
                    );
                },
                command: `${wingetCommand('Starship.Starship')}; copy starship.toml; append starship init to PowerShell profile`,
                installed,
                exist
            });
        }

        if (tool === 'nvm-windows') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('nvm version'),
                install: () => wingetInstall('CoreyButler.NVMforWindows'),
                command: wingetCommand('CoreyButler.NVMforWindows'),
                installed,
                exist
            });
        }

        if (tool === 'npm') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('npm -v'),
                install: () => wingetInstall('OpenJS.NodeJS.LTS'),
                command: wingetCommand('OpenJS.NodeJS.LTS'),
                installed,
                exist
            });
        }

        if (tool === 'yarn') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('yarn -v'),
                install: () => wingetInstall('Yarn.Yarn'),
                command: wingetCommand('Yarn.Yarn'),
                installed,
                exist
            });
        }

        if (tool === 'composer') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('composer --version'),
                install: () => wingetInstall('Composer.Composer'),
                command: wingetCommand('Composer.Composer'),
                installed,
                exist
            });
        }

        if (tool === 'vue') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('vue --version'),
                install: () => shell.exec('npm install -g @vue/cli'),
                command: 'npm install -g @vue/cli',
                installed,
                exist
            });
        }

        if (tool === 'laravel') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('laravel --version'),
                install: () => shell.exec('composer global require laravel/installer'),
                command: 'composer global require laravel/installer',
                installed,
                exist
            });
        }

        if (tool === 'docker desktop') {
            await installIfMissing({
                label: tool,
                isInstalled: () => wingetList('Docker.DockerDesktop'),
                install: () => wingetInstall('Docker.DockerDesktop'),
                command: wingetCommand('Docker.DockerDesktop'),
                installed,
                exist
            });
        }

        // Docker Desktop ships its own CLI and Compose plugin.
        if (tool === 'docker' && selected.includes('docker desktop')) {
            exist.push('docker (via docker desktop)');
        } else if (tool === 'docker') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('docker --version'),
                install: () => wingetInstall('Docker.DockerCLI'),
                command: wingetCommand('Docker.DockerCLI'),
                installed,
                exist
            });
            // winget's portable Compose lands in its Links dir as docker-compose.exe.
            const wingetLinks = path.join(
                process.env.LOCALAPPDATA || homePath('AppData', 'Local'),
                'Microsoft', 'WinGet', 'Links'
            );
            await installIfMissing({
                label: 'docker compose',
                isInstalled: () => commandExists('docker compose version'),
                install: () => {
                    wingetInstall('Docker.DockerCompose');
                    addDockerCliPluginDir(wingetLinks);
                },
                command: `${wingetCommand('Docker.DockerCompose')}; add ${wingetLinks} to cliPluginsExtraDirs in ~/.docker/config.json`,
                installed,
                exist
            });
        }

        if (tool === 'github cli') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('gh --version'),
                install: () => wingetInstall('GitHub.cli'),
                command: wingetCommand('GitHub.cli'),
                installed,
                exist
            });
        }

        if (tool === 'claude code') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('claude --version'),
                install: () => wingetInstall('Anthropic.ClaudeCode'),
                command: wingetCommand('Anthropic.ClaudeCode'),
                installed,
                exist
            });
        }

        if (tool === 'fzf') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('fzf --version'),
                install: () => wingetInstall('junegunn.Fzf'),
                command: wingetCommand('junegunn.Fzf'),
                installed,
                exist
            });
        }

        if (tool === 'opencode') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('opencode --version'),
                install: () => shell.exec('npm install -g opencode-ai'),
                command: 'npm install -g opencode-ai',
                installed,
                exist
            });
        }

        if (tool === 'ripgrep') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('rg --version'),
                install: () => wingetInstall('BurntSushi.ripgrep.MSVC'),
                command: wingetCommand('BurntSushi.ripgrep.MSVC'),
                installed,
                exist
            });
        }

        if (tool === 'codex') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('codex --version'),
                install: () => shell.exec('npm install -g @openai/codex'),
                command: 'npm install -g @openai/codex',
                installed,
                exist
            });
        }

        if (tool === 'cursor') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('agent --version'),
                install: () => shell.exec('powershell -NoProfile -Command "irm \'https://cursor.com/install?win32=true\' | iex"'),
                command: "powershell -NoProfile -Command \"irm 'https://cursor.com/install?win32=true' | iex\"",
                installed,
                exist
            });
        }
    }

    logInstallSummary(installed, exist);
}

module.exports = {
    wingetList,
    wingetInstall,
    installSelectedDevtools
};
