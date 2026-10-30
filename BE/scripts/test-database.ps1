$ErrorActionPreference = 'Stop'
$beDirectory = Split-Path -Parent $PSScriptRoot
$previousTestDatabase = $env:ANIMEWEB_TEST_DATABASE
Push-Location -LiteralPath $beDirectory
try {
    docker compose -f compose.test.yaml up -d --wait
    if ($LASTEXITCODE -ne 0) { throw 'The isolated PostgreSQL test container did not start.' }
    $env:ANIMEWEB_TEST_DATABASE = 'Host=127.0.0.1;Port=54330;Database=animeweb_test;Username=animeweb_test;Password=animeweb_test_only;Timeout=5'
    dotnet test AnimeWeb.slnx --filter 'Category=PostgreSQL'
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL integration tests failed.' }
}
finally {
    $env:ANIMEWEB_TEST_DATABASE = $previousTestDatabase
    docker compose -f compose.test.yaml stop
    Pop-Location
}
