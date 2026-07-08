const os = require('os');
const path = require('path');

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

function homePath(...segments) {
    return path.join(os.homedir(), ...segments);
}

function displayHome(relativePath) {
    if (isWindows) {
        return `%USERPROFILE%\\${relativePath.replace(/\//g, '\\')}`;
    }
    return `~/${relativePath}`;
}

function getPowerShellProfilePath() {
    const documents = path.join(os.homedir(), 'Documents');
    const ps7Profile = path.join(documents, 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
    const ps5Profile = path.join(documents, 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1');

    if (process.env.PSModulePath && process.env.PSModulePath.includes('PowerShell')) {
        return ps7Profile;
    }

    return ps5Profile;
}

function getShellConfigPath() {
    if (isWindows) {
        return getPowerShellProfilePath();
    }
    return homePath('.zshrc');
}

function getGitignoreEntries() {
    if (isWindows) {
        return ['Thumbs.db', 'desktop.ini', 'ehthumbs.db'];
    }
    return ['*.DS_Store'];
}

function getConfigChoices() {
    if (isWindows) {
        return [
            { name: 'gitignore', value: 'gitignore', checked: true },
            { name: 'powershell profile', value: 'powershell profile', checked: true },
            { name: 'nvm', value: 'nvm', checked: true },
            { name: 'vimrc', value: 'vimrc', checked: true },
            { name: 'pathogen', value: 'pathogen', checked: false },
            { name: 'NERDTree', value: 'NERDTree', checked: false }
        ];
    }

    return [
        { name: 'gitignore', value: 'gitignore', checked: true },
        { name: 'zshrc', value: 'zshrc', checked: true },
        { name: 'nvm', value: 'nvm', checked: true },
        { name: 'tmux.conf', value: 'tmux.conf', checked: true },
        { name: 'vimrc', value: 'vimrc', checked: true },
        { name: 'pathogen', value: 'pathogen', checked: false },
        { name: 'NERDTree', value: 'NERDTree', checked: false }
    ];
}

function getDevtoolChoices() {
    if (isWindows) {
        return [
            { name: 'git', value: 'git', checked: true },
            { name: 'winget', value: 'winget', checked: true },
            { name: 'node', value: 'node', checked: true },
            { name: 'php', value: 'php', checked: true },
            { name: 'python', value: 'python', checked: true },
            { name: 'starship', value: 'starship', checked: true },
            { name: 'nvm-windows', value: 'nvm-windows', checked: true },
            { name: 'npm', value: 'npm', checked: true },
            { name: 'yarn', value: 'yarn', checked: false },
            { name: 'composer', value: 'composer', checked: true },
            { name: 'vue', value: 'vue', checked: true },
            { name: 'laravel', value: 'laravel', checked: true },
            { name: 'docker', value: 'docker', checked: true },
            { name: 'github cli', value: 'github cli', checked: true }
        ];
    }

    return [
        { name: 'xcode-select', value: 'xcode-select', checked: true },
        { name: 'homebrew', value: 'homebrew', checked: true },
        { name: 'homebrew cask', value: 'homebrew cask', checked: true },
        { name: 'node', value: 'node', checked: true },
        { name: 'php', value: 'php', checked: true },
        { name: 'python', value: 'python', checked: true },
        { name: 'starship', value: 'starship', checked: true },
        { name: 'nvm', value: 'nvm', checked: true },
        { name: 'npm', value: 'npm', checked: true },
        { name: 'yarn', value: 'yarn', checked: false },
        { name: 'composer', value: 'composer', checked: true },
        { name: 'vue', value: 'vue', checked: true },
        { name: 'react', value: 'react', checked: true },
        { name: 'laravel', value: 'laravel', checked: true },
        { name: 'tmux', value: 'tmux', checked: true },
        { name: 'docker', value: 'docker', checked: true },
        { name: 'github cli', value: 'github cli', checked: true }
    ];
}

const AGENT_INSTALL_PATHS = {
    cursor: {
        label: 'Cursor',
        summary: 'global rules',
        paths: [
            {
                type: 'dir',
                source: ['agents', 'cursor', 'rules'],
                target: ['.cursor', 'rules'],
                label: 'cursor rules'
            },
            {
                type: 'file',
                source: ['agents', 'cursor', 'README.md'],
                target: ['.cursor', 'rules', 'README.md'],
                label: 'cursor README'
            }
        ]
    },
    codex: {
        label: 'Codex',
        summary: 'AGENTS.md + skills',
        paths: [
            {
                type: 'file',
                source: ['agents', 'codex', 'AGENTS.md'],
                target: ['.codex', 'AGENTS.md'],
                label: 'codex AGENTS.md'
            },
            {
                type: 'dir',
                source: ['agents', 'codex', 'skills'],
                target: ['.codex', 'skills'],
                label: 'codex skills'
            }
        ]
    },
    claude: {
        label: 'Claude Code',
        summary: 'CLAUDE.md',
        paths: [
            {
                type: 'file',
                source: ['agents', 'claude', 'CLAUDE.md'],
                target: ['.claude', 'CLAUDE.md'],
                label: 'claude CLAUDE.md'
            }
        ]
    }
};

function formatAgentTargetPath(targetSegments, type) {
    const relativePath = targetSegments.join('/');
    if (type === 'dir') {
        return displayHome(`${relativePath}/`);
    }
    return displayHome(relativePath);
}

function getAgentInstallPaths() {
    return AGENT_INSTALL_PATHS;
}

function getAgentChoices() {
    return Object.entries(AGENT_INSTALL_PATHS).map(([value, agent]) => {
        const primaryPath = agent.paths[0];
        const targetDisplay = formatAgentTargetPath(primaryPath.target, primaryPath.type);

        return {
            name: `${agent.label.toLowerCase()} (${agent.summary} -> ${targetDisplay})`,
            value,
            checked: true
        };
    });
}

function getInstallChoices() {
    if (isWindows) {
        return [
            {
                name: 'Install everything (config, devtools, and AI agent files)',
                value: 'all'
            },
            {
                name: 'Install everything except configuration files',
                value: 'no-config'
            },
            {
                name: 'Install devtools and configuration files',
                value: 'devtools-and-config'
            },
            {
                name: 'Install devtools only (node, npm, nvm-windows, ...)',
                value: 'devtools'
            },
            {
                name: 'Install AI agent starter files (Cursor, Codex, Claude)',
                value: 'agents'
            }
        ];
    }

    return [
        {
            name: 'Install everything',
            value: 'all'
        },
        {
            name: 'Install everything except configuration files (.zshrc, .nvm, ...)',
            value: 'no-config'
        },
        {
            name: 'Install devtools and configuration files (no extra apps)',
            value: 'devtools-and-config'
        },
        {
            name: 'Install devtools only (node, npm, nvm, ...)',
            value: 'devtools'
        },
        {
            name: 'Install apps only (slack, vscode, sequel-pro ...)',
            value: 'apps'
        },
        {
            name: 'Install AI agent starter files (Cursor, Codex, Claude)',
            value: 'agents'
        }
    ];
}

function getCompletionMessage() {
    if (isWindows) {
        return '\n Your workspace is setup. Restart Windows Terminal or run `. $PROFILE` to load new configuration.';
    }
    return '\n Your workspace is setup, please run `source ~/.zshrc`, reopen terminal, or open iTerm to load new configuration.';
}

module.exports = {
    isWindows,
    isMac,
    homePath,
    displayHome,
    getPowerShellProfilePath,
    getShellConfigPath,
    getGitignoreEntries,
    getConfigChoices,
    getDevtoolChoices,
    getAgentInstallPaths,
    getAgentChoices,
    getInstallChoices,
    getCompletionMessage
};
