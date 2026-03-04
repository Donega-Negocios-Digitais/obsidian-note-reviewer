param(
    [Parameter(Position=0)]
    [string]$Version = "latest"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue'

$REPO = if ($env:OBSREVIEW_RELEASE_REPO) { $env:OBSREVIEW_RELEASE_REPO } else { "Donega-Negocios-Digitais/obsidian-note-reviewer" }
$INSTALL_DIR = "$env:USERPROFILE\.local\bin"

function Get-Sha256Hash {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $fileHashCmd = Get-Command Get-FileHash -ErrorAction SilentlyContinue
    if ($fileHashCmd) {
        return (Get-FileHash -Path $Path -Algorithm SHA256).Hash.ToLower()
    }

    $certutilCmd = Get-Command certutil.exe -ErrorAction SilentlyContinue
    if ($certutilCmd) {
        $certOutput = & certutil.exe -hashfile $Path SHA256 2>$null
        if ($LASTEXITCODE -eq 0) {
            foreach ($line in $certOutput) {
                if ($line -match "^[0-9a-fA-F ]{64,}$") {
                    return ($line -replace '\s+', '').ToLower()
                }
            }
        }
    }

    try {
        $stream = [System.IO.File]::OpenRead($Path)
        try {
            $sha256 = [System.Security.Cryptography.SHA256]::Create()
            try {
                $hashBytes = $sha256.ComputeHash($stream)
                return ([System.BitConverter]::ToString($hashBytes)).Replace("-", "").ToLower()
            }
            finally {
                $sha256.Dispose()
            }
        }
        finally {
            $stream.Dispose()
        }
    }
    catch {
        throw "Unable to compute SHA256 hash. Requires Get-FileHash, certutil, or .NET SHA256 support."
    }
}

# Check for 32-bit Windows
if (-not [Environment]::Is64BitProcess) {
    Write-Error "Obsidian Note Reviewer does not support 32-bit Windows."
    exit 1
}

# Determine platform
$platform = "win32-x64"

# Create install directory
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null

# Get version to install
if ($Version -eq "latest") {
    Write-Output "Fetching latest version..."
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest" -ErrorAction Stop
        $tag = $release.tag_name
    }
    catch {
        Write-Error "Failed to get latest version: $_"
        exit 1
    }
}
else {
    $tag = $Version
    if (-not $tag.StartsWith("v")) {
        $tag = "v$tag"
    }
}

Write-Output "Installing obsreview $tag..."

$binaryName = "obsreview-$platform.exe"
$binaryUrl = "https://github.com/$REPO/releases/download/$tag/$binaryName"
$checksumUrl = "$binaryUrl.sha256"

# Download binary
$tempFile = Join-Path $env:TEMP "obsreview-$tag.exe"
try {
    Invoke-WebRequest -Uri $binaryUrl -OutFile $tempFile -ErrorAction Stop
}
catch {
    Write-Error "Failed to download binary: $_"
    if (Test-Path $tempFile) {
        Remove-Item -Force $tempFile
    }
    exit 1
}

# Download and verify checksum
try {
    $expectedChecksum = (Invoke-RestMethod -Uri $checksumUrl -ErrorAction Stop).Split(" ")[0].Trim()
}
catch {
    Write-Error "Failed to download checksum: $_"
    Remove-Item -Force $tempFile
    exit 1
}

$actualChecksum = Get-Sha256Hash -Path $tempFile

if ($actualChecksum -ne $expectedChecksum) {
    Write-Error "Checksum verification failed"
    Remove-Item -Force $tempFile
    exit 1
}

# Install binary
$installPath = Join-Path $INSTALL_DIR "obsreview.exe"
Move-Item -Force $tempFile $installPath

Write-Output ""
Write-Output "obsreview $tag installed to $installPath"

try {
    $versionOutput = & $installPath --version 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($versionOutput)) {
        throw "no version output"
    }

    Write-Output "Binary self-check OK: $($versionOutput.Trim())"
}
catch {
    Write-Error "Installed binary did not respond to '--version'."
    Write-Output ""
    Write-Output "Troubleshooting:"
    Write-Output "1. Verify latest release assets are available for this repository."
    Write-Output "2. Re-run installer after the next release is published."
    Write-Output "3. If needed, run the installer with an explicit version:"
    Write-Output "   .\install.ps1 -Version v0.2.7"
    exit 1
}

# Check if install directory is in PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$INSTALL_DIR*") {
    Write-Output ""
    Write-Output "$INSTALL_DIR is not in your PATH."
    Write-Output ""
    Write-Output "Add it permanently with:"
    Write-Output ""
    Write-Output "  [Environment]::SetEnvironmentVariable('Path', `$env:Path + ';$INSTALL_DIR', 'User')"
    Write-Output ""
    Write-Output "Or add it for this session only:"
    Write-Output ""
    Write-Output "  `$env:Path += ';$INSTALL_DIR'"
}

Write-Output ""
Write-Output "Test the install:"
Write-Output "  obsreview --version"
Write-Output "  obsreview --help"
Write-Output "  obsreview doctor"
Write-Output ""
Write-Output "Then install the Claude Code plugin:"
Write-Output "  /plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer"
Write-Output "  /plugin install obsreview@obsidian-note-reviewer"
Write-Output ""
