[CmdletBinding()]
param([ValidateRange(1, 65535)][int]$Port = 5173)

$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $PSScriptRoot
try {
    & pnpm run dev --port $Port --strictPort
    if ($LASTEXITCODE -ne 0) { throw 'FE did not start. Run setup.ps1 first and check whether the port is already in use.' }
}
finally { Pop-Location }
