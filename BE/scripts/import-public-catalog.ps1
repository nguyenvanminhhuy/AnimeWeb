[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$beDirectory = Split-Path -Parent $PSScriptRoot
$importDirectory = Join-Path $beDirectory '.local/imports'
$snapshotPath = Join-Path $importDirectory 'anime-offline-database-2026-27.json'
$snapshotUrl = 'https://github.com/manami-project/anime-offline-database/releases/download/2026-27/anime-offline-database-minified.json'
$expectedHash = '395be786fb2f98f1fca9e963911b9332110098a080e7e2569902bbc5641d1a41'
$previousPassword = $env:ANIMEWEB_DB_PASSWORD
$previousConnection = $env:ConnectionStrings__AnimeWeb
$previousEnvironment = $env:ASPNETCORE_ENVIRONMENT
Push-Location -LiteralPath $beDirectory
try {
    & docker info --format '{{.ServerVersion}}' *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop first.' }
    & docker exec animeweb-be-postgres-1 pg_isready -U animeweb_dev -d animeweb_dev
    if ($LASTEXITCODE -ne 0) { throw 'Start the development database with dotnet run before importing.' }
    New-Item -ItemType Directory -Path $importDirectory -Force | Out-Null
    if (-not (Test-Path -LiteralPath $snapshotPath)) {
        & curl.exe -fL --retry 2 --max-time 180 --silent --show-error -o $snapshotPath $snapshotUrl
        if ($LASTEXITCODE -ne 0) { throw 'Snapshot download failed. Remove the incomplete file in BE/.local/imports before retrying.' }
    }
    if ((Get-FileHash -LiteralPath $snapshotPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) {
        throw 'Snapshot SHA256 does not match release 2026-27. No database changes made.'
    }
    . (Join-Path $PSScriptRoot 'docker-password.ps1')
    $env:ANIMEWEB_DB_PASSWORD = Get-DockerDevelopmentPassword
    $connection = New-Object System.Data.Common.DbConnectionStringBuilder
    $connection['Host'] = '127.0.0.1'
    $connection['Port'] = '54329'
    $connection['Database'] = 'animeweb_dev'
    $connection['Username'] = 'animeweb_dev'
    $connection['Password'] = $env:ANIMEWEB_DB_PASSWORD
    $env:ConnectionStrings__AnimeWeb = $connection.ConnectionString
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    # Separate output allows importing while the normal API is running on Windows.
    $outputDirectory = Join-Path $importDirectory 'runner'
    & dotnet build src/AnimeWeb.Api/AnimeWeb.Api.csproj --output $outputDirectory
    if ($LASTEXITCODE -ne 0) { throw 'Could not build the catalog importer.' }
    & dotnet (Join-Path $outputDirectory 'AnimeWeb.Api.dll') --import-public-catalog $snapshotPath
    if ($LASTEXITCODE -ne 0) { throw 'Catalog import failed.' }
    @{
        source = $snapshotUrl
        repository = 'https://github.com/manami-project/anime-offline-database'
        release = '2026-27'
        sha256 = $expectedHash
        license = 'ODbL-1.0 + DbCL-1.0'
        licenseUrl = 'https://github.com/manami-project/anime-offline-database/blob/2026-27/LICENSE'
        selectedLimit = 100
        importedAt = [DateTime]::UtcNow.ToString('o')
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $importDirectory 'provenance.json') -Encoding UTF8
}
finally {
    $env:ANIMEWEB_DB_PASSWORD = $previousPassword
    $env:ConnectionStrings__AnimeWeb = $previousConnection
    $env:ASPNETCORE_ENVIRONMENT = $previousEnvironment
    Pop-Location
}
