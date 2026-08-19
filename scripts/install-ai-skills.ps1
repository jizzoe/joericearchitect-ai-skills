#Requires -Version 5.1
<#
.SYNOPSIS
Install or update the canonical AI skills and their exact matching shared
runtime as one reviewed pair.

.DESCRIPTION
This entrypoint owns only host path, process, and quoting mechanics. Source
validation, gh invocation, runtime build, activation, retention, and the receipt
belong to the Node utilities it calls, so PowerShell and Bash assert the same
contract and emit the same receipt fields.

It never edits a profile script and never changes PATH. The receipt reports
whether the launcher is reachable and what to add if it is not.

Bootstrap: obtain this installer with `gh release download <tag>` followed by
`gh attestation verify` on the downloaded artifact.
#>
[CmdletBinding()]
param(
    [string] $Local,
    [string] $Remote,
    [string] $Pin,
    [string[]] $Agent,
    [switch] $Force,
    [switch] $DryRun,
    [switch] $AllowDirtySource
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Receipt {
    param([string] $Code, [string] $Phase = 'preflight', $Detail = $null)
    $receipt = [ordered]@{
        schemaVersion = 1
        tool          = 'install-ai-skills'
        ok            = $false
        phase         = $Phase
        code          = $Code
    }
    if ($null -ne $Detail) { $receipt.detail = $Detail }
    # Depth keeps nested detail objects intact rather than stringified.
    Write-Output ([pscustomobject]$receipt | ConvertTo-Json -Depth 6)
}

$repositoryRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

if (-not $Local -and -not $Remote) {
    Write-Receipt -Code 'source-required'
    exit 2
}
if ($Local -and $Remote) {
    Write-Receipt -Code 'source-mode-ambiguous'
    exit 2
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Receipt -Code 'node-unavailable'
    exit 1
}

$nodeMajor = [int](& node -p 'process.versions.node.split(".")[0]')
if ($nodeMajor -lt 20) {
    $active = & node -p 'process.versions.node'
    Write-Receipt -Code 'node-version-unsupported' -Detail ([ordered]@{ required = '>=20'; active = $active })
    exit 1
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Receipt -Code 'gh-unavailable'
    exit 1
}

# Every value crosses the boundary as a discrete argument, so a path containing
# spaces or quotes is never re-parsed by a shell.
$forwarded = [System.Collections.ArrayList]::new()
function Add-Argument {
    param([Parameter(Mandatory)][string[]] $Value)
    # ArrayList.Add returns an index; discarding it keeps the success stream
    # clean so only the receipt reaches stdout.
    foreach ($item in $Value) { [void] $forwarded.Add($item) }
}

if ($Local) { Add-Argument '--local', (Resolve-Path -LiteralPath $Local).Path }
if ($Remote) { Add-Argument '--remote', $Remote }
if ($Pin) { Add-Argument '--pin', $Pin }
foreach ($selected in ($Agent | Where-Object { $_ })) { Add-Argument '--agent', $selected }
if ($Force) { Add-Argument '--force' }
if ($DryRun) { Add-Argument '--dry-run' }
if ($AllowDirtySource) { Add-Argument '--allow-dirty-source' }

$workspace = Join-Path ([System.IO.Path]::GetTempPath()) ("ai-skills-install-" + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $workspace -Force | Out-Null
Add-Argument '--workspace', $workspace

try {
    # Splatting needs a plain array, and the receipt is captured and re-emitted
    # so it survives the script's exit rather than depending on stream timing.
    $argumentList = $forwarded.ToArray()
    $installer = Join-Path $repositoryRoot 'scripts/runtime/install-runtime.mjs'
    $output = & node $installer @argumentList
    $code = $LASTEXITCODE
    if ($null -ne $output) { $output | ForEach-Object { Write-Output $_ } }
    exit $code
}
finally {
    Remove-Item -LiteralPath $workspace -Recurse -Force -ErrorAction SilentlyContinue
}
