[CmdletBinding()]
param([switch]$Check)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$workspaceDirectory = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
if (!(Test-Path -LiteralPath (Join-Path $workspaceDirectory 'pnpm-workspace.yaml'))) { throw 'Run this project inside the SRC pnpm workspace.' }
Push-Location -LiteralPath $workspaceDirectory
try {
    if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js >=22.13 before running FE setup.' }
    $nodeVersion = & node --version
    if ($LASTEXITCODE -ne 0 -or [version]($nodeVersion.TrimStart('v')) -lt [version]'22.13.0') { throw 'Node.js >=22.13 is required.' }
    if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) { throw 'Install/activate pnpm@11.10.0 before running FE setup.' }
    $pnpmVersion = & pnpm --version
    if ($LASTEXITCODE -ne 0 -or $pnpmVersion.Trim() -ne '11.10.0') { throw 'Use pnpm@11.10.0 as required by this workspace.' }
    if ($Check) {
        Write-Host 'FE prerequisites found. No dependencies were installed.'
        return
    }
    & pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw 'pnpm install failed; no alternative lockfile was created.' }
    Write-Host 'FE setup complete. Run pnpm run dev from Anime-Web/FE (or .\start.ps1 for port 5173).'
    Write-Host 'FE uses BE at http://localhost:5200 through the /api proxy. Start BE before using the UI. VITE_API_MODE=mock opts into the separate dev demo.'
}
finally { Pop-Location }
