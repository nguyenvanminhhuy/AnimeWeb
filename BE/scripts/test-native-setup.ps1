# Runs copied setup scripts against fake executables. No PostgreSQL, API or secrets are used.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$beDirectory = Split-Path -Parent $PSScriptRoot
$testRoot = Join-Path $beDirectory ('.local/script-tests-' + [guid]::NewGuid().ToString('N'))
$testBe = Join-Path $testRoot 'workspace/Anime-Web/BE'
$testFe = Join-Path $testRoot 'workspace/Anime-Web/FE'
$fakeBin = Join-Path $testRoot 'fake bin'
$env:ANIMEWEB_DB_PASSWORD = 'fake-only;password="with quotes"'
$env:PGPASSWORD = 'previous-fake-password'
$env:PGCONNECT_TIMEOUT = '7'
$env:ConnectionStrings__AnimeWeb = 'previous-fake-connection'
$env:FAKE_CLI_LOG = Join-Path $testRoot 'commands.log'
$env:FAKE_DB_EXISTS = '0'
$env:FAKE_FAIL_STEP = ''
$env:FAKE_PNPM_VERSION = '11.10.0'
function Assert-Test([bool]$Condition, [string]$Label) {
    if (!$Condition) { throw "FAIL: $Label" }
}
function Read-TestLog { return Get-Content -LiteralPath $env:FAKE_CLI_LOG -Raw }
function Clear-TestLog { Set-Content -LiteralPath $env:FAKE_CLI_LOG -Value '' }
try {
    New-Item -ItemType Directory -Path $testBe, $testFe, $fakeBin, (Join-Path $testBe 'scripts') -Force | Out-Null
    foreach ($name in @('setup.ps1', 'start.ps1')) {
        Copy-Item -LiteralPath (Join-Path $beDirectory $name) -Destination $testBe
        Copy-Item -LiteralPath (Join-Path (Split-Path -Parent $beDirectory) "FE/$name") -Destination $testFe
    }
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'native-common.ps1') -Destination (Join-Path $testBe 'scripts')
    Set-Content -LiteralPath (Join-Path $testRoot 'workspace/pnpm-workspace.yaml') -Value 'packages: []'
    $fakeSource = @'
using System;
using System.IO;
public static class FakeCli {
    public static int Main(string[] args) {
        string name = Path.GetFileNameWithoutExtension(System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName);
        File.AppendAllText(Environment.GetEnvironmentVariable("FAKE_CLI_LOG"), name + "|" + Environment.CurrentDirectory + "|" + String.Join(" ", args) + "\n");
        string first = args.Length > 0 ? args[0] : "";
        if (Environment.GetEnvironmentVariable("FAKE_FAIL_STEP") == name + ":" + first) return 23;
        if (first == "--version") {
            Console.WriteLine(name == "node" ? "v22.13.0" : name == "pnpm" ? Environment.GetEnvironmentVariable("FAKE_PNPM_VERSION") : name == "dotnet" ? "10.0.403" : "psql (PostgreSQL) 18.6");
        } else if (name == "psql" && Environment.GetEnvironmentVariable("FAKE_DB_EXISTS") == "1") Console.WriteLine("1");
        return 0;
    }
}
'@
    $fakeExe = Join-Path $fakeBin 'psql.exe'
    Add-Type -TypeDefinition $fakeSource -OutputAssembly $fakeExe -OutputType ConsoleApplication
    foreach ($name in @('createdb', 'dotnet', 'pnpm', 'node')) {
        Copy-Item -LiteralPath $fakeExe -Destination (Join-Path $fakeBin "$name.exe")
    }
    $env:Path = $fakeBin + [IO.Path]::PathSeparator + $env:Path
    & (Join-Path $testBe 'setup.ps1') -PgBin $fakeBin -Check
    Assert-Test (!(Test-Path -LiteralPath (Join-Path $testBe '.local'))) 'Check mode wrote settings'
    Assert-Test (!(Read-TestLog).Contains('SELECT')) 'Check mode contacted database'
    Clear-TestLog
    & (Join-Path $testBe 'setup.ps1') -PgBin $fakeBin -SeedDemo
    $log = Read-TestLog
    Assert-Test ($log.Contains('createdb|') -and $log.Contains('restore AnimeWeb.slnx --locked-mode') -and $log.Contains('ef database update') -and $log.Contains('--seed-demo')) 'Missing setup step'
    Assert-Test (!$log.Contains($env:ANIMEWEB_DB_PASSWORD)) 'Password entered command arguments'
    $settingsPath = Join-Path $testBe '.local/native-settings.json'
    $settingsText = Get-Content -LiteralPath $settingsPath -Raw
    $settings = $settingsText | ConvertFrom-Json
    Assert-Test ($settings.port -eq 5432 -and $settings.database -eq 'animeweb_dev') 'Incorrect native defaults'
    Assert-Test (@($settings.PSObject.Properties).Count -eq 4 -and !$settingsText.Contains('password')) 'Settings persisted a secret'
    Assert-Test ($env:PGPASSWORD -eq 'previous-fake-password' -and $env:ConnectionStrings__AnimeWeb -eq 'previous-fake-connection') 'Environment not restored'
    . (Join-Path $testBe 'scripts/native-common.ps1')
    $roundtrip = New-Object System.Data.Common.DbConnectionStringBuilder
    $roundtrip.set_ConnectionString((New-NativeConnectionString $settings $env:ANIMEWEB_DB_PASSWORD))
    Assert-Test ($roundtrip['Password'] -eq $env:ANIMEWEB_DB_PASSWORD) 'Password escaping failed'
    $fakeSecret = ConvertTo-SecureString 'fake-masked-input' -AsPlainText -Force
    function Read-Host { param([string]$Prompt, [switch]$AsSecureString) return $fakeSecret }
    $env:ANIMEWEB_DB_PASSWORD = ''
    Assert-Test ((Get-NativeDatabasePassword) -eq 'fake-masked-input') 'Masked input conversion failed'
    $env:ANIMEWEB_DB_PASSWORD = 'fake-only;password="with quotes"'
    $rejected = $false
    try { Assert-NativeDatabaseSettings ([pscustomobject]@{ host = '127.0.0.1'; port = 5432; database = 'postgres'; username = 'postgres' }) } catch { $rejected = $true }
    Assert-Test $rejected 'Maintenance database accepted as migration target'
    Clear-TestLog
    & (Join-Path $testBe 'start.ps1')
    $log = Read-TestLog
    Assert-Test ($log.Contains('dotnet|') -and $log.Contains('--launch-profile http') -and !$log.Contains('ef database update')) 'Start ran setup/migrations'
    Clear-TestLog
    $env:FAKE_DB_EXISTS = '1'
    & (Join-Path $testBe 'setup.ps1') -PgBin $fakeBin
    $log = Read-TestLog
    Assert-Test (!$log.Contains('createdb|') -and !$log.Contains('--seed-demo')) 'Repeat setup recreated database or implicitly seeded'
    Clear-TestLog
    $env:FAKE_FAIL_STEP = 'psql:-X'
    $failed = $false
    try { & (Join-Path $testBe 'setup.ps1') -PgBin $fakeBin } catch { $failed = $true }
    Assert-Test ($failed -and !(Read-TestLog).Contains('ef database update')) 'Failed connection continued into migrations'
    Assert-Test ($env:PGPASSWORD -eq 'previous-fake-password' -and $env:PGCONNECT_TIMEOUT -eq '7') 'Failure leaked environment'
    Clear-TestLog
    $env:FAKE_FAIL_STEP = 'dotnet:ef'
    $failed = $false
    try { & (Join-Path $testBe 'setup.ps1') -PgBin $fakeBin -DbName 'other_dev' -SeedDemo } catch { $failed = $true }
    Assert-Test ($failed -and !(Read-TestLog).Contains('--seed-demo')) 'Failed migration continued into seed'
    Assert-Test ((Get-Content -LiteralPath $settingsPath -Raw) -eq $settingsText) 'Failed setup changed saved target'
    $env:FAKE_FAIL_STEP = ''
    Clear-TestLog
    & (Join-Path $testFe 'setup.ps1') -Check
    Assert-Test (!(Read-TestLog).Contains('install')) 'FE Check installed dependencies'
    & (Join-Path $testFe 'setup.ps1')
    Assert-Test ((Read-TestLog).Contains('workspace|install --frozen-lockfile')) 'FE install did not run at workspace root with frozen lockfile'
    & (Join-Path $testFe 'start.ps1') -Port 5178
    Assert-Test ((Read-TestLog).Contains('run dev --port 5178 --strictPort')) 'FE start arguments lost'
    Clear-TestLog
    $env:FAKE_PNPM_VERSION = '10.0.0'
    $failed = $false
    try { & (Join-Path $testFe 'setup.ps1') } catch { $failed = $true }
    Assert-Test ($failed -and !(Read-TestLog).Contains('install')) 'Wrong pnpm version allowed'
    Write-Output 'PASS native setup/start: check mode, new/existing DB, explicit seed, failures, password escaping/no persistence, environment restore, workspace frozen install and fixed FE port. Fake CLIs only; no database/API was contacted.'
}
finally {
    $resolvedTestRoot = [IO.Path]::GetFullPath($testRoot)
    $allowedRoot = [IO.Path]::GetFullPath((Join-Path $beDirectory '.local')) + [IO.Path]::DirectorySeparatorChar
    if (!$resolvedTestRoot.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Refusing cleanup outside the test workspace.' }
    if (Test-Path -LiteralPath $resolvedTestRoot) { Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force }
}
