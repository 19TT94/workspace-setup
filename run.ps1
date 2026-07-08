$ErrorActionPreference = "Stop"

Write-Host "Installing Required Dependencies ..."

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "winget is not available. Install App Installer from the Microsoft Store, then re-run this script."
    exit 1
}

Write-Host "winget installed, version:"
winget --version

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installing node ..."
    winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
}

Write-Host "node installed, version:"
node -v
Write-Host "npm installed, version:"
npm -v

npm install

Write-Host ""
Write-Host ""

node ./index.js
