using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Features.Episodes;
using AnimeWeb.Api.Features.Episodes.Dtos;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Pagination;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace AnimeWeb.Api.Tests.Integration;

[Trait("Category", "PostgreSQL")]
public sealed class EpisodesTests(EpisodeDatabaseFixture fixture) : IClassFixture<EpisodeDatabaseFixture>
{
    [PostgreSqlFact]
    public async Task GuestCanReadSeasonsIncludingSpecialAndEmptySeasonAsync()
    {
        var result = await fixture.Client.GetFromJsonAsync<ApiResponse<List<SeasonDto>>>(
            "/api/v1/common/anime/anime_demo_001/seasons");
        Assert.NotNull(result);
        Assert.Equal(new[] { "season_demo_main", "season_demo_side", "season_demo_empty" },
            result.Data.Select(season => season.Id));
        Assert.Equal(0, result.Data[1].Number);
        Assert.All(result.Data, season => Assert.Equal("anime_demo_001", season.AnimeId));
    }

    [PostgreSqlFact]
    public async Task PublishedEpisodesFollowSortOrderAndIdNotEpisodeNumberAsync()
    {
        var result = await EpisodesAsync("season_demo_main");
        Assert.Equal(4, result.Meta.Total);
        Assert.Equal(new[] { "episode_demo_main_z", "episode_demo_main_special", "episode_demo_main_a", "episode_demo_main_b" },
            result.Data.Select(episode => episode.Id));
        Assert.Equal(1.5m, result.Data[1].Number);
        Assert.All(result.Data, episode =>
        {
            Assert.Equal("published", episode.Status);
            Assert.False(episode.HasPlayback);
        });
    }

    [PostgreSqlFact]
    public async Task PaginationExcludesDraftAndDoesNotOverlapAsync()
    {
        var first = await EpisodesAsync("season_demo_main", "?page=1&pageSize=2");
        var second = await EpisodesAsync("season_demo_main", "?page=2&pageSize=2");
        Assert.Equal(2, first.Meta.TotalPages);
        Assert.Equal(4, first.Meta.Total);
        Assert.Equal(new[] { "episode_demo_main_z", "episode_demo_main_special" }, first.Data.Select(episode => episode.Id));
        Assert.Equal(new[] { "episode_demo_main_a", "episode_demo_main_b" }, second.Data.Select(episode => episode.Id));
        Assert.Empty(first.Data.Select(episode => episode.Id).Intersect(second.Data.Select(episode => episode.Id)));
        foreach (var page in new[] { 3, int.MaxValue })
        {
            var beyond = await EpisodesAsync("season_demo_main", "?page=" + page + "&pageSize=2");
            Assert.Empty(beyond.Data);
            Assert.Equal(page, beyond.Meta.Page);
            Assert.Equal(4, beyond.Meta.Total);
        }
    }

    [PostgreSqlFact]
    public async Task ValidEmptyResourcesReturn200InsteadOfNotFoundAsync()
    {
        var seasons = await fixture.Client.GetFromJsonAsync<ApiResponse<List<SeasonDto>>>(
            "/api/v1/common/anime/anime_demo_005/seasons");
        Assert.NotNull(seasons);
        Assert.Empty(seasons.Data);
        var empty = await EpisodesAsync("season_demo_empty");
        Assert.Empty(empty.Data);
        Assert.Equal(0, empty.Meta.Total);
        Assert.Equal(0, empty.Meta.TotalPages);
    }

    [PostgreSqlFact]
    public async Task DraftAndHiddenAncestorsReturnSameNotFoundAsMissingAsync()
    {
        foreach (var animeId in new[] { "anime_demo_007", "unknown_anime" })
        {
            await AssertNotFoundAsync("/api/v1/common/anime/" + animeId + "/seasons", "ANIME_NOT_FOUND");
        }
        foreach (var seasonId in new[] { "season_demo_hidden", "unknown_season" })
        {
            await AssertNotFoundAsync("/api/v1/common/seasons/" + seasonId + "/episodes", "SEASON_NOT_FOUND");
        }
        foreach (var episodeId in new[] { "episode_demo_main_draft", "episode_demo_hidden", "unknown_episode" })
        {
            await AssertNotFoundAsync("/api/v1/common/episodes/" + episodeId, "EPISODE_NOT_FOUND");
        }
    }

    [PostgreSqlFact]
    public async Task DetailContainsReferencesAndUtcMetadataButNoPlaybackUrlsAsync()
    {
        var response = await fixture.Client.GetAsync("/api/v1/common/episodes/episode_demo_main_special");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = json.GetProperty("data");
        Assert.Equal("anime_demo_001", data.GetProperty("animeId").GetString());
        Assert.Equal("hanh-trinh-anh-sao", data.GetProperty("animeSlug").GetString());
        Assert.Equal("season_demo_main", data.GetProperty("seasonId").GetString());
        Assert.Equal(1.5m, data.GetProperty("number").GetDecimal());
        Assert.Equal(TimeSpan.Zero, data.GetProperty("publishedAt").GetDateTimeOffset().Offset);
        Assert.False(data.GetProperty("hasPlayback").GetBoolean());
        Assert.False(data.TryGetProperty("sources", out _));
        Assert.False(data.TryGetProperty("season", out _));
        Assert.False(data.TryGetProperty("anime", out _));
    }

    [PostgreSqlFact]
    public async Task UnknownDurationRemainsNullAndMovieHasOneSeasonOneEpisodeAsync()
    {
        var side = await EpisodesAsync("season_demo_side");
        Assert.Null(Assert.Single(side.Data).DurationSeconds);
        var movie = await fixture.Client.GetFromJsonAsync<ApiResponse<List<SeasonDto>>>(
            "/api/v1/common/anime/anime_demo_002/seasons");
        Assert.NotNull(movie);
        var movieEpisodes = await EpisodesAsync(Assert.Single(movie.Data).Id);
        Assert.Equal(5400, Assert.Single(movieEpisodes.Data).DurationSeconds);
    }

    [PostgreSqlFact]
    public async Task UnpublishingParentImmediatelyHidesAllDescendantEndpointsAsync()
    {
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        await database.Anime.Where(anime => anime.Id == "anime_demo_001")
            .ExecuteUpdateAsync(setters => setters.SetProperty(anime => anime.PublicationStatus, "draft"));
        try
        {
            await AssertNotFoundAsync("/api/v1/common/anime/anime_demo_001/seasons", "ANIME_NOT_FOUND");
            await AssertNotFoundAsync("/api/v1/common/seasons/season_demo_main/episodes", "SEASON_NOT_FOUND");
            await AssertNotFoundAsync("/api/v1/common/episodes/episode_demo_main_z", "EPISODE_NOT_FOUND");
        }
        finally
        {
            await database.Anime.Where(anime => anime.Id == "anime_demo_001")
                .ExecuteUpdateAsync(setters => setters.SetProperty(anime => anime.PublicationStatus, "published"));
        }
    }

    [PostgreSqlFact]
    public async Task DatabaseRejectsOrphansAndInvalidEpisodeMetadataAsync()
    {
        await AssertRejectedAsync(database => database.Seasons.Add(new Season
        {
            Id = "test_orphan_season",
            AnimeId = "missing_anime",
            Number = 1,
            Title = "Orphan",
            SortOrder = 1
        }), PostgresErrorCodes.ForeignKeyViolation);
        await AssertRejectedAsync(database => database.Seasons.Add(new Season
        {
            Id = "test_negative_season",
            AnimeId = "anime_demo_001",
            Number = -1,
            Title = "Invalid",
            SortOrder = 1
        }), PostgresErrorCodes.CheckViolation);
        await AssertRejectedAsync(database => database.Episodes.Add(CreateTestEpisode(seasonId: "missing_season")),
            PostgresErrorCodes.ForeignKeyViolation);
        await AssertRejectedAsync(database => database.Episodes.Add(CreateTestEpisode(duration: -1)),
            PostgresErrorCodes.CheckViolation);
        await AssertRejectedAsync(database => database.Episodes.Add(CreateTestEpisode(status: "deleted")),
            PostgresErrorCodes.CheckViolation);
        await AssertRejectedAsync(database => database.Episodes.Add(CreateTestEpisode(status: "published")),
            PostgresErrorCodes.CheckViolation);
    }

    [PostgreSqlFact]
    public async Task DatabaseRestrictsParentDeletionAndEnforcesUniqueEpisodeIdAsync()
    {
        await AssertRejectedAsync(database => database.Episodes.Add(new Episode
        {
            Id = "episode_demo_main_z",
            SeasonId = "season_demo_main",
            Number = 10,
            Title = "Duplicate"
        }), PostgresErrorCodes.UniqueViolation);
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        await using var transaction = await database.Database.BeginTransactionAsync();
        var error = await Assert.ThrowsAsync<PostgresException>(() =>
            database.Seasons.Where(season => season.Id == "season_demo_main").ExecuteDeleteAsync());
        Assert.Equal(PostgresErrorCodes.RestrictViolation, error.SqlState);
        await transaction.RollbackAsync();
    }

    private static Episode CreateTestEpisode(string seasonId = "season_demo_main", int? duration = 1440, string status = "draft") =>
        new() { Id = "test_invalid_episode", SeasonId = seasonId, Number = 1, Title = "Invalid", DurationSeconds = duration, Status = status };

    private async Task AssertRejectedAsync(Action<AnimeWebDbContext> insert, string sqlState)
    {
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        await using var transaction = await database.Database.BeginTransactionAsync();
        insert(database);
        var error = await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
        Assert.Equal(sqlState, Assert.IsType<PostgresException>(error.InnerException).SqlState);
        await transaction.RollbackAsync();
    }

    private async Task<PagedResponse<EpisodeDto>> EpisodesAsync(string seasonId, string query = "")
    {
        var response = await fixture.Client.GetAsync("/api/v1/common/seasons/" + seasonId + "/episodes" + query);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var data = await response.Content.ReadFromJsonAsync<PagedResponse<EpisodeDto>>();
        Assert.NotNull(data);
        return data;
    }

    private async Task AssertNotFoundAsync(string path, string expectedCode)
    {
        var response = await fixture.Client.GetAsync(path);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(expectedCode, json.GetProperty("error").GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(json.GetProperty("error").GetProperty("requestId").GetString()));
        Assert.False(json.TryGetProperty("data", out _));
    }
}
