[CmdletBinding()]
param(
    [string]$Version = "1.5.17",
    [string]$OutputDirectory,
    [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = "Stop"

$skillRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $skillRoot "..\..\.."))
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not $OutputDirectory) {
    $OutputDirectory = Join-Path $workspaceRoot "docs\spikes\skills-cli\runs\$timestamp"
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "agentmindstudio-skills-cli-spike"
New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
$sandbox = Join-Path $tempRoot ([guid]::NewGuid().ToString("N"))
$isolatedHome = Join-Path $sandbox "home"
$project = Join-Path $sandbox "project"
$fixtureRoot = Join-Path $sandbox "fixture"
$fixtureSkill = Join-Path $fixtureRoot "spike-skill"
New-Item -ItemType Directory -Path $isolatedHome, $project, $fixtureSkill -Force | Out-Null

$fixtureContent = @'
---
name: spike-skill
description: Isolated local fixture used only by the AgentMindStudio skills CLI compatibility spike.
---

# Spike fixture

Return the word `spike-ok` when invoked.
'@
[System.IO.File]::WriteAllText(
    (Join-Path $fixtureSkill "SKILL.md"),
    $fixtureContent,
    [System.Text.UTF8Encoding]::new($false)
)

$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$savedEnvironment = @{}
$environmentNames = @("HOME", "USERPROFILE", "XDG_CONFIG_HOME", "CODEX_HOME", "npm_config_cache", "NO_COLOR", "CI", "DISABLE_TELEMETRY")
foreach ($name in $environmentNames) {
    $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
}

$env:HOME = $isolatedHome
$env:USERPROFILE = $isolatedHome
$env:XDG_CONFIG_HOME = Join-Path $isolatedHome ".config"
$env:CODEX_HOME = Join-Path $isolatedHome ".codex"
$env:npm_config_cache = Join-Path $sandbox "npm-cache"
$env:NO_COLOR = "1"
$env:CI = "1"
$env:DISABLE_TELEMETRY = "1"

$results = [System.Collections.Generic.List[object]]::new()
$logDirectory = Join-Path $sandbox "logs"
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

function Remove-Ansi {
    param([string]$Text)
    $ansiPattern = "$([char]27)\[[0-?]*[ -/]*[@-~]"
    return [regex]::Replace($Text, $ansiPattern, "")
}

function Invoke-SpikeCase {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string[]]$Arguments,
        [int]$ExpectedExitCode = 0,
        [switch]$ExpectJson,
        [scriptblock]$Assert,
        [string]$WorkingDirectory = $project
    )

    $started = Get-Date
    $baseArguments = @("exec", "--yes", "--package=skills@$Version", "--", "skills")
    $allArguments = $baseArguments + $Arguments
    $output = ""
    $exitCode = -1
    $parseError = $null
    $assertionError = $null
    $parsed = $null

    $safeCaseName = $Name -replace "[^a-zA-Z0-9._-]", "_"
    $stdoutPath = Join-Path $logDirectory "$safeCaseName.stdout.log"
    $stderrPath = Join-Path $logDirectory "$safeCaseName.stderr.log"
    try {
        $process = Start-Process `
            -FilePath $npm `
            -ArgumentList $allArguments `
            -WorkingDirectory $WorkingDirectory `
            -NoNewWindow `
            -PassThru `
            -RedirectStandardOutput $stdoutPath `
            -RedirectStandardError $stderrPath

        if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
            $process.Kill()
            $process.WaitForExit()
            $exitCode = -2
            $assertionError = "Command timed out after $TimeoutSeconds seconds."
        }
        else {
            $process.WaitForExit()
            $process.Refresh()
            $exitCode = [int]$process.ExitCode
        }

        $stdout = if (Test-Path -LiteralPath $stdoutPath) { Get-Content -Raw -LiteralPath $stdoutPath } else { "" }
        $stderr = if (Test-Path -LiteralPath $stderrPath) { Get-Content -Raw -LiteralPath $stderrPath } else { "" }
        $combinedOutput = (@($stdout, $stderr) | Where-Object { $_ }) -join [Environment]::NewLine
        $output = Remove-Ansi $combinedOutput.Trim()
    }
    catch {
        $output = Remove-Ansi $_.Exception.Message
        $exitCode = -1
    }

    if ($ExpectJson -and $exitCode -eq 0) {
        try {
            $parsed = $output | ConvertFrom-Json -ErrorAction Stop
        }
        catch {
            $parseError = $_.Exception.Message
        }
    }

    if ($Assert -and $exitCode -eq $ExpectedExitCode -and -not $parseError) {
        try {
            & $Assert $output $parsed
        }
        catch {
            $assertionError = $_.Exception.Message
        }
    }

    $status = if ($exitCode -ne $ExpectedExitCode -or $parseError -or $assertionError) { "fail" } else { "pass" }
    $results.Add([pscustomobject]@{
        name = $Name
        status = $status
        arguments = $Arguments
        expectedExitCode = $ExpectedExitCode
        exitCode = $exitCode
        durationMs = [int]((Get-Date) - $started).TotalMilliseconds
        timeoutSeconds = $TimeoutSeconds
        output = $output
        parseError = $parseError
        assertionError = $assertionError
    })
}

try {
    Invoke-SpikeCase -Name "binary-identity" -Arguments @("--version") -Assert {
        param($output)
        if ($output.Trim() -ne $Version) { throw "Expected version $Version but observed '$output'." }
    }

    Invoke-SpikeCase -Name "root-help" -Arguments @("--help") -Assert {
        param($output)
        foreach ($command in @("add", "use", "remove", "list", "find", "update", "init")) {
            if ($output -notmatch "(?m)^\s+$([regex]::Escape($command))\b") { throw "Root help no longer advertises '$command'." }
        }
    }

    Invoke-SpikeCase -Name "list-empty-json" -Arguments @("list", "--json") -ExpectJson
    Invoke-SpikeCase -Name "local-source-discovery" -Arguments @("add", $fixtureRoot, "--list") -Assert {
        param($output)
        if ($output -notmatch "spike-skill") { throw "Fixture skill was not discovered." }
    }

    Invoke-SpikeCase -Name "project-install" -Arguments @("add", $fixtureRoot, "-a", "codex", "-s", "spike-skill", "--copy", "-y") -Assert {
        $expected = Join-Path $project ".agents\skills\spike-skill\SKILL.md"
        if (-not (Test-Path -LiteralPath $expected)) { throw "Expected installed file was not created at $expected." }
    }

    Invoke-SpikeCase -Name "list-after-install-json" -Arguments @("list", "--json") -ExpectJson -Assert {
        param($output)
        if ($output -notmatch "spike-skill") { throw "Installed fixture is missing from JSON inventory." }
    }

    Invoke-SpikeCase -Name "context-use" -Arguments @("use", $fixtureRoot, "--skill", "spike-skill") -Assert {
        param($output)
        if ($output -notmatch "spike-ok") { throw "Fixture content was not returned." }
    }

    Invoke-SpikeCase -Name "project-remove" -Arguments @("remove", "spike-skill", "-a", "codex", "-y") -Assert {
        $removed = Join-Path $project ".agents\skills\spike-skill"
        if (Test-Path -LiteralPath $removed) { throw "Fixture skill still exists after removal." }
    }

    Invoke-SpikeCase -Name "invalid-command-contract" -Arguments @("definitely-not-a-command") -ExpectedExitCode 0 -Assert {
        param($output)
        if ($output -notmatch "Unknown command") { throw "Unknown-command diagnostic changed." }
    }
}
finally {
    foreach ($name in $environmentNames) {
        [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], "Process")
    }
}

$sandboxFiles = @()
if (Test-Path -LiteralPath $sandbox) {
    $sandboxFiles = @(Get-ChildItem -LiteralPath $sandbox -Recurse -File | ForEach-Object {
        $_.FullName.Substring($sandbox.Length).TrimStart("\")
    } | Where-Object { $_ -notmatch "^(npm-cache|logs)\\" })
}

$failed = @($results | Where-Object status -eq "fail")
$report = [pscustomobject]@{
    schemaVersion = 1
    package = "skills"
    requestedVersion = $Version
    executedAt = (Get-Date).ToString("o")
    isolatedHome = $true
    status = if ($failed.Count -eq 0) { "pass" } else { "fail" }
    failureCount = $failed.Count
    cases = $results
    sandboxManifest = $sandboxFiles
}
$reportPath = Join-Path $OutputDirectory "results.json"
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8

$resolvedTempRoot = [System.IO.Path]::GetFullPath($tempRoot).TrimEnd("\") + "\"
$resolvedSandbox = [System.IO.Path]::GetFullPath($sandbox)
if ($resolvedSandbox.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $resolvedSandbox -Recurse -Force
}
else {
    throw "Refusing to remove sandbox outside the verified temp root: $resolvedSandbox"
}

Write-Output "skills@$Version compatibility spike: $($report.status)"
Write-Output "Report: $reportPath"
if ($failed.Count -gt 0) {
    Write-Output "Failed cases: $($failed.name -join ', ')"
    exit 1
}
