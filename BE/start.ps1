[CmdletBinding()]
param()

. (Join-Path $PSScriptRoot 'scripts/native-common.ps1')
$settings = Read-NativeDatabaseSettings $PSScriptRoot
Push-Location -LiteralPath $PSScriptRoot
$previousConnection = $env:ConnectionStrings__AnimeWeb
try {
    $databasePassword = Get-NativeDatabasePassword
    $env:ConnectionStrings__AnimeWeb = New-NativeConnectionString $settings $databasePassword
    Write-Host "Starting BE at http://localhost:5200 using local PostgreSQL port $($settings.port). Ctrl+C stops BE; the database service stays running."
    Invoke-SetupCommand 'dotnet' @('run', '--project', 'src/AnimeWeb.Api/AnimeWeb.Api.csproj', '--launch-profile', 'http')
}
finally {
    $env:ConnectionStrings__AnimeWeb = $previousConnection
    $databasePassword = $null
    Pop-Location
}
