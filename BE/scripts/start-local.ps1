param([switch]$InitializeCatalog)

$ErrorActionPreference = 'Stop'
& docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop, wait until its engine is ready, then run dotnet run again.' }
. (Join-Path $PSScriptRoot 'docker-password.ps1')
$previousDatabasePassword = $env:ANIMEWEB_DB_PASSWORD
$env:ANIMEWEB_DB_PASSWORD = Get-DockerDevelopmentPassword
$beDirectory = Split-Path -Parent $PSScriptRoot
$previousConnectionString = $env:ConnectionStrings__AnimeWeb
Push-Location -LiteralPath $beDirectory
try {
    docker compose -f compose.yaml up -d --wait
    if ($LASTEXITCODE -ne 0) { throw 'The local PostgreSQL container did not start.' }
    $connection = New-Object System.Data.Common.DbConnectionStringBuilder
    $connection['Host'] = '127.0.0.1'
    $connection['Port'] = '54329'
    $connection['Database'] = 'animeweb_dev'
    $connection['Username'] = 'animeweb_dev'
    $connection['Password'] = $env:ANIMEWEB_DB_PASSWORD
    $env:ConnectionStrings__AnimeWeb = $connection.ConnectionString
    if ($InitializeCatalog) {
        dotnet tool restore
        if ($LASTEXITCODE -ne 0) { throw 'Could not restore local EF tools.' }
        dotnet ef database update --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api
        if ($LASTEXITCODE -ne 0) { throw 'Could not apply migrations to the local development database.' }
        dotnet run --project src/AnimeWeb.Api/AnimeWeb.Api.csproj --launch-profile http -- --seed-demo
        if ($LASTEXITCODE -ne 0) { throw 'Could not initialize the demo catalog.' }
    }
    dotnet run --project src/AnimeWeb.Api/AnimeWeb.Api.csproj --launch-profile http
    if ($LASTEXITCODE -ne 0) { throw 'The API exited with an error.' }
}
finally {
    $env:ANIMEWEB_DB_PASSWORD = $previousDatabasePassword
    $env:ConnectionStrings__AnimeWeb = $previousConnectionString
    Pop-Location
}
