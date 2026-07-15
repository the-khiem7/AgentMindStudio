param(
    [string]$EvidencePath = 'fixtures/clients/verification-results.json'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$fixtureRoot = (Resolve-Path $PSScriptRoot).Path
$matrixPath = Join-Path $repoRoot 'docs/spikes/client-surface-config/surface-artifact-matrix.json'
$errors = [System.Collections.Generic.List[string]]::new()

function Add-Error([string]$Message) { $errors.Add($Message) }

$matrix = Get-Content -LiteralPath $matrixPath -Raw | ConvertFrom-Json -Depth 20
$manifests = @(Get-ChildItem -LiteralPath $fixtureRoot -Filter manifest.json -Recurse -File)
$manifestKeys = @{}

foreach ($manifestFile in $manifests) {
    try {
        $manifest = Get-Content -LiteralPath $manifestFile.FullName -Raw | ConvertFrom-Json -Depth 20
    } catch {
        Add-Error "invalid manifest JSON: $($manifestFile.FullName)"
        continue
    }

    foreach ($field in 'schemaVersion','surface','artifact','provenanceCategory','sanitizationDate','sourceVersion','expectedNormalizedOutput','cases') {
        if ($null -eq $manifest.$field) { Add-Error "missing $field in $($manifestFile.FullName)" }
    }

    $key = "$($manifest.surface)|$($manifest.artifact)"
    if ($manifestKeys.ContainsKey($key)) { Add-Error "duplicate manifest key $key" }
    $manifestKeys[$key] = $manifestFile.FullName

    $states = @($manifest.cases | ForEach-Object { $_.expectedParseState })
    if (-not ($states | Where-Object { $_ -in @('valid','empty','partial') })) {
        Add-Error "no positive case in $key"
    }
    if ('malformed' -notin $states) { Add-Error "no malformed/failure case in $key" }

    $allScenarios = @($manifest.cases | ForEach-Object { @($_.scenarios) })
    foreach ($case in $manifest.cases) {
        $casePath = Join-Path $manifestFile.DirectoryName $case.path
        if (-not (Test-Path -LiteralPath $casePath)) { Add-Error "missing case path $($case.path) in $key" }
    }

    $expectedPath = Join-Path $manifestFile.DirectoryName $manifest.expectedNormalizedOutput
    if (-not (Test-Path -LiteralPath $expectedPath)) {
        Add-Error "missing expected normalized output in $key"
    } else {
        try { Get-Content -LiteralPath $expectedPath -Raw | ConvertFrom-Json -Depth 30 | Out-Null }
        catch { Add-Error "invalid expected normalized JSON in $key" }
    }

    if ($manifest.artifact -eq 'mcp') {
        $required = @('empty-minimal','representative-valid','malformed','unknown-field','name-collision','linked-alias','credential-binding-difference')
        if ($manifest.formatSupportsComments) { $required += 'comments-preservation' }
        foreach ($scenario in $required) {
            if ($scenario -notin $allScenarios) { Add-Error "missing MCP scenario $scenario in $key" }
        }
    }

    foreach ($variant in @($manifest.requiredActivationVariants | Where-Object { $_ })) {
        if ($variant -notin $allScenarios) { Add-Error "missing activation variant $variant in $key" }
    }
}

foreach ($row in @($matrix.rows | Where-Object { $_.read -eq 'supported' })) {
    $key = "$($row.surface)|$($row.artifact)"
    if (-not $manifestKeys.ContainsKey($key)) { Add-Error "matrix read capability has no fixture manifest: $key" }
}

$secretPatterns = @(
    '(?i)\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b',
    '(?i)\bsk-[A-Za-z0-9]{20,}\b',
    '\bAKIA[0-9A-Z]{16}\b',
    '(?i)\bBearer\s+(?!<REDACTED>)[A-Za-z0-9._~+/-]{12,}',
    '(?i)\b(?:REAL_SECRET|ACTUAL_TOKEN|PRIVATE_KEY_BYTES)\b'
)
$scanFiles = @(Get-ChildItem -LiteralPath $fixtureRoot -Recurse -File |
    Where-Object {
        $_.FullName -ne (Join-Path $repoRoot $EvidencePath) -and
        $_.FullName -ne $PSCommandPath
    })
$secretHits = [System.Collections.Generic.List[string]]::new()
foreach ($file in $scanFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    foreach ($pattern in $secretPatterns) {
        if ($content -match $pattern) {
            $relative = [IO.Path]::GetRelativePath($repoRoot, $file.FullName).Replace('\','/')
            $secretHits.Add("$relative matched $pattern")
        }
    }
}
foreach ($hit in $secretHits) { Add-Error "secret scan: $hit" }

$result = [ordered]@{
    schemaVersion = 1
    checkedAt = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
    status = if ($errors.Count -eq 0) { 'pass' } else { 'fail' }
    checks = [ordered]@{
        matrixReadRows = @($matrix.rows | Where-Object { $_.read -eq 'supported' }).Count
        manifests = $manifests.Count
        positiveAndFailureCases = $errors.Count -eq 0
        expectedNormalizedOutputs = $errors.Count -eq 0
        scenarioCoverage = $errors.Count -eq 0
        secretScanFiles = $scanFiles.Count
        secretHits = $secretHits.Count
    }
    errors = @($errors)
}

$evidenceAbsolute = Join-Path $repoRoot $EvidencePath
$evidenceParent = Split-Path -Parent $evidenceAbsolute
New-Item -ItemType Directory -Force -Path $evidenceParent | Out-Null
$result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $evidenceAbsolute -Encoding utf8
$result | ConvertTo-Json -Depth 10

if ($errors.Count -gt 0) { exit 1 }
