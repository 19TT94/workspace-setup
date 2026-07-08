const fs = require('fs');
const path = require('path');
const shell = require('../shell');
const { homePath, getShellConfigPath } = require('../platform');
const { commandExists, installIfMissing, logInstallSummary } = require('./common');

const REPO_ROOT = path.resolve(__dirname, '../..');
const WINGET_FLAGS = '--accept-package-agreements --accept-source-agreements';

function wingetList(packageId) {
    return shell.exec(`winget list --id ${packageId} -e`, { silent: true }).code === 0;
}

function wingetInstall(packageId) {
    shell.exec(`winget install --id ${packageId} -e ${WINGET_FLAGS}`);
}

function wingetCommand(packageId) {
    return `winget install --id ${packageId} -e ${WINGET_FLAGS}`;
}

function appendToFile(filePath, content) {
    fs.appendFileSync(filePath, content, 'utf8');
}

function appendStarshipToProfile() {
    const profilePath = getShellConfigPath();
    const profileDir = path.dirname(profilePath);

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

        if (tool === 'docker') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('docker --version'),
                install: () => wingetInstall('Docker.DockerCLI'),
                command: wingetCommand('Docker.DockerCLI'),
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
    }

    logInstallSummary(installed, exist);
}

module.exports = {
    wingetList,
    wingetInstall,
    installSelectedDevtools
};
