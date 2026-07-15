param(
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

function Get-CommandVersion {
    param([string]$Name, [string[]]$Arguments = @('--version'))

    $command = Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $command) {
        return [ordered]@{ command = $Name; present = $false; version = $null }
    }

    try {
        $lines = & $command.Source @Arguments 2>&1
        $version = (($lines | Select-Object -First 3) -join ' ').Trim()
    } catch {
        $version = 'present-version-unavailable'
    }

    [ordered]@{ command = $Name; present = $true; version = $version }
}

function Get-PathObservation {
    param([string]$Token, [string]$ResolvedPath)

    $item = Get-Item -LiteralPath $ResolvedPath -Force -ErrorAction SilentlyContinue
    if (-not $item) {
        return [ordered]@{ pathToken = $Token; exists = $false; kind = $null; reparsePoint = $false }
    }

    [ordered]@{
        pathToken = $Token
        exists = $true
        kind = if ($item.PSIsContainer) { 'directory' } else { 'file' }
        reparsePoint = [bool]($item.Attributes -band [IO.FileAttributes]::ReparsePoint)
    }
}

$homePath = [Environment]::GetFolderPath('UserProfile')
$appDataPath = [Environment]::GetFolderPath('ApplicationData')
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $homePath '.codex' }
$copilotHome = if ($env:COPILOT_HOME) { $env:COPILOT_HOME } else { Join-Path $homePath '.copilot' }
$kiroHome = if ($env:KIRO_HOME) { $env:KIRO_HOME } else { Join-Path $homePath '.kiro' }

$paths = @(
    Get-PathObservation '$CODEX_HOME/config.toml' (Join-Path $codexHome 'config.toml')
    Get-PathObservation '$HOME/.agents/skills' (Join-Path $homePath '.agents/skills')
    Get-PathObservation '$CODEX_HOME/AGENTS.md' (Join-Path $codexHome 'AGENTS.md')
    Get-PathObservation '$CODEX_HOME/AGENTS.override.md' (Join-Path $codexHome 'AGENTS.override.md')
    Get-PathObservation '$KIRO_HOME/settings/mcp.json' (Join-Path $kiroHome 'settings/mcp.json')
    Get-PathObservation '$KIRO_HOME/skills' (Join-Path $kiroHome 'skills')
    Get-PathObservation '$KIRO_HOME/steering' (Join-Path $kiroHome 'steering')
    Get-PathObservation '$HOME/.config/kilo/kilo.jsonc' (Join-Path $homePath '.config/kilo/kilo.jsonc')
    Get-PathObservation '$HOME/.kilo/skills' (Join-Path $homePath '.kilo/skills')
    Get-PathObservation '$COPILOT_HOME/mcp-config.json' (Join-Path $copilotHome 'mcp-config.json')
    Get-PathObservation '$COPILOT_HOME/skills' (Join-Path $copilotHome 'skills')
    Get-PathObservation '$COPILOT_HOME/copilot-instructions.md' (Join-Path $copilotHome 'copilot-instructions.md')
    Get-PathObservation '$COPILOT_HOME/instructions' (Join-Path $copilotHome 'instructions')
    Get-PathObservation '$APPDATA/Code/User/mcp.json' (Join-Path $appDataPath 'Code/User/mcp.json')
)

$extensions = @()
$code = Get-Command code -ErrorAction SilentlyContinue | Select-Object -First 1
if ($code) {
    $extensions = @(& $code.Source --list-extensions --show-versions 2>$null |
        Where-Object { $_ -match '^(github\.copilot|kiro|kilocode\.|openai\.)' } |
        Sort-Object)
}

$report = [ordered]@{
    schemaVersion = 1
    observedAt = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
    privacy = [ordered]@{
        configBytesRead = $false
        childNamesEnumerated = $false
        resolvedUserPathEmitted = $false
        authStateRead = $false
    }
    environment = [ordered]@{
        os = [Environment]::OSVersion.VersionString
        architecture = [Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
        powershell = $PSVersionTable.PSVersion.ToString()
    }
    commands = @(
        Get-CommandVersion 'codex'
        Get-CommandVersion 'copilot'
        Get-CommandVersion 'kiro-cli'
        Get-CommandVersion 'kilo'
        Get-CommandVersion 'code'
    )
    vscodeExtensions = $extensions
    paths = $paths
    conclusion = 'pass-metadata-only'
}

$parent = Split-Path -Parent $OutputPath
if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding utf8
$report | ConvertTo-Json -Depth 8
