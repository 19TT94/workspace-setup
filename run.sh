#!/usr/bin/env bash

set -e

echo "Installing Required Dependencies ..."

# Install Xcode Command Line Tools
if ! xcode-select -p >/dev/null 2>&1; then
    echo "Installing Xcode command line tools ..."
    xcode-select --install
    echo "Please re-run this script after Xcode tools finish installing."
    exit 1
else
    echo "Xcode command line tools installed, version:"
    xcode-select -v
fi

# Install Homebrew
if ! command -v brew >/dev/null 2>&1; then
    echo "Installing Homebrew ..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Ensure brew is available in current shell session
if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
fi

if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew installation failed or brew is not on PATH."
    exit 1
fi

echo "Homebrew installed, version:"
brew -v

# Install Node (npm is bundled with Node)
if ! command -v node >/dev/null 2>&1; then
    echo "Installing node ..."
    brew install node
fi

echo "node installed, version:"
node -v
echo "npm installed, version:"
npm -v

npm install

echo -e "\n\n"

node ./index.js
