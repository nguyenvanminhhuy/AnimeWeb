Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-SetupCommand {
    param([string]$Command, [string[]]$CommandArguments)
    & $Command @CommandArguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed (exit $LASTEXITCODE)." }
}

function Find-PostgresBin {
    param([string]$PreferredPath)
    if ($PreferredPath) {
        $resolved = (Resolve-Path -LiteralPath $PreferredPath).Path
        if (Test-Path -LiteralPath (Join-Path $resolved 'psql.exe')) { return $resolved }
        throw 'PgBin must contain psql.exe and createdb.exe.'
    }
    $psql = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($psql) { return Split-Path -Parent $psql.Source }
    $installRoot = Join-Path $env:ProgramFiles 'PostgreSQL'
    if (Test-Path -LiteralPath $installRoot) {
        $versions = Get-ChildItem -LiteralPath $installRoot -Directory |
            Where-Object { $_.Name -match '^\d+$' } |
            Sort-Object { [int]$_.Name } -Descending
        foreach ($version in $versions) {
            $candidate = Join-Path $version.FullName 'bin'
            if (Test-Path -LiteralPath (Join-Path $candidate 'psql.exe')) { return $candidate }
        }
    }
    throw 'Install PostgreSQL 18 for Windows (server + command line tools): https://www.postgresql.org/download/windows/ . Then rerun setup.ps1, or pass -PgBin with its bin folder. Docker is not used.'
}

function Assert-NativeDatabaseSettings {
    param($Settings)
    if ($Settings.host -notin @('127.0.0.1', 'localhost', '::1')) {
        throw 'These scripts only support a local PostgreSQL server.'
    }
    if ($Settings.port -lt 1 -or $Settings.port -gt 65535) { throw 'Invalid PostgreSQL port.' }
    if ($Settings.database -notmatch '^[a-z][a-z0-9_]{0,62}$') {
        throw 'Database name must use lowercase letters, numbers and underscores (max 63 characters).'
    }
    if ($Settings.database -in @('postgres', 'template0', 'template1')) {
        throw 'Choose an application database, not a PostgreSQL maintenance/template database.'
    }
    if ([string]::IsNullOrWhiteSpace($Settings.username)) { throw 'PostgreSQL username is required.' }
}

function Get-NativeDatabasePassword {
    if ($env:ANIMEWEB_DB_PASSWORD) { return $env:ANIMEWEB_DB_PASSWORD }
    $secret = Read-Host 'PostgreSQL password (not saved)' -AsSecureString
    return (New-Object System.Net.NetworkCredential('', $secret)).Password
}

function New-NativeConnectionString {
    param($Settings, [string]$DatabasePassword)
    $builder = New-Object System.Data.Common.DbConnectionStringBuilder
    $builder['Host'] = $Settings.host
    $builder['Port'] = [string]$Settings.port
    $builder['Database'] = $Settings.database
    $builder['Username'] = $Settings.username
    $builder['Password'] = $DatabasePassword
    return $builder.ConnectionString
}

function Read-NativeDatabaseSettings {
    param([string]$BeDirectory)
    $settingsPath = Join-Path $BeDirectory '.local/native-settings.json'
    if (!(Test-Path -LiteralPath $settingsPath)) { throw 'Run BE/setup.ps1 first.' }
    $settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
    Assert-NativeDatabaseSettings $settings
    return $settings
}
