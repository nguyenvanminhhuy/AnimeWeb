using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Features.Anime.Dtos;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Pagination;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Tests.Integration;

[Trait("Category", "PostgreSQL")]
public sealed class AnimeCatalogTests(CatalogDatabaseFixture fixture) : IClassFixture<CatalogDatabaseFixture>
{
    [PostgreSqlFact]
    public async Task GuestCanListOnlyPublishedAnimeInStableOrderAsync()
    {
        var result = await ListAsync("");
        Assert.Equal(6, result.Meta.Total);
        Assert.Equal(1, result.Meta.Page);
        Assert.Equal(20, result.Meta.PageSize);
        Assert.Equal(1, result.Meta.TotalPages);
        Assert.Equal(new[] { "anime_demo_005", "anime_demo_001", "anime_demo_002", "anime_demo_003", "anime_demo_006", "anime_demo_004" },
            result.Data.Select(anime => anime.Id));
        Assert.DoesNotContain(result.Data, anime => anime.Slug == "ban-nhap-bi-mat");
    }

    [PostgreSqlFact]
    public async Task SearchMatchesAlternateTitleIgnoringCaseAndTrimsWhitespaceAsync()
    {
        var result = await ListAsync("?q=" + Uri.EscapeDataString("  sTaR jOuRnEy  "));
        Assert.Equal("hanh-trinh-anh-sao", Assert.Single(result.Data).Slug);
        var vietnamese = await ListAsync("?q=" + Uri.EscapeDataString("MẶT TRĂNG"));
        Assert.Equal("khu-vuon-mat-trang", Assert.Single(vietnamese.Data).Slug);
    }

    [PostgreSqlFact]
    public async Task FiltersAreCombinedAtDatabaseAsync()
    {
        var result = await ListAsync("?genre=fantasy&status=airing&year=2026&format=tv");
        Assert.Equal("anime_demo_001", Assert.Single(result.Data).Id);
        Assert.Empty((await ListAsync("?genre=romance&status=airing")).Data);
        Assert.Empty((await ListAsync("?genre=does-not-exist")).Data);
    }

    [PostgreSqlFact]
    public async Task PageBoundariesAndVeryLargePageKeepRequestedMetadataAsync()
    {
        var first = await ListAsync("?page=1&pageSize=2");
        var second = await ListAsync("?page=2&pageSize=2");
        Assert.Equal(3, first.Meta.TotalPages);
        Assert.Empty(first.Data.Select(anime => anime.Id).Intersect(second.Data.Select(anime => anime.Id)));
        var beyond = await ListAsync("?page=4&pageSize=2");
        Assert.Equal(4, beyond.Meta.Page);
        Assert.Equal(6, beyond.Meta.Total);
        Assert.Empty(beyond.Data);
        var huge = await ListAsync("?page=2147483647&pageSize=50");
        Assert.Equal(int.MaxValue, huge.Meta.Page);
        Assert.Empty(huge.Data);
        var empty = await ListAsync("?q=not-a-real-title&page=3");
        Assert.Equal(0, empty.Meta.TotalPages);
        Assert.Equal(3, empty.Meta.Page);
        Assert.Empty(empty.Data);
    }

    [PostgreSqlFact]
    public async Task TitleSortUsesStableDatabaseOrderAsync()
    {
        var result = await ListAsync("?sort=title&pageSize=2");
        var again = await ListAsync("?sort=title&pageSize=2");
        Assert.Equal(result.Data.Select(anime => anime.Id), again.Data.Select(anime => anime.Id));
        Assert.Equal(new[] { "anime_demo_003", "anime_demo_001" }, result.Data.Select(anime => anime.Id));
    }

    [PostgreSqlFact]
    public async Task DetailProjectsPublicDtoAndGenresAsync()
    {
        var response = await fixture.Client.GetAsync("/api/v1/common/anime/hanh-trinh-anh-sao");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = json.GetProperty("data");
        Assert.Equal("anime_demo_001", data.GetProperty("id").GetString());
        Assert.Contains("Star Journey", data.GetProperty("alternativeTitles").EnumerateArray().Select(value => value.GetString()));
        Assert.False(string.IsNullOrWhiteSpace(data.GetProperty("synopsis").GetString()));
        Assert.True(data.TryGetProperty("bannerUrl", out _));
        Assert.False(data.TryGetProperty("publicationStatus", out _));
        Assert.False(data.TryGetProperty("animeGenres", out _));
        Assert.Equal(2, data.GetProperty("genres").GetArrayLength());
    }

    [PostgreSqlFact]
    public async Task DraftAndMissingHaveSameNotFoundResponseAsync()
    {
        foreach (var slug in new[] { "ban-nhap-bi-mat", "unknown-anime" })
        {
            var response = await fixture.Client.GetAsync("/api/v1/common/anime/" + slug);
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("ANIME_NOT_FOUND", json.GetProperty("error").GetProperty("code").GetString());
            Assert.False(string.IsNullOrWhiteSpace(json.GetProperty("error").GetProperty("requestId").GetString()));
        }
    }

    [PostgreSqlFact]
    public async Task GenresDoNotExposeDraftOnlyCategoriesAsync()
    {
        var result = await fixture.Client.GetFromJsonAsync<ApiResponse<List<GenreDto>>>("/api/v1/common/genres");
        Assert.NotNull(result);
        Assert.Equal(new[] { "adventure", "fantasy", "romance" }, result.Data.Select(genre => genre.Slug));
    }

    [PostgreSqlFact]
    public async Task LikeWildcardsAreLiteralAndNotAnUnboundedSearchAsync()
    {
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        var literal = new AnimeEntity
        {
            Id = "test_literal",
            Slug = "test-literal",
            Title = "Literal %_~ Match",
            PosterUrl = "/fixture.webp",
            ReleaseYear = 2026,
            PublicationStatus = "published"
        };
        database.Anime.Add(literal);
        await database.SaveChangesAsync();
        try
        {
            var result = await ListAsync("?q=" + Uri.EscapeDataString("%_~"));
            Assert.Equal(literal.Id, Assert.Single(result.Data).Id);
            Assert.Empty((await ListAsync("?q=" + Uri.EscapeDataString("' OR 1=1 --"))).Data);
        }
        finally
        {
            await database.Anime.Where(anime => anime.Id == literal.Id).ExecuteDeleteAsync();
        }
    }

    [PostgreSqlFact]
    public async Task DatabaseEnforcesUniqueSlugAndYearConstraintAsync()
    {
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        await using var transaction = await database.Database.BeginTransactionAsync();
        database.Anime.Add(new AnimeEntity
        {
            Id = "test_duplicate",
            Slug = "hanh-trinh-anh-sao",
            Title = "Duplicate",
            PosterUrl = "/fixture.webp",
            ReleaseYear = 2026
        });
        var duplicate = await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
        Assert.Equal(PostgresErrorCodes.UniqueViolation, Assert.IsType<PostgresException>(duplicate.InnerException).SqlState);
        await transaction.RollbackAsync();
        database.ChangeTracker.Clear();
        await using var invalidTransaction = await database.Database.BeginTransactionAsync();
        database.Anime.Add(new AnimeEntity
        {
            Id = "test_year",
            Slug = "test-year",
            Title = "Invalid year",
            PosterUrl = "/fixture.webp",
            ReleaseYear = 0
        });
        var invalid = await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
        Assert.Equal(PostgresErrorCodes.CheckViolation, Assert.IsType<PostgresException>(invalid.InnerException).SqlState);
        await invalidTransaction.RollbackAsync();
    }

    private async Task<PagedResponse<AnimeSummaryDto>> ListAsync(string query)
    {
        var response = await fixture.Client.GetAsync("/api/v1/common/anime" + query);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<AnimeSummaryDto>>();
        Assert.NotNull(result);
        return result;
    }

    [PostgreSqlFact]
    public async Task GenreAndMembershipConstraintsAreEnforcedAsync()
    {
        await AssertRejectedAsync(database => database.Genres.Add(new()
        {
            Id = "test_duplicate_genre",
            Slug = "adventure",
            Name = "Duplicate"
        }), PostgresErrorCodes.UniqueViolation);
        await AssertRejectedAsync(database => database.AnimeGenres.Add(new()
        {
            AnimeId = "anime_demo_001",
            GenreId = "genre_adventure"
        }), PostgresErrorCodes.UniqueViolation);
        await AssertRejectedAsync(database => database.AnimeGenres.Add(new()
        {
            AnimeId = "missing_anime",
            GenreId = "genre_adventure"
        }), PostgresErrorCodes.ForeignKeyViolation);
    }

    private async Task AssertRejectedAsync(Action<AnimeWebDbContext> insert, string expectedState)
    {
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        await using var transaction = await database.Database.BeginTransactionAsync();
        insert(database);
        var error = await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
        Assert.Equal(expectedState, Assert.IsType<PostgresException>(error.InnerException).SqlState);
        await transaction.RollbackAsync();
    }
}
