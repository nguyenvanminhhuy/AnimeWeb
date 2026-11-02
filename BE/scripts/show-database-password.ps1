# Run explicitly in your own terminal to view the generated development DB password for DBeaver.
$ErrorActionPreference = 'Stop'
$passwordPath = Join-Path (Split-Path -Parent $PSScriptRoot) '.local/docker-password.dpapi'
if (!(Test-Path -LiteralPath $passwordPath)) {
    throw 'No generated password exists. Use the password you supplied through ANIMEWEB_DB_PASSWORD.'
}
$securePassword = (Get-Content -LiteralPath $passwordPath -Raw).Trim() | ConvertTo-SecureString
(New-Object System.Net.NetworkCredential('', $securePassword)).Password
