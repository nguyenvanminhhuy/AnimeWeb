# Isolated Windows credential-helper test. Docker is replaced by a function; no real volume is touched.
$ErrorActionPreference = 'Stop'
$beDirectory = Split-Path -Parent $PSScriptRoot
$testRoot = Join-Path $beDirectory ('.local/password-tests-' + [guid]::NewGuid().ToString('N'))
$env:ANIMEWEB_DB_PASSWORD = ''
$global:fakeVolumeExists = $true
function docker {
    $global:LASTEXITCODE = 0
    if ($args[0] -eq 'volume' -and $global:fakeVolumeExists) { 'animeweb-be_postgres-dev' }
}
try {
    $scriptsDirectory = Join-Path $testRoot 'scripts'
    New-Item -ItemType Directory -Path $scriptsDirectory -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'docker-password.ps1') -Destination $scriptsDirectory
    . (Join-Path $scriptsDirectory 'docker-password.ps1')
    $rejected = $false
    try { $null = Get-DockerDevelopmentPassword } catch { $rejected = $true }
    if (!$rejected) { throw 'Existing database without credentials was not rejected.' }
    $global:fakeVolumeExists = $false
    $first = Get-DockerDevelopmentPassword
    $passwordPath = Join-Path $testRoot '.local/docker-password.dpapi'
    if ($first.Length -lt 32 -or !(Test-Path -LiteralPath $passwordPath)) { throw 'Password generation failed.' }
    if ((Get-Content -LiteralPath $passwordPath -Raw).Contains($first)) { throw 'Password persisted in plaintext.' }
    $global:fakeVolumeExists = $true
    if ((Get-DockerDevelopmentPassword) -ne $first) { throw 'DPAPI reload changed password.' }
    $env:ANIMEWEB_DB_PASSWORD = 'fake-explicit-password'
    if ((Get-DockerDevelopmentPassword) -ne 'fake-explicit-password') { throw 'Explicit environment password ignored.' }
    Write-Output 'PASS Docker password helper: preserves existing volumes, generates random password for new DB, DPAPI roundtrip/no plaintext and explicit environment override. No Docker calls.'
}
finally {
    $resolved = [IO.Path]::GetFullPath($testRoot)
    $allowed = [IO.Path]::GetFullPath((Join-Path $beDirectory '.local')) + [IO.Path]::DirectorySeparatorChar
    if (!$resolved.StartsWith($allowed, [StringComparison]::OrdinalIgnoreCase)) { throw 'Refusing cleanup outside test workspace.' }
    if (Test-Path -LiteralPath $resolved) { Remove-Item -LiteralPath $resolved -Recurse -Force }
}
