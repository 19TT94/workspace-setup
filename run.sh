## DEVELOPER TOOLS ##

echo "Installing Required Dependencies ..."

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

# Install Node
if ! command node -v > /dev/null; then
    echo Installing node ...
    brew install node
else
    echo node installed, version:
    node -v
fi

# Install Node Package Manager (NPM)
if ! command npm -v > /dev/null; then
    echo Installing npm ...
    npm install npm@latest -g
else
    echo npm installed, version:
    npm -v
fi

npm install

echo -e "\n\n";

./index.js
