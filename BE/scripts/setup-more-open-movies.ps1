[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$beDirectory = Split-Path -Parent $PSScriptRoot
$projectDirectory = Split-Path -Parent $beDirectory
$mediaDirectory = Join-Path $projectDirectory 'FE/public/media/open-movies'
$cacheDirectory = Join-Path $beDirectory '.local/open-movies'
$movies = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'more-open-movies.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$previousOutputEncoding = $OutputEncoding
try {
    & docker exec animeweb-be-postgres-1 pg_isready -U animeweb_dev -d animeweb_dev
    if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop and the development database with dotnet run first.' }
    New-Item -ItemType Directory -Path $mediaDirectory, $cacheDirectory -Force | Out-Null
    foreach ($movie in $movies) {
        if ($movie.slug -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$' -or $movie.key -notmatch '^[a-z0-9_]+$') {
            throw 'Invalid movie identifier.'
        }
        $posterPath = Join-Path $projectDirectory ('FE/public/images/' + $movie.slug + '-poster.png')
        if (-not (Test-Path -LiteralPath $posterPath)) { throw "Missing poster: $posterPath" }
        $moviePath = Join-Path $mediaDirectory ($movie.slug + '.mp4')
        if (-not (Test-Path -LiteralPath $moviePath)) {
            $partialPath = $moviePath + '.download'
            & curl.exe -fL --retry 2 --max-time 240 --silent --show-error -o $partialPath $movie.source
            if ($LASTEXITCODE -ne 0) { throw "Download failed: $($movie.title). No database changes made." }
            if ((Get-Item -LiteralPath $partialPath).Length -ne $movie.bytes -or
                (Get-FileHash -LiteralPath $partialPath -Algorithm SHA1).Hash.ToLowerInvariant() -ne $movie.sha1) {
                throw "Downloaded movie checksum mismatch: $($movie.title). No database changes made."
            }
            Move-Item -LiteralPath $partialPath -Destination $moviePath
        }
        if ((Get-Item -LiteralPath $moviePath).Length -ne $movie.bytes -or
            (Get-FileHash -LiteralPath $moviePath -Algorithm SHA1).Hash.ToLowerInvariant() -ne $movie.sha1) {
            throw "Existing movie checksum mismatch: $($movie.title). No database changes made."
        }
    }
    $json = ConvertTo-Json -InputObject @($movies) -Depth 5 -Compress
    $delimiter = '$movies_' + [Guid]::NewGuid().ToString('N') + '$'
    if ($json.Contains($delimiter)) { throw 'Unexpected SQL delimiter in metadata.' }
    $sql = (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'seed-more-open-movies.sql') -Raw -Encoding UTF8).
        Replace('__MOVIES_JSON__', ($delimiter + $json + $delimiter))
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $sql | & docker exec -i animeweb-be-postgres-1 psql -U animeweb_dev -d animeweb_dev -v ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw 'Movie setup failed; SQL transaction rolled back.' }
    foreach ($movie in $movies) {
        $moviePath = Join-Path $mediaDirectory ($movie.slug + '.mp4')
        @{
            metadata = $movie
            sha256 = (Get-FileHash -LiteralPath $moviePath -Algorithm SHA256).Hash.ToLowerInvariant()
            setupAt = [DateTime]::UtcNow.ToString('o')
        } | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $cacheDirectory ($movie.slug + '-provenance.json')) -Encoding UTF8
        Write-Host "Ready: http://127.0.0.1:5173/watch/episode_open_$($movie.key)"
    }
}
finally { $OutputEncoding = $previousOutputEncoding }
