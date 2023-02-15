#!/bin/sh

###########################
# TT Workspace Setup: Mac #
###########################


## DEVELOPER TOOLS ##

echo "Setting up developer tools ..."

# Install Xcode Command Line Tools
if ! command xcode-select -v > /dev/null; then
    echo Installing Xcode command line tools ...
    xcode-select --install
else
    echo Xcode command line tools installed, version:
    xcode-select -v
fi

# Install HomeBrew
if ! command brew -v > /dev/null; then
    echo Installing Homebrew ...
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo Hombrew installed, version:
    brew -v
fi

# Install Homebrew Cask
if ! brew info cask &>/dev/null; then
    echo installing brew cask ...
    brew cask
else
    echo brew cask installed, version:
    brew info cask
fi

# Install Node
if ! command node -v > /dev/null; then
    echo Installing node ...
    brew install node
else
    echo node installed, version:
    node -v
fi

# Install Latest PHP
brew install php70

# Install Latest Python
brew install python

# Install Node Version Manager (NVM)
if ! command nvm --version > /dev/null; then
    echo Installing nvm ...
    brew install nvm
else
    echo nvm installed, version:
    nvm --version
fi

# Install Node Package Manager (NPM)
if ! command npm -v > /dev/null; then
    echo Installing npm ...
    npm install npm@latest -g
else
    echo npm installed, version:
    npm -v
fi

# Install Yarn
if ! command yarn -v > /dev/null; then
    echo Installing yarn ...
    brew install yarn
else
    echo yarn installed, version:
    yarn -v
fi

# Install Bower
if ! command bower -v > /dev/null; then
    echo installing bower ...
    brew install bower
else
    echo bower installed, version:
    bower -v
fi

# Install Composer
if ! command composer --version > /dev/null; then
    echo Installing composer ...
    brew install composer
else
    echo composer installed, version:
    composer --version
fi

# Install Ember
if ! command ember -v > /dev/null; then
    echo Installing ember ...
    npm install -g ember-cli
else
    echo ember installed, version:
    ember -v
fi

# Install Vue
if ! command vue --version > /dev/null; then
    echo Installing vue ...
    npm install -g @vue/cli
else
    echo vue installed, version:
    vue --version
fi

# Install Laravel
composer global require "laravel/installer"

# Install Tmux
if type tmux >/dev/null 2>/dev/null; then
    echo tmux already installed
else
    echo Installing tmux ...
    brew install tmux
fi

echo ###
echo ###
echo ###
echo verifying installs ...

echo ###
xcode-select --version
brew -v
echo ###
brew info cask
echo ###
node -v
echo ###
nvm --version
echo ###
npm -v
echo ###
ember -v
echo ###
vue --version
echo ###
php -v
echo ###
composer --version
echo ###
python --version

echo ###
echo ###
echo ###
echo developer tools installed

# Install Iterm2
brew cask install iterm2
