[CmdletBinding()]
param(
    [string]$EvidencePath,
    [switch]$KeepTemp
)

$ErrorActionPreference = 'Stop'
$invocationRoot = (Get-Location).Path
$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$runRoot = Join-Path $tempBase ("AgentMindStudio TG002 contract " + [guid]::NewGuid().ToString('N'))
$buildRoot = Join-Path $runRoot 'build'
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
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    $npx = (Get-Command npx.cmd -ErrorAction Stop).Source
    New-Item -ItemType Directory -Path $buildRoot | Out-Null

    $tsconfig = Join-Path $PSScriptRoot 'tsconfig.json'
    & $npx --no-install tsc --project $tsconfig --outDir $buildRoot
    Assert-ExitCode 'strict TypeScript compilation'

    $proofJson = & $node (Join-Path $buildRoot 'verify.js')
    Assert-ExitCode 'adapter contract proof'
    $proof = $proofJson | ConvertFrom-Json
    if ($proof.status -ne 'pass') {
        throw 'Adapter contract proof did not report pass.'
    }

    $typescriptVersion = (& $npx --no-install tsc --version).Trim()
    Assert-ExitCode 'TypeScript version detection'
    $result = [ordered]@{
        status = 'pass'
        timestamp = [DateTimeOffset]::UtcNow.ToString('o')
        environment = [ordered]@{
            windows = [Environment]::OSVersion.VersionString
            architecture = $env:PROCESSOR_ARCHITECTURE
            node = (& $node --version).Trim()
            typescript = $typescriptVersion
        }
        compile = [ordered]@{
            strict = $true
            exactOptionalPropertyTypes = $true
            noUncheckedIndexedAccess = $true
        }
        proof = $proof
        limitations = @(
            'Proof adapters use synthetic pre-parsed shapes and do not pass TG-003 source verification.',
            'Proof preservation claims are contract-validation fixtures, not production TG-004 round-trip evidence.',
            'TypeScript cannot prevent ambient side effects; purity remains a review and test invariant.'
        )
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
