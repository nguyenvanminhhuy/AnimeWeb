using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using AnimeWeb.Api.Features.Anime;
using Microsoft.EntityFrameworkCore;
using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Infrastructure.Persistence.Seeding;

public static class PublicCatalogImporter
{
    public const string Repository = "https://github.com/manami-project/anime-offline-database";
    private static readonly Dictionary<string, string> GenreNames = new()
    {
        ["action"] = "Hành động",
        ["adventure"] = "Phiêu lưu",
        ["comedy"] = "Hài hước",
        ["drama"] = "Chính kịch",
        ["fantasy"] = "Giả tưởng",
        ["romance"] = "Tình cảm",
        ["science-fiction"] = "Khoa học viễn tưởng",
        ["slice-of-life"] = "Đời thường",
        ["mystery"] = "Bí ẩn",
        ["supernatural"] = "Siêu nhiên",
        ["sports"] = "Thể thao",
        ["music"] = "Âm nhạc",
        ["thriller"] = "Giật gân",
        ["historical"] = "Lịch sử",
        ["mecha"] = "Robot",
        ["psychological"] = "Tâm lý",
    };

    public static PublicCatalogEntry[] Select(JsonElement document, int limit)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(limit, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(limit, 500);
        if (document.GetProperty("repository").GetString() != Repository
            || !document.GetProperty("license").GetProperty("name").GetString()!.Contains("ODbL", StringComparison.Ordinal))
            throw new InvalidDataException("Expected an anime-offline-database snapshot with its ODbL license metadata.");

        var entries = new List<(PublicCatalogEntry Entry, double Score)>();
        foreach (var item in document.GetProperty("data").EnumerateArray())
        {
            var title = Text(item, "title").Trim();
            var format = Text(item, "type").ToLowerInvariant();
            var status = Text(item, "status") switch
            {
                "FINISHED" => "completed",
                "ONGOING" => "airing",
                "UPCOMING" => "upcoming",
                _ => "",
            };
            if (title.Length is < 1 or > 300 || status == ""
                || format is not ("tv" or "movie" or "ova" or "ona" or "special")
                || !item.TryGetProperty("animeSeason", out var season)
                || !season.TryGetProperty("year", out var yearElement)
                || !yearElement.TryGetInt32(out var year) || year is < 1907 or > 9999)
                continue;
            var tags = Strings(item, "tags").Select(x => x.ToLowerInvariant()).ToArray();
            if (tags.Any(x => x is "hentai" or "erotica" or "pornography")) continue;
            var source = Strings(item, "sources").FirstOrDefault(x =>
                Regex.IsMatch(x, @"^https://myanimelist\.net/anime/[1-9][0-9]{0,9}/?$", RegexOptions.CultureInvariant));
            if (source is null) continue;
            var sourceId = source.TrimEnd('/').Split('/')[^1];
            var picture = Text(item, "picture");
            if (picture.Length > 2048 || !Uri.TryCreate(picture, UriKind.Absolute, out var pictureUri)
                || pictureUri.Scheme != Uri.UriSchemeHttps || pictureUri.Host != "cdn.myanimelist.net")
                continue;
            var normalized = title.Normalize(NormalizationForm.FormD);
            normalized = string.Concat(normalized.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark));
            var slug = Regex.Replace(normalized.ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
            slug = slug[..Math.Min(slug.Length, 150)].TrimEnd('-');
            if (slug.Length == 0) slug = "anime";
            var score = item.TryGetProperty("score", out var scoreObject)
                && scoreObject.TryGetProperty("arithmeticMean", out var scoreElement)
                && scoreElement.TryGetDouble(out var value) && double.IsFinite(value) ? value : 0;
            var genreSlugs = tags.Select(tag => tag switch
            {
                "sci-fi" or "sci fi" or "science fiction" => "science-fiction",
                "slice of life" => "slice-of-life",
                _ => tag,
            }).Where(GenreNames.ContainsKey).Distinct().Order().ToArray();
            var anime = new AnimeEntity
            {
                Id = "anime_mal_" + sourceId,
                Slug = slug + "-mal-" + sourceId,
                Title = title,
                AlternativeTitles = Strings(item, "synonyms").Select(x => x.Trim())
                    .Where(x => x.Length is > 0 and <= 300 && !x.Equals(title, StringComparison.OrdinalIgnoreCase))
                    .Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToArray(),
                PosterUrl = picture,
                ReleaseYear = year,
                Format = format,
                Status = status,
                PublicationStatus = "published",
            };
            // The source contains no synopsis, season/episode titles, subtitles or playable video.
            entries.Add((new(anime, genreSlugs, source), score));
        }
        return entries.OrderBy(x => x.Entry.Anime.Status == "upcoming").ThenByDescending(x => x.Score)
            .ThenBy(x => x.Entry.Anime.Id, StringComparer.Ordinal)
            .DistinctBy(x => x.Entry.Anime.Id).DistinctBy(x => x.Entry.Anime.Title, StringComparer.OrdinalIgnoreCase)
            .Take(limit).Select(x => x.Entry).ToArray();
    }

    public static async Task<PublicCatalogImportResult> ImportAsync(AnimeWebDbContext database, string path,
        int limit = 100, CancellationToken cancellationToken = default)
    {
        if (new FileInfo(path).Length > 100_000_000) throw new InvalidDataException("Snapshot exceeds 100 MB.");
        await using var stream = File.OpenRead(path);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var entries = Select(document.RootElement, limit);
        if (entries.Length == 0) throw new InvalidDataException("Snapshot contains no eligible anime.");
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        // Serialize imports. Existing records, including edits made in admin, are never overwritten.
        await database.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(736184215)", cancellationToken);
        var existing = await database.Anime.AsNoTracking()
            .Select(x => new { x.Id, x.Slug, x.Title, x.AlternativeTitles }).ToListAsync(cancellationToken);
        var ids = existing.Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
        var slugs = existing.Select(x => x.Slug).ToHashSet(StringComparer.Ordinal);
        var titles = existing.SelectMany(x => x.AlternativeTitles.Append(x.Title))
            .Select(x => x.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var genres = await database.Genres.ToListAsync(cancellationToken);
        var added = 0;
        var addedGenres = 0;
        foreach (var entry in entries)
        {
            var anime = entry.Anime;
            if (ids.Contains(anime.Id) || slugs.Contains(anime.Slug)
                || titles.Contains(anime.Title) || anime.AlternativeTitles.Any(titles.Contains)) continue;
            foreach (var slug in entry.GenreSlugs)
            {
                var name = GenreNames[slug];
                var genre = genres.FirstOrDefault(x => x.Slug == slug || x.Name.Trim().Equals(name, StringComparison.OrdinalIgnoreCase));
                if (genre is null)
                {
                    genre = new Genre { Id = "genre_public_" + slug, Slug = slug, Name = name };
                    database.Genres.Add(genre);
                    genres.Add(genre);
                    addedGenres++;
                }
                anime.Genres.Add(genre);
            }
            database.Anime.Add(anime);
            ids.Add(anime.Id);
            slugs.Add(anime.Slug);
            titles.Add(anime.Title);
            added++;
        }
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new(entries.Length, added, entries.Length - added, addedGenres);
    }

    private static string Text(JsonElement item, string name) =>
        item.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString()! : "";

    private static IEnumerable<string> Strings(JsonElement item, string name) =>
        item.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.Array
            ? value.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString()!) : [];
}

public sealed record PublicCatalogEntry(AnimeEntity Anime, string[] GenreSlugs, string SourceUrl);
public sealed record PublicCatalogImportResult(int Selected, int Added, int Skipped, int AddedGenres);
