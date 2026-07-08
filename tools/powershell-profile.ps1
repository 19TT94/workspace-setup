# PowerShell profile starter for workspace-setup

# NVM for Windows
$nvmHome = "$env:LOCALAPPDATA\nvm"
$nvmSymlink = "$env:ProgramFiles\nodejs"
if (Test-Path $nvmHome) {
    $env:NVM_HOME = $nvmHome
    $env:NVM_SYMLINK = $nvmSymlink
    $env:Path = "$nvmHome;$nvmSymlink;" + $env:Path
}

# VS Code CLI
$vscodeBin = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin"
if (Test-Path $vscodeBin) {
    $env:Path = "$vscodeBin;" + $env:Path
}

# Starship prompt
if (Get-Command starship -ErrorAction SilentlyContinue) {
    Invoke-Expression (&starship init powershell)
}
