[CmdletBinding()]
param(
    [ValidateSet('127.0.0.1', 'localhost', '::1')][string]$DbHost = '127.0.0.1',
    [ValidateRange(1, 65535)][int]$DbPort = 5432,
    [ValidatePattern('^[a-z][a-z0-9_]{0,62}$')][string]$DbName = 'animeweb_dev',
    [string]$DbUser = 'postgres',
    [string]$PgBin,
    [switch]$SeedDemo,
    [switch]$Check
)

. (Join-Path $PSScriptRoot 'scripts/native-common.ps1')
Push-Location -LiteralPath $PSScriptRoot
$environmentChanged = $false
try {
    if (!(Get-Command dotnet -ErrorAction SilentlyContinue)) { throw 'Install the .NET SDK required by BE/global.json.' }
    Invoke-SetupCommand 'dotnet' @('--version')
    $postgresBin = Find-PostgresBin $PgBin
    $psqlPath = Join-Path $postgresBin 'psql.exe'
    $createdbPath = Join-Path $postgresBin 'createdb.exe'
    if (!(Test-Path -LiteralPath $createdbPath)) { throw 'PostgreSQL command line tools must include createdb.exe.' }
    Invoke-SetupCommand $psqlPath @('--version')
    $settings = [pscustomobject]@{ host = $DbHost; port = $DbPort; database = $DbName; username = $DbUser }
    Assert-NativeDatabaseSettings $settings
    if ($Check) {
        Write-Host 'Prerequisites found. Check mode does not connect, create databases, migrate or save settings.'
        return
    }
    Write-Host "Using local PostgreSQL ${DbHost}:${DbPort}, database $DbName, user $DbUser. No Docker."
    $databasePassword = Get-NativeDatabasePassword
    $previousPgPassword = $env:PGPASSWORD
    $previousPgTimeout = $env:PGCONNECT_TIMEOUT
    $previousConnection = $env:ConnectionStrings__AnimeWeb
    $environmentChanged = $true
    $env:PGPASSWORD = $databasePassword
    $env:PGCONNECT_TIMEOUT = '5'
    $connectionArgs = @('-X', '--no-password', '--host', $DbHost, '--port', [string]$DbPort, '--username', $DbUser)
    $exists = & $psqlPath @connectionArgs '--dbname' 'postgres' '--set' 'ON_ERROR_STOP=1' '--tuples-only' '--no-align' '--command' "SELECT 1 FROM pg_database WHERE datname = '$DbName';"
    if ($LASTEXITCODE -ne 0) {
        throw 'Cannot connect to local PostgreSQL. Start its Windows service and check host/port/username/password. DBeaver can test the same connection.'
    }
    if (($exists -join '').Trim() -ne '1') {
        Invoke-SetupCommand $createdbPath @('--no-password', '--host', $DbHost, '--port', [string]$DbPort, '--username', $DbUser, '--maintenance-db', 'postgres', $DbName)
    }
    $env:ConnectionStrings__AnimeWeb = New-NativeConnectionString $settings $databasePassword
    Invoke-SetupCommand 'dotnet' @('restore', 'AnimeWeb.slnx', '--locked-mode')
    Invoke-SetupCommand 'dotnet' @('tool', 'restore')
    Write-Host 'Applying migrations to the selected local development database.'
    Invoke-SetupCommand 'dotnet' @('ef', 'database', 'update', '--project', 'src/AnimeWeb.Api', '--startup-project', 'src/AnimeWeb.Api')
    if ($SeedDemo) {
        Invoke-SetupCommand 'dotnet' @('run', '--project', 'src/AnimeWeb.Api/AnimeWeb.Api.csproj', '--launch-profile', 'http', '--', '--seed-demo')
    }
    $localDirectory = Join-Path $PSScriptRoot '.local'
    New-Item -ItemType Directory -Path $localDirectory -Force | Out-Null
    $settings | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $localDirectory 'native-settings.json') -Encoding UTF8
    Write-Host 'Setup complete. Only host/port/database/username were saved locally. Run .\start.ps1 to start the API.'
}
finally {
    if ($environmentChanged) {
        $env:PGPASSWORD = $previousPgPassword
        $env:PGCONNECT_TIMEOUT = $previousPgTimeout
        $env:ConnectionStrings__AnimeWeb = $previousConnection
    }
    $databasePassword = $null
    Pop-Location
}
