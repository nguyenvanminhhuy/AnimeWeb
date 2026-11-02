[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$beDirectory = Split-Path -Parent $PSScriptRoot
$projectDirectory = Split-Path -Parent $beDirectory
$cacheDirectory = Join-Path $beDirectory '.local/open-movies'
$mediaDirectory = Join-Path $projectDirectory 'FE/public/media/open-movies'
$archivePath = Join-Path $cacheDirectory 'BigBuckBunny_320x180.mp4.zip'
$moviePath = Join-Path $mediaDirectory 'big-buck-bunny.mp4'
$downloadUrl = 'https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4.zip'
$previousOutputEncoding = $OutputEncoding
try {
    & docker exec animeweb-be-postgres-1 pg_isready -U animeweb_dev -d animeweb_dev
    if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop and the development database with dotnet run first.' }
    New-Item -ItemType Directory -Path $cacheDirectory, $mediaDirectory -Force | Out-Null
    if (-not (Test-Path -LiteralPath $archivePath)) {
        & curl.exe -fL --retry 2 --max-time 180 --silent --show-error -o $archivePath $downloadUrl
        if ($LASTEXITCODE -ne 0) { throw 'Movie download failed. Remove the incomplete ZIP in BE/.local/open-movies before retrying.' }
    }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
    try {
        $entries = @($archive.Entries | Where-Object { $_.Name -ceq 'BigBuckBunny_320x180.mp4' })
        if ($entries.Count -ne 1 -or $entries[0].Length -lt 1000000 -or $entries[0].Length -gt 200000000) {
            throw 'Unexpected movie archive. No database changes made.'
        }
        if (-not (Test-Path -LiteralPath $moviePath)) {
            # Extract only this entry to a fixed path; do not extract arbitrary ZIP paths.
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entries[0], $moviePath, $false)
        }
        if ((Get-Item -LiteralPath $moviePath).Length -ne $entries[0].Length) {
            throw 'The local movie file is incomplete. Remove only that file and retry.'
        }
    }
    finally { $archive.Dispose() }
    # The SQL contains only the fixed open-movie catalog, never credentials or user records.
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    Get-Content -LiteralPath (Join-Path $PSScriptRoot 'seed-open-movie.sql') -Raw -Encoding UTF8 |
        & docker exec -i animeweb-be-postgres-1 psql -U animeweb_dev -d animeweb_dev -v ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw 'Could not insert the open movie; the transaction was rolled back.' }
    @{
        source = $downloadUrl
        creator = 'Blender Foundation'
        title = 'Big Buck Bunny (2008)'
        license = 'CC BY 3.0'
        licenseUrl = 'https://creativecommons.org/licenses/by/3.0/'
        attribution = '(c) copyright 2008, Blender Foundation / www.bigbuckbunny.org'
        sha256 = (Get-FileHash -LiteralPath $moviePath -Algorithm SHA256).Hash.ToLowerInvariant()
        playbackUrl = 'http://127.0.0.1:5173/media/open-movies/big-buck-bunny.mp4'
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $cacheDirectory 'provenance.json') -Encoding UTF8
    Write-Host 'Ready: http://127.0.0.1:5173/anime/big-buck-bunny'
    Write-Host 'Watch: http://127.0.0.1:5173/watch/episode_open_bbb'
}
finally { $OutputEncoding = $previousOutputEncoding }
