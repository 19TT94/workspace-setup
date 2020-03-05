const { prompt } = require('inquirer');
const shell = require('shelljs');

module.exports = {
    install_config,
    install_apps,
    install_devtools
}

async function install_config() {
    // check with user for whether any installs should be excluded
    const response = await prompt([
        {
            type: 'checkbox',
            name: 'config',
            message: 'Unselect any options to ignore',
            choices: [
                {
                    name: 'gitignore',
                    checked: true
                },
                { 
                    name: 'zshrc',
                    checked: true
                },
                {
                    name: 'nvm',
                    checked: true
                },
                {
                    name: 'tmux',
                    checked: true
                },
                {
                    name: 'vimrc',
                    checked: true
                },
                {
                    name: 'pathogen',
                    checked: false
                },
                {
                    name: 'NERDTree',
                    checked: false
                }
            ]
        }
    ])

    // go through config files other than selected exclusions
    for(var i=0; i < response.config.length; i++) {
        let file = '~/.' + response.config[i];
        // check for gitignore
        if (response.config[i] === 'gitignore') {
            if (!shell.test('-e', file)) {
                shell.exec('git config --global core.excludesfile ~/.gitignore');
                shell.exec('echo *.DS_Store >> ~/.gitignore');
            } else {
                if(await overwrite('File exists: Overwrite .gitignore?')) {
                    shell.exec('git config --global core.excludesfile ~/.gitignore');
                    shell.exec('echo *.DS_Store >> ~/.gitignore');
                }
            }
        }
        // check for zsh profile
        if (response.config[i] === 'zshrc') {   
            
            // Install dependencies for github autocomplete
            shell.exec('mkdir ~/.zsh');
            shell.exec('curl -o git-completion.bash https://raw.githubusercontent.com/git/git/master/contrib/completion/git-completion.bash > ~/.zsh/git-completion.bash');
            shell.exec('curl -o _git https://raw.githubusercontent.com/git/git/master/contrib/completion/git-completion.zsh > ~/.zsh/_git');

            if (!shell.test('-e', file)) {
                // terminal settings | create bash_profile
                shell.exec('cat ./tools/zshrc > ~/.zshrc');
                // initialize bash_profile
                shell.exec('source ~/.zshrc');
            } else {
                console.log("file exists");
                if(await overwrite('File exists: Overwrite .zshrc?')) {
                    console.log("overwrite");
                    // terminal settings | create bash_profile
                    shell.exec('cat ./tools/zshrc > ~/.zshrc');
                    // initialize bash_profile
                    shell.exec('source ~/.zshrc');
                }
            }
        }
        // check for nvm config
        if (response.config[i] === 'nvm') {
            if (!shell.test('-e', file)) {
                // create nvm directory
                shell.exec('mkdir ~/.nvm');
            } else {
                if(await overwrite('File exists: Overwrite .nvm?')) {
                    // create nvm directory
                    shell.exec('mkdir ~/.nvm');
                }
            }
        }
        // check for vimrc config
        if (response.config[i] === 'vimrc') {
            if (!shell.test('-e', file)) {
                // vim settings | create .vimrc
                shell.exec('touch .vimrc');
                // copy over .vimrc
                shell.exec('cat .vimrc > ~/.vimrc');
                // vim package manager ~ pathogen
                shell.exec('mkdir -p ~/.vim/autoload ~/.vim/bundle && \
                // curl -LSso ~/.vim/autoload/pathogen.vim https://tpo.pe/pathogen.vim');
                // install NERDTree
                shell.exec('git clone https://github.com/scrooloose/nerdtree.git ~/.vim/bundle/nerdtree');
                // link .vimrc
                shell.exec('source ~/.vimrc');
            } else {
                console.log("file exists");
                if(await overwrite('File exists: Overwrite .vimrc?')) {
                    // vim settings | create .vimrc
                    shell.exec('touch .vimrc');
                    // copy over .vimrc
                    shell.exec('cat .vimrc > ~/.vimrc');
                    // vim package manager ~ pathogen
                    shell.exec('mkdir -p ~/.vim/autoload ~/.vim/bundle && \
                    // curl -LSso ~/.vim/autoload/pathogen.vim https://tpo.pe/pathogen.vim');
                    // install NERDTree
                    shell.exec('git clone https://github.com/scrooloose/nerdtree.git ~/.vim/bundle/nerdtree');
                    // link .vimrc
                    shell.exec('source ~/.vimrc');
                }
            }
        }
    }

    async function overwrite(message) {
        const response = await prompt([
            {
                type: 'expand',
                message: message,
                name: 'overwrite',
                choices: [
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
        ])

        return response.overwrite === 'overwrite';
    }
}


async function install_devtools() {
    // check with user for whether any installs should be excluded
    const response = await prompt([
        {
            type: 'checkbox',
            name: 'config',
            message: 'Unselect any options to ignore',
            choices: [
                {
                    name: 'xcode-select',
                    checked: true
                },
                {
                    name: 'homebrew',
                    checked: true
                },
                {
                    name: 'homebrew cask',
                    checked: true
                },
                {
                    name: 'node',
                    checked: true
                },
                {
                    name: 'php',
                    checked: true
                },
                {
                    name: 'python',
                    checked: true
                },
                {
                    name: 'starship',
                    checked: true
                },
                {
                    name: 'nvm',
                    checked: true
                },
                {
                    name: 'npm',
                    checked: true
                },
                {
                    name: 'yarn',
                    checked: false
                },
                {
                    name: 'composer',
                    checked: true
                },
                {
                    name: 'vue',
                    checked: true
                },
                {
                    name: 'react',
                    checked: true
                },
                {
                    name: 'laravel',
                    checked: true
                }
            ]
        }
    ])

    let installed = [];
    let exist = [];

    // go through config files other than selected exclusions
    for(var i=0; i < response.config.length; i++) {
        // install xcode-select
        if (response.config[i] === 'xcode-select') {
            if (shell.exec('node --version', { silent: true }).code != 0) {
                shell.exec('xcode-select --install');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install homebrew
        if (response.config[i] === 'homebrew') {
            if (shell.exec('brew -v', { silent: true }).code != 0) {
                shell.exec('/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install homebrew cask
        if (response.config[i] === 'homebrew cask') {
            if (shell.exec('brew info cask', { silent: true }).code != 0) {
                shell.exec('brew cask');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install node
        if (response.config[i] === 'node') {
            if (shell.exec('node -v', { silent: true }).code != 0) {
                shell.exec('brew install node');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install php
        if (response.config[i] === 'php') {
            if (shell.exec('php --version', { silent: true }).code != 0) {
                shell.exec('brew install php70');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install python
        if (response.config[i] === 'python') {
            if (shell.exec('python --version', { silent: true }).code != 0) {
                shell.exec('brew install python');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install starship
        if (response.config[i] === 'starship') {
            if (shell.exec('starship --version', { silent: true }).code != 0) {
                shell.exec('brew install starship');
                // update installed
                installed.push(response.config[i])
                
                // write to .zshrc
                let starship = "eval '$(starship init bash)'"
                shell.exec("echo \n" + starship + " >> ~/.zshrc;")
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install nvm
        if (response.config[i] === 'nvm') {
            if (shell.exec('nvm --version', { silent: true }).code != 0) {
                shell.exec('brew install nvm');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install npm
        if (response.config[i] === 'npm') {
            if (shell.exec('npm -v', { silent: true }).code != 0) {
                shell.exec('brew install npm');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install yarn
        if (response.config[i] === 'yarn') {
            if (shell.exec('yarn -v', { silent: true }).code != 0) {
                shell.exec('brew install yarn');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install bower
        if (response.config[i] === 'bower') {
            if (shell.exec('bower -v', { silent: true }).code != 0) {
                shell.exec('brew install bower');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install composer
        if (response.config[i] === 'composer') {
            if (shell.exec('composer --version', { silent: true }).code != 0) {
                shell.exec('brew install composer');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install vue
        if (response.config[i] === 'vue') {
            if (shell.exec('vue --version', { silent: true }).code != 0) {
                shell.exec('npm install -g @vue/cli');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install laravel
        if (response.config[i] === 'laravel') {
            if (shell.exec('laravel --version', { silent: true }).code != 0) {
                shell.exec('composer global require laravel/installer');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install tmux
        if (response.config[i] === 'tmux') {
            if (shell.exec('tmux', { silent: true }).code != 0) {
                shell.exec('brew install tmux');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
    }

    console.log("already installed");
    console.log(exist);
    console.log("installed");
    console.log(installed);
}

async function install_apps() {
    // check with user for whether any installs should be excluded
    const response = await prompt([
        {
            type: 'checkbox',
            name: 'config',
            message: 'Unselect any options to ignore',
            choices: [
                {
                    name: 'virtualbox',
                    checked: true
                },
                {
                    name: 'vagrant',
                    checked: true
                },
                {
                    name: 'docker',
                    checked: true
                },
                {
                    name: 'slack',
                    checked: true
                },
                {
                    name: 'atom',
                    checked: false
                },
                {
                    name: 'vscode',
                    checked: true
                },
                {
                    name: 'sublime text',
                    checked: false
                },
                {
                    name: 'sequel pro',
                    checked: true
                },
                {
                    name: 'postman',
                    checked: true
                },
                {
                    name: 'cyberduck',
                    checked: true
                },
                {
                    name: 'spotify',
                    checked: true
                },
                {
                    name: 'android studio',
                    checked: false
                },
                {
                    name: 'google chrome',
                    checked: true
                },
                {
                    name: 'firefox',
                    checked: true
                },
                {
                    name: 'brave',
                    checked: false
                },
                {
                    name: 'mark text',
                    checked: false
                },
                {
                    name: 'iterm2',
                    checked: false
                }
            ]
        }
    ])

    let installed = [];
    let exist = [];

    // go through config files other than selected exclusions
    for(var i=0; i < response.config.length; i++) {
        // install virtualbox
        if (response.config[i] === 'virtualbox') {
            if (shell.exec('brew cask list virtualbox', { silent: true }).code != 0) {
                shell.exec('brew cask install virtualbox');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install vagrant
        if (response.config[i] === 'vagrant') {
            if (shell.exec('brew cask list vagrant', { silent: true }).code != 0) {
                shell.exec('brew cask install vagrant');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install docker
        if (response.config[i] === 'docker') {
            if (shell.exec('brew cask list docker', { silent: true }).code != 0) {
                shell.exec('brew cask install docker');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install slack
        if (response.config[i] === 'slack') {
            if (shell.exec('brew cask list slack', { silent: true }).code != 0) {
                shell.exec('brew cask install slack');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install atom
        if (response.config[i] === 'atom') {
            if (shell.exec('brew cask list atom', { silent: true }).code != 0) {
                shell.exec('brew cask install atom');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install vscode
        if (response.config[i] === 'vscode') {
            if (shell.exec('brew cask list visual-studio-code', { silent: true }).code != 0) {
                shell.exec('brew cask install visual-studio-code');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
         // install sublime
         if (response.config[i] === 'sublime text') {
            if (shell.exec('brew cask list sublime-text', { silent: true }).code != 0) {
                shell.exec('brew cask install sublime-text');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install sequel-pro
        if (response.config[i] === 'sequel pro') {
            if (shell.exec('brew cask list sequel-pro', { silent: true }).code != 0) {
                shell.exec('brew cask install sequel-pro');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install postman
        if (response.config[i] === 'postman') {
            if (shell.exec('brew cask list postman', { silent: true }).code != 0) {
                shell.exec('brew cask install postman');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
         // install postman
         if (response.config[i] === 'cyberduck') {
            if (shell.exec('brew cask list cyberduck', { silent: true }).code != 0) {
                shell.exec('brew cask install cyberduck');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install spotify
        if (response.config[i] === 'spotify') {
            if (shell.exec('brew cask list spotify', { silent: true }).code != 0) {
                shell.exec('brew cask install spotify');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install android-studio
        if (response.config[i] === 'android-studio') {
            if (shell.exec('brew cask list android-studio', { silent: true }).code != 0) {
                shell.exec('brew cask install android-studio');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install google-chrome
        if (response.config[i] === 'google-chrome') {
            if (shell.exec('brew cask list google-chrome', { silent: true }).code != 0) {
                shell.exec('brew cask install google-chrome');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install google-chrome
        if (response.config[i] === 'firefox') {
            if (shell.exec('brew cask list firefox', { silent: true }).code != 0) {
                shell.exec('brew cask install firefox');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install brave-browser
        if (response.config[i] === 'brave') {
            if (shell.exec('brew cask list brave-browser', { silent: true }).code != 0) {
                shell.exec('brew cask install brave-browser');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install mark-text
        if (response.config[i] === 'mark text') {
            if (shell.exec('brew cask list mark-text', { silent: true }).code != 0) {
                shell.exec('brew cask install mark-text');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install one password
        if (response.config[i] === '1password') {
            if (shell.exec('brew cask list 1password', { silent: true }).code != 0) {
                shell.exec('brew cask install 1password');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
        // install iterm2
        if (response.config[i] === 'iterm2') {
            if (shell.exec('brew cask list iterm2', { silent: true }).code != 0) {
                shell.exec('brew cask install iterm2');
                // update installed
                installed.push(response.config[i])
            } else {
                // update exist
                exist.push(response.config[i])
            }
        }
    }

    console.log("already installed");
    console.log(exist);
    console.log("installed");
    console.log(installed);
}
