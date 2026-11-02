using System.Text.Json;
using System.Text.RegularExpressions;
using AnimeWeb.Api.Infrastructure.Persistence.Seeding;

namespace AnimeWeb.Api.Tests;

public sealed class PublicCatalogImporterTests
{
    [Theory]
    [InlineData("FINISHED", "completed", "MOVIE", "movie")]
    [InlineData("ONGOING", "airing", "TV", "tv")]
    [InlineData("UPCOMING", "upcoming", "ONA", "ona")]
    public void MapsMetadataWithoutInventingUnavailableContent(string sourceStatus, string status, string sourceType, string format)
    {
        using var document = Snapshot(Item(status: sourceStatus, type: sourceType));
        var entry = Assert.Single(PublicCatalogImporter.Select(document.RootElement, 100));
        Assert.Equal("anime_mal_123", entry.Anime.Id);
        Assert.Matches(new Regex("^[a-z0-9]+(-[a-z0-9]+)*$"), entry.Anime.Slug);
        Assert.Equal(status, entry.Anime.Status);
        Assert.Equal(format, entry.Anime.Format);
        Assert.Equal(2024, entry.Anime.ReleaseYear);
        Assert.Equal("published", entry.Anime.PublicationStatus);
        Assert.Equal(["Other title"], entry.Anime.AlternativeTitles);
        Assert.Equal(["action", "science-fiction"], entry.GenreSlugs);
        Assert.Empty(entry.Anime.Synopsis);
        Assert.Null(entry.Anime.BannerUrl);
    }

    [Fact]
    public void RejectsUnusableRecordsAndExplicitAdultTagsBeforeLimiting()
    {
        using var document = Snapshot(
            Item(source: "https://attacker.example/anime/123"),
            Item(picture: "http://127.0.0.1/private"),
            Item(type: "UNKNOWN"), Item(status: "UNKNOWN"), Item(year: 0),
            Item(tags: ["hentai"]), Item(title: new string('x', 301)),
            Item(id: 456, title: "Valid anime"));
        Assert.Equal("anime_mal_456", Assert.Single(PublicCatalogImporter.Select(document.RootElement, 1)).Anime.Id);
    }

    [Fact]
    public void SelectionIsDeterministicLimitedAndDeduplicatesSourceIdsAndTitles()
    {
        using var document = Snapshot(Item(id: 20, title: "Second", score: 7),
            Item(id: 10, title: "First", score: 9), Item(id: 10, title: "Duplicate ID", score: 8),
            Item(id: 30, title: "FIRST", score: 8));
        var entries = PublicCatalogImporter.Select(document.RootElement, 100);
        Assert.Equal(["anime_mal_10", "anime_mal_20"], entries.Select(x => x.Anime.Id));
        Assert.Equal("anime_mal_10", Assert.Single(PublicCatalogImporter.Select(document.RootElement, 1)).Anime.Id);
        Assert.Equal(entries.Select(x => x.Anime.Slug), PublicCatalogImporter.Select(document.RootElement, 100).Select(x => x.Anime.Slug));
    }

    [Fact]
    public void PrefersReleasedTitlesOverAnticipationScores()
    {
        using var document = Snapshot(Item(id: 10, title: "Announced", status: "UPCOMING", score: 10),
            Item(id: 20, title: "Released", status: "FINISHED", score: 8));
        Assert.Equal("anime_mal_20", Assert.Single(PublicCatalogImporter.Select(document.RootElement, 1)).Anime.Id);
    }

    [Fact]
    public void RejectsUnexpectedSourceAndOutOfRangeLimits()
    {
        using var invalid = JsonDocument.Parse("""{"repository":"https://other.example"}""");
        Assert.Throws<InvalidDataException>(() => PublicCatalogImporter.Select(invalid.RootElement, 100));
        using var valid = Snapshot(Item());
        Assert.Throws<ArgumentOutOfRangeException>(() => PublicCatalogImporter.Select(valid.RootElement, 0));
        Assert.Throws<ArgumentOutOfRangeException>(() => PublicCatalogImporter.Select(valid.RootElement, 501));
    }

    private static JsonDocument Snapshot(params object[] items) => JsonDocument.Parse(JsonSerializer.Serialize(new
    {
        repository = PublicCatalogImporter.Repository,
        license = new { name = "Open Data Commons Open Database License (ODbL) v1.0 + Database Contents License (DbCL) v1.0" },
        data = items,
    }));

    private static object Item(int id = 123, string title = "Example", string status = "FINISHED", string type = "TV",
        int year = 2024, string? source = null, string picture = "https://cdn.myanimelist.net/images/anime/test.jpg",
        string[]? tags = null, double score = 8) => new
        {
            sources = new[] { source ?? $"https://myanimelist.net/anime/{id}" },
            title,
            type,
            status,
            animeSeason = new { year },
            picture,
            synonyms = new[] { "Other title", "Other title", title },
            tags = tags ?? ["action", "sci-fi", "science fiction", "not a genre"],
            score = new { arithmeticMean = score },
        };
}
