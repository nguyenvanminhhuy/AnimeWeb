function Get-DockerDevelopmentPassword {
    if ($env:ANIMEWEB_DB_PASSWORD) { return $env:ANIMEWEB_DB_PASSWORD }
    $localDirectory = Join-Path (Split-Path -Parent $PSScriptRoot) '.local'
    $passwordPath = Join-Path $localDirectory 'docker-password.dpapi'
    if (Test-Path -LiteralPath $passwordPath) {
        $securePassword = (Get-Content -LiteralPath $passwordPath -Raw).Trim() | ConvertTo-SecureString
        return (New-Object System.Net.NetworkCredential('', $securePassword)).Password
    }
    & docker info --format '{{.ServerVersion}}' *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop before starting BE.' }
    $volumes = & docker volume ls --format '{{.Name}}'
    if ($LASTEXITCODE -ne 0) { throw 'Cannot list Docker volumes.' }
    if (@($volumes) -contains 'animeweb-be_postgres-dev') {
        throw 'The development database already exists. Set ANIMEWEB_DB_PASSWORD to its existing password; it will not be reset.'
    }
    $bytes = New-Object byte[] 32
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($bytes) } finally { $random.Dispose() }
    $password = [Convert]::ToBase64String($bytes)
    $securePassword = ConvertTo-SecureString $password -AsPlainText -Force
    New-Item -ItemType Directory -Path $localDirectory -Force | Out-Null
    $securePassword | ConvertFrom-SecureString | Set-Content -LiteralPath $passwordPath -Encoding UTF8
    Write-Host 'Created a local database password, encrypted for this Windows account in BE/.local. It is not stored in source.'
    return $password
}
