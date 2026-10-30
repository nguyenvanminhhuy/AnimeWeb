$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($env:ANIMEWEB_DB_PASSWORD)) {
    throw 'Set ANIMEWEB_DB_PASSWORD before starting the local database.'
}
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
    dotnet run --project src/AnimeWeb.Api/AnimeWeb.Api.csproj --launch-profile http
    if ($LASTEXITCODE -ne 0) { throw 'The API exited with an error.' }
}
finally {
    $env:ConnectionStrings__AnimeWeb = $previousConnectionString
    Pop-Location
}
