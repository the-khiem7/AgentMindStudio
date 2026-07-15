[CmdletBinding()]
param(
    [string]$EvidencePath,
    [switch]$KeepTemp
)

$ErrorActionPreference = 'Stop'
$invocationRoot = (Get-Location).Path
$prototypeRoot = Join-Path $PSScriptRoot 'prototype'
$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$runRoot = Join-Path $tempBase ("AgentMindStudio TG001 kiem-chung " + [guid]::NewGuid().ToString('N'))
$projectRoot = Join-Path $runRoot 'prototype'
$resolvedEvidencePath = if (-not $EvidencePath) {
    $null
}
elseif ([System.IO.Path]::IsPathRooted($EvidencePath)) {
    [System.IO.Path]::GetFullPath($EvidencePath)
}
else {
    [System.IO.Path]::GetFullPath((Join-Path $invocationRoot $EvidencePath))
}

function Assert-ExitCode([string]$Operation) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Operation failed with exit code $LASTEXITCODE."
    }
}

function Assert-VerifiedTempChild([string]$Path) {
    $resolved = [System.IO.Path]::GetFullPath($Path)
    $relative = [System.IO.Path]::GetRelativePath($tempBase, $resolved)
    if ([string]::IsNullOrWhiteSpace($relative) -or $relative -eq '..' -or $relative.StartsWith('..' + [System.IO.Path]::DirectorySeparatorChar)) {
        throw "Refusing cleanup because the path is not a verified child of the temp root: $resolved"
    }
}

try {
    $bun = (Get-Command bun.exe -ErrorAction Stop).Source
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    $runnerElevated = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    New-Item -ItemType Directory -Path $runRoot | Out-Null
    Copy-Item -LiteralPath $prototypeRoot -Destination $projectRoot -Recurse
    Push-Location $projectRoot
    try {
        & $bun install --frozen-lockfile
        Assert-ExitCode 'bun install --frozen-lockfile'

        $sourceResultPath = Join-Path $runRoot 'source-result.json'
        $env:AMS_TG001_MODE = 'source'
        $env:AMS_TG001_OUTPUT = $sourceResultPath
        & $bun run probe:source
        Assert-ExitCode 'source probe'

        # ElectroBun 1.18.1 invokes Windows PowerShell's Compress-Archive while
        # producing the stable installer zip. This machine's inherited module
        # path selects a PowerShell 7 module that Windows PowerShell refuses
        # under its default execution policy. Keep the workaround process-local
        # so it neither requires elevation nor changes machine/user policy.
        $previousExecutionPolicyPreference = $env:PSExecutionPolicyPreference
        $env:PSExecutionPolicyPreference = 'Bypass'
        try {
            & $bun run build:probe
            Assert-ExitCode 'ElectroBun dev packaged build'
            & $bun run package:probe
            Assert-ExitCode 'ElectroBun stable installer build'
        }
        finally {
            if ($null -eq $previousExecutionPolicyPreference) {
                Remove-Item Env:PSExecutionPolicyPreference -ErrorAction SilentlyContinue
            }
            else {
                $env:PSExecutionPolicyPreference = $previousExecutionPolicyPreference
            }
        }

        # Stable packaging intentionally consumes the stable bundle into its
        # installer/archive artifacts. Run the equivalent dev packaged bundle,
        # which retains the launcher directory, after also proving the stable
        # installer path completes successfully.
        $launcherPath = Join-Path $projectRoot 'build\dev-win-x64\AgentMindStudioTG001Probe-dev\bin\launcher.exe'
        if (-not (Test-Path -LiteralPath $launcherPath -PathType Leaf)) {
            throw "Packaged launcher was not found at the expected path: $launcherPath"
        }

        $packagedResultPath = Join-Path $runRoot 'packaged-result.json'
        $env:AMS_TG001_MODE = 'packaged'
        $env:AMS_TG001_OUTPUT = $packagedResultPath
        $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
        $startInfo.FileName = $launcherPath
        $startInfo.WorkingDirectory = Split-Path -Parent $launcherPath
        $startInfo.UseShellExecute = $false
        $startInfo.CreateNoWindow = $true
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        $process = [System.Diagnostics.Process]::new()
        $process.StartInfo = $startInfo
        if (-not $process.Start()) {
            throw 'Packaged launcher did not start.'
        }
        $deadline = [DateTimeOffset]::UtcNow.AddSeconds(60)
        while (-not (Test-Path -LiteralPath $packagedResultPath -PathType Leaf) -and -not $process.HasExited -and [DateTimeOffset]::UtcNow -lt $deadline) {
            Start-Sleep -Milliseconds 100
        }
        if (-not (Test-Path -LiteralPath $packagedResultPath -PathType Leaf)) {
            if (-not $process.HasExited) {
                $process.Kill($true)
                $process.WaitForExit()
            }
            $packagedStdout = $process.StandardOutput.ReadToEnd()
            $packagedStderr = $process.StandardError.ReadToEnd()
            throw "Packaged probe did not produce a result within 60 seconds. stdout=$packagedStdout stderr=$packagedStderr"
        }
        $launcherExitedNaturally = $process.WaitForExit(5000)
        if (-not $launcherExitedNaturally) {
            $process.Kill($true)
            $process.WaitForExit()
        }
        $packagedStdout = $process.StandardOutput.ReadToEnd()
        $packagedStderr = $process.StandardError.ReadToEnd()
        if ($launcherExitedNaturally -and $process.ExitCode -ne 0) {
            throw "Packaged launcher failed with exit code $($process.ExitCode). stdout=$packagedStdout stderr=$packagedStderr"
        }

        $sourceResult = Get-Content -LiteralPath $sourceResultPath -Raw | ConvertFrom-Json
        $packagedResult = Get-Content -LiteralPath $packagedResultPath -Raw | ConvertFrom-Json
        $launcherHash = (Get-FileHash -LiteralPath $launcherPath -Algorithm SHA256).Hash.ToLowerInvariant()
        $windows = Get-CimInstance -ClassName Win32_OperatingSystem
        $result = [ordered]@{
            status = if ($sourceResult.status -eq 'pass' -and $packagedResult.status -eq 'pass' -and -not $runnerElevated) { 'pass' } else { 'fail' }
            timestamp = [DateTimeOffset]::UtcNow.ToString('o')
            environment = [ordered]@{
                windowsCaption = $windows.Caption
                windowsVersion = $windows.Version
                windowsBuild = $windows.BuildNumber
                architecture = $env:PROCESSOR_ARCHITECTURE
                runnerElevated = $runnerElevated
                bun = (& $bun --version).Trim()
                node = (& $node --version).Trim()
                npm = (& $npm --version).Trim()
                electrobun = '1.18.1'
                packagingWorkaround = 'Process-only PSExecutionPolicyPreference=Bypass for ElectroBun Compress-Archive'
            }
            packagedArtifact = [ordered]@{
                launcher = 'build/dev-win-x64/AgentMindStudioTG001Probe-dev/bin/launcher.exe'
                sha256 = $launcherHash
                exitCode = $process.ExitCode
                exitedNaturally = $launcherExitedNaturally
                stableInstallerBuilt = $true
            }
            source = $sourceResult
            packaged = $packagedResult
        }
        $json = $result | ConvertTo-Json -Depth 12
        if ($resolvedEvidencePath) {
            $evidenceDirectory = Split-Path -Parent $resolvedEvidencePath
            if (-not (Test-Path -LiteralPath $evidenceDirectory -PathType Container)) {
                New-Item -ItemType Directory -Path $evidenceDirectory | Out-Null
            }
            [System.IO.File]::WriteAllText($resolvedEvidencePath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
        }
        $json
        if ($result.status -ne 'pass') {
            exit 1
        }
    }
    finally {
        Pop-Location
        Remove-Item Env:AMS_TG001_MODE -ErrorAction SilentlyContinue
        Remove-Item Env:AMS_TG001_OUTPUT -ErrorAction SilentlyContinue
    }
}
finally {
    if (-not $KeepTemp -and (Test-Path -LiteralPath $runRoot)) {
        Assert-VerifiedTempChild $runRoot
        Remove-Item -LiteralPath $runRoot -Recurse -Force
    }
    elseif ($KeepTemp) {
        Write-Host "Kept disposable run root: $runRoot"
    }
}
