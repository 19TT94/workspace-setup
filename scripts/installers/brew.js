const path = require('path');
const shell = require('../shell');
const { homePath } = require('../platform');
const { commandExists, installIfMissing, logInstallSummary } = require('./common');

const REPO_ROOT = path.resolve(__dirname, '../..');

function appendStarshipToZshrc() {
    const zshrcPath = homePath('.zshrc');
    const block = '\n\nif command -v starship >/dev/null 2>&1; then\n  eval "$(starship init zsh)"\nfi\n';
    shell.ShellString(block).toEnd(zshrcPath);
}

async function installSelectedDevtools(selected, helpers) {
    const installed = [];
    const exist = [];

    for (const tool of selected) {
        if (tool === 'xcode-select') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('xcode-select -p'),
                install: () => shell.exec('xcode-select --install'),
                command: 'xcode-select --install',
                installed,
                exist
            });
        }

        if (tool === 'homebrew') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('brew -v'),
                install: () => shell.exec('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'),
                command: 'install Homebrew via install.sh',
                installed,
                exist
            });
        }

        if (tool === 'homebrew cask') {
            if (!commandExists('brew -v')) {
                console.log('Skipping homebrew cask: install Homebrew first.');
            } else {
                exist.push(tool);
            }
        }

        if (tool === 'node') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('node -v'),
                install: () => shell.exec('brew install node'),
                command: 'brew install node',
                installed,
                exist
            });
        }

        if (tool === 'php') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('php --version'),
                install: () => shell.exec('brew install php'),
                command: 'brew install php',
                installed,
                exist
            });
        }

        if (tool === 'python') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('python --version'),
                install: () => shell.exec('brew install python'),
                command: 'brew install python',
                installed,
                exist
            });
        }

        if (tool === 'starship') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('starship --version'),
                install: async () => {
                    shell.exec('brew install starship');
                    appendStarshipToZshrc();
                    await helpers.copyFileWithPrompt(
                        path.join(REPO_ROOT, 'tools/starship.toml'),
                        homePath('.config', 'starship.toml'),
                        'starship.toml'
                    );
                    shell.exec('rm -f ~/.zcompdump');
                    shell.exec('autoload -Uz compinit && compinit');
                    shell.exec('compaudit');
                    shell.exec('compaudit | xargs chmod g-w');
                    shell.exec('source ~/.zshrc');
                },
                command: 'brew install starship; copy starship.toml; append starship init to ~/.zshrc',
                installed,
                exist
            });
        }

        if (tool === 'nvm') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('nvm --version'),
                install: () => shell.exec('brew install nvm'),
                command: 'brew install nvm',
                installed,
                exist
            });
        }

        if (tool === 'npm') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('npm -v'),
                install: () => shell.exec('brew install npm'),
                command: 'brew install npm',
                installed,
                exist
            });
        }

        if (tool === 'yarn') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('yarn -v'),
                install: () => shell.exec('brew install yarn'),
                command: 'brew install yarn',
                installed,
                exist
            });
        }

        if (tool === 'composer') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('composer --version'),
                install: () => shell.exec('brew install composer'),
                command: 'brew install composer',
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

        if (tool === 'tmux') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('tmux -V'),
                install: () => shell.exec('brew install tmux'),
                command: 'brew install tmux',
                installed,
                exist
            });
        }

        if (tool === 'docker') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('docker --version'),
                install: () => shell.exec('brew install docker'),
                command: 'brew install docker',
                installed,
                exist
            });
        }

        if (tool === 'github cli') {
            await installIfMissing({
                label: tool,
                isInstalled: () => commandExists('gh --version'),
                install: () => shell.exec('brew install gh'),
                command: 'brew install gh',
                installed,
                exist
            });
        }
    }

    logInstallSummary(installed, exist);
}

async function installSelectedApps(selected) {
    const installed = [];
    const exist = [];

    const caskInstalls = {
        virtualbox: 'virtualbox',
        vagrant: 'vagrant',
        'docker desktop': 'docker',
        slack: 'slack',
        atom: 'atom',
        vscode: 'visual-studio-code',
        'sublime text': 'sublime-text',
        'sequel pro': 'sequel-pro',
        postman: 'postman',
        cyberduck: 'cyberduck',
        spotify: 'spotify',
        'android studio': 'android-studio',
        'google chrome': 'google-chrome',
        firefox: 'firefox',
        brave: 'brave-browser',
        'mark text': 'mark-text',
        '1password': '1password',
        iterm2: 'iterm2'
    };

    for (const app of selected) {
        const cask = caskInstalls[app];
        if (!cask) {
            continue;
        }

        await installIfMissing({
            label: app,
            isInstalled: () => shell.exec(`brew list --cask ${cask}`, { silent: true }).code === 0,
            install: () => shell.exec(`brew install --cask ${cask}`),
            command: `brew install --cask ${cask}`,
            installed,
            exist
        });
    }

    logInstallSummary(installed, exist);
}

module.exports = {
    installSelectedDevtools,
    installSelectedApps
};
