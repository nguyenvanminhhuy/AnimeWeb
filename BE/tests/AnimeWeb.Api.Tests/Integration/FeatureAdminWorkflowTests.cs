using System.Net;
using System.Text.Json;
using AnimeWeb.Api.Features.Playback;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Integration;

public sealed partial class FeatureWorkflowTests
{
    [PostgreSqlFact]
    public async Task AdminCatalogPublicationVersionRelationsAndMovieConventionAsync()
    {
        using var admin = await RegisterAsync("admin");
        var slug = "fixture-" + Guid.NewGuid().ToString("N");
        var genre = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/genres", new { name = slug, slug }, HttpStatusCode.Created)).GetProperty("data");
        var genreId = genre.GetProperty("id").GetString();
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/genres", new { name = slug.ToUpperInvariant(), slug = slug + "-duplicate" }, HttpStatusCode.Conflict);
        object AnimeInput(string publication, long version, string format = "tv", string? animeSlug = null) => new
        {
            title = "Fixture anime",
            subtitle = "Fixture subtitle",
            slug = animeSlug ?? slug,
            releaseYear = 2026,
            status = "airing",
            format,
            publicationStatus = publication,
            genreIds = new[] { genreId },
            posterUrl = "/fixture.webp",
            version
        };
        var anime = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/anime", AnimeInput("draft", 0), HttpStatusCode.Created)).GetProperty("data");
        var animeId = anime.GetProperty("anime").GetProperty("id").GetString();
        Assert.Equal(JsonValueKind.Null, anime.GetProperty("publicSlug").ValueKind);
        await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/anime/" + slug, status: HttpStatusCode.NotFound);
        await SendAsync(admin.Client, HttpMethod.Patch, "/api/v1/admin/anime/" + animeId, AnimeInput("published", 1));
        await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/anime/" + slug);
        await SendAsync(admin.Client, HttpMethod.Patch, "/api/v1/admin/anime/" + animeId, AnimeInput("draft", 1), HttpStatusCode.Conflict);
        await SendAsync(admin.Client, HttpMethod.Delete, $"/api/v1/admin/genres/{genreId}?version=1", status: HttpStatusCode.Conflict);
        var season = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/seasons", new { animeId, number = 1, title = "Season", sortOrder = 10 }, HttpStatusCode.Created)).GetProperty("data");
        var seasonId = season.GetProperty("id").GetString();
        object EpisodeInput(string status, long version, string? parent = null) => new
        {
            animeId = parent ?? animeId,
            seasonId,
            number = 1.5m,
            title = "Special episode",
            sortOrder = 0,
            durationSeconds = (int?)null,
            status,
            version
        };
        var episode = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/episodes", EpisodeInput("draft", 0), HttpStatusCode.Created)).GetProperty("data");
        var episodeId = episode.GetProperty("id").GetString();
        var published = (await SendAsync(admin.Client, HttpMethod.Patch, "/api/v1/admin/episodes/" + episodeId, EpisodeInput("published", 1))).GetProperty("data");
        var firstPublishedAt = published.GetProperty("publishedAt").GetString();
        Assert.NotNull(firstPublishedAt);
        await SendAsync(admin.Client, HttpMethod.Delete, $"/api/v1/admin/episodes/{episodeId}?version=2", status: HttpStatusCode.Conflict);
        await SendAsync(admin.Client, HttpMethod.Patch, "/api/v1/admin/episodes/" + episodeId, EpisodeInput("draft", 2));
        fixture.Clock.Advance(TimeSpan.FromSeconds(2));
        var again = (await SendAsync(admin.Client, HttpMethod.Patch, "/api/v1/admin/episodes/" + episodeId, EpisodeInput("published", 3))).GetProperty("data");
        Assert.Equal(firstPublishedAt, again.GetProperty("publishedAt").GetString());
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/episodes", EpisodeInput("draft", 0, "anime_demo_002"), HttpStatusCode.BadRequest);
        await SendAsync(admin.Client, HttpMethod.Delete, $"/api/v1/admin/seasons/{seasonId}?version=1", status: HttpStatusCode.Conflict);
        await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/anime?q=fixture&pageSize=1");
        await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/anime/" + animeId);
        await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/genres?usage=used&sort=name-desc&pageSize=1");
        await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/genres/options");
        await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/anime/options?q=fixture&pageSize=1");
        await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/episodes?q=1.5&sort=title&pageSize=1");
        var movie = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/anime", AnimeInput("draft", 0, "movie", slug + "-movie"), HttpStatusCode.Created)).GetProperty("data");
        var movieId = movie.GetProperty("anime").GetProperty("id").GetString();
        var movieSeason = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/seasons", new { animeId = movieId, number = 1, title = "Movie", sortOrder = 0 }, HttpStatusCode.Created)).GetProperty("data");
        var movieSeasonId = movieSeason.GetProperty("id").GetString();
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/seasons", new { animeId = movieId, number = 2, title = "Invalid", sortOrder = 1 }, HttpStatusCode.Conflict);
        var movieEpisode = new { animeId = movieId, seasonId = movieSeasonId, number = 1, title = "Movie", sortOrder = 0, status = "draft" };
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/episodes", movieEpisode, HttpStatusCode.Created);
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/episodes", movieEpisode, HttpStatusCode.Conflict);
        await SendAsync(admin.Client, HttpMethod.Patch, "/api/v1/admin/anime/" + animeId, AnimeInput("draft", 2));
        await SendAsync(admin.Client, HttpMethod.Delete, $"/api/v1/admin/anime/{animeId}?version=3", status: HttpStatusCode.Conflict);
        var removable = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/anime", AnimeInput("draft", 0, "tv", slug + "-removable"), HttpStatusCode.Created)).GetProperty("data");
        var removableId = removable.GetProperty("anime").GetProperty("id").GetString();
        await SendAsync(admin.Client, HttpMethod.Delete, $"/api/v1/admin/anime/{removableId}?version=1", status: HttpStatusCode.NoContent);
        await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/anime/" + removableId, status: HttpStatusCode.NotFound);
    }

    private sealed class UnavailableProvider : IPlaybackProvider
    {
        public Task<SourceDto> ResolveAsync(SourceDto source, CancellationToken ct) => throw new HttpRequestException("fixture-provider-secret");
    }
    [PostgreSqlFact]
    public async Task PlaybackDefaultTrackViewDedupRankingAndProviderFailureAsync()
    {
        using var admin = await RegisterAsync("admin"); using var viewer = await RegisterAsync(); using var other = await RegisterAsync();
        var source = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/playback-sources", new
        { episodeId = Main, providerKey = "direct", label = "Fixture source", language = "vi", type = "mp4", url = "https://media.fixture.invalid/sample.mp4", enabled = true }, HttpStatusCode.Created)).GetProperty("data");
        var sourceId = source.GetProperty("id").GetString();
        object Track(string label) => new { playbackSourceId = sourceId, label, language = "vi", format = "vtt", url = "https://media.fixture.invalid/subtitle.vtt", isDefault = true };
        var first = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/subtitles", Track("First"), HttpStatusCode.Created)).GetProperty("data");
        var second = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/subtitles", Track("Second"), HttpStatusCode.Created)).GetProperty("data");
        var tracks = (await SendAsync(admin.Client, HttpMethod.Get, $"/api/v1/admin/playback-sources/{sourceId}/subtitles")).GetProperty("data");
        Assert.Single(tracks.EnumerateArray(), x => x.GetProperty("isDefault").GetBoolean());
        await SendAsync(admin.Client, HttpMethod.Delete, $"/api/v1/admin/playback-sources/{sourceId}?version=1", status: HttpStatusCode.Conflict);
        var detail = (await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/episodes/" + Main)).GetProperty("data");
        Assert.True(detail.GetProperty("hasPlayback").GetBoolean());
        var playback = (await SendAsync(fixture.Client, HttpMethod.Get, $"/api/v1/common/episodes/{Main}/playback")).GetProperty("data");
        Assert.Equal("episode_demo_main_special", playback.GetProperty("nextEpisodeId").GetString());
        Assert.Equal(JsonValueKind.Null, playback.GetProperty("previousEpisodeId").ValueKind);
        Assert.Contains(playback.GetProperty("sources").EnumerateArray(), x => x.GetProperty("id").GetString() == sourceId);
        var session = (await SendAsync(viewer.Client, HttpMethod.Post, $"/api/v1/common/episodes/{Main}/view-sessions", new { positionSeconds = 0 }, HttpStatusCode.Created)).GetProperty("data");
        var sessionId = session.GetProperty("id").GetString();
        await SendAsync(viewer.Client, HttpMethod.Post, $"/api/v1/common/view-sessions/{sessionId}/confirm", new { positionSeconds = 30 }, HttpStatusCode.BadRequest);
        fixture.Clock.Advance(TimeSpan.FromSeconds(31));
        await SendAsync(other.Client, HttpMethod.Post, $"/api/v1/common/view-sessions/{sessionId}/confirm", new { positionSeconds = 30 }, HttpStatusCode.NotFound);
        var counted = (await SendAsync(viewer.Client, HttpMethod.Post, $"/api/v1/common/view-sessions/{sessionId}/confirm", new { positionSeconds = 30 })).GetProperty("data");
        Assert.True(counted.GetProperty("counted").GetBoolean());
        counted = (await SendAsync(viewer.Client, HttpMethod.Post, $"/api/v1/common/view-sessions/{sessionId}/confirm", new { positionSeconds = 31 })).GetProperty("data");
        Assert.False(counted.GetProperty("counted").GetBoolean());
        var ranking = (await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/rankings/anime?metric=views&limit=10")).GetProperty("data");
        var ranked = ranking.EnumerateArray().Single(x => x.GetProperty("anime").GetProperty("id").GetString() == "anime_demo_001");
        Assert.True(ranked.GetProperty("viewCount").GetInt64() >= 1);
        var home = (await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/home")).GetProperty("data");
        var dashboard = (await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/dashboard")).GetProperty("data");
        Assert.Equal(home.GetProperty("topViewed").GetRawText(), dashboard.GetProperty("topViewed").GetRawText());
        await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/anime/anime_demo_001/related");
        await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/catalog/options");
        await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/anime/anime_demo_007/related", status: HttpStatusCode.NotFound);
        await using (var failedFactory = fixture.Factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services => services.AddScoped<IPlaybackProvider, UnavailableProvider>())))
        {
            using var failedClient = failedFactory.CreateClient();
            var failure = await SendAsync(failedClient, HttpMethod.Get, $"/api/v1/common/episodes/{Main}/playback", status: HttpStatusCode.ServiceUnavailable);
            Assert.DoesNotContain("fixture-provider-secret", failure.GetRawText());
        }
        await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/playback-sources?sort=label&enabled=true&pageSize=1");
        await SendAsync(admin.Client, HttpMethod.Delete, "/api/v1/admin/subtitles/" + first.GetProperty("id").GetString() + "?version=2", status: HttpStatusCode.NoContent);
        await SendAsync(admin.Client, HttpMethod.Delete, "/api/v1/admin/subtitles/" + second.GetProperty("id").GetString() + "?version=1", status: HttpStatusCode.NoContent);
        await SendAsync(admin.Client, HttpMethod.Delete, $"/api/v1/admin/playback-sources/{sourceId}?version=1", status: HttpStatusCode.NoContent);
    }
}
