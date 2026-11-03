using System.Net;
using System.Text.Json;
using AnimeWeb.Api.Features.Anime;
using AnimeWeb.Api.Features.Episodes;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Tests.Integration;

public sealed partial class FeatureWorkflowTests
{
    [PostgreSqlFact]
    public async Task AuditIsAtomicWithCatalogWritesAndSurvivesTargetDeletionAsync()
    {
        using var admin = await RegisterAsync("admin");
        var slug = "audit-" + Guid.NewGuid().ToString("N");
        object Input(long version, string title) => new { slug, title, version, posterUrl = "/fixture.svg", releaseYear = 2025, publicationStatus = "draft" };
        var created = await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/anime", Input(0, "Audit fixture"), HttpStatusCode.Created);
        var id = created.GetProperty("data").GetProperty("anime").GetProperty("id").GetString();
        await SendAsync(admin.Client, HttpMethod.Patch, $"/api/v1/admin/anime/{id}", Input(1, "Audit edited"));
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/anime", Input(0, "Duplicate must rollback"), HttpStatusCode.Conflict);
        await DatabaseAsync(async db => Assert.Equal(2, await db.AuditEntries.CountAsync(x => x.ActorId == admin.Id)));
        await SendAsync(admin.Client, HttpMethod.Delete, $"/api/v1/admin/anime/{id}?version=2", status: HttpStatusCode.NoContent);
        var logs = await SendAsync(admin.Client, HttpMethod.Get, $"/api/v1/admin/audit-logs?q={id}");
        Assert.Equal(3, logs.GetProperty("meta").GetProperty("total").GetInt32());
        Assert.Equal(new[] { "create", "delete", "update" }, logs.GetProperty("data").EnumerateArray().Select(x => x.GetProperty("action").GetString()).Order());
        Assert.Contains(logs.GetProperty("data").EnumerateArray(), x => x.GetProperty("action").GetString() == "update" && x.GetProperty("changedFields").EnumerateArray().Any(f => f.GetString() == "Title"));
    }
    [PostgreSqlFact]
    public async Task AccentInsensitiveSearchCombinesFiltersAndTreatsWildcardsLiterallyAsync()
    {
        var id = Guid.NewGuid().ToString("N");
        await DatabaseAsync(async db =>
        {
            db.Anime.Add(new Anime
            {
                Id = id,
                Slug = "search-" + id,
                Title = "Đường đến Ánh Trăng " + id,
                Subtitle = "Thế giới huyền ảo",
                AlternativeTitles = ["Chuyến tàu %_"],
                PosterUrl = "/poster.svg",
                PublicationStatus = "published",
                ReleaseYear = 2023,
                Format = "ona",
                Status = "completed"
            });
            await db.SaveChangesAsync();
        });
        foreach (var text in new[] { "duong den anh trang", "ĐƯỜNG ĐẾN ÁNH TRĂNG", "the gioi huyen ao", "%_" })
        {
            var result = await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/anime?q=" + Uri.EscapeDataString(text)
                + "&year=2023&status=completed&format=ona");
            Assert.Contains(result.GetProperty("data").EnumerateArray(), x => x.GetProperty("id").GetString() == id);
        }
        var excluded = await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/anime?q=duong%20den%20anh%20trang&year=2024");
        Assert.DoesNotContain(excluded.GetProperty("data").EnumerateArray(), x => x.GetProperty("id").GetString() == id);
        using var admin = await RegisterAsync("admin");
        var adminSearch = await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/anime?q=duong%20den%20anh%20trang");
        Assert.Contains(adminSearch.GetProperty("data").EnumerateArray(), x => x.GetProperty("anime").GetProperty("id").GetString() == id);
    }

    [PostgreSqlFact]
    public async Task ArchivePreservesPersonalDataBlocksPlaybackAndRequiresExplicitRestoreAsync()
    {
        using var admin = await RegisterAsync("admin");
        using var manager = await RegisterAsync("manage");
        using var user = await RegisterAsync();
        var id = Guid.NewGuid().ToString("N");
        var episodeId = "episode-" + id;
        await DatabaseAsync(async db =>
        {
            var anime = new Anime { Id = id, Slug = "archive-" + id, Title = "Archive fixture", PosterUrl = "/poster.svg", PublicationStatus = "published", ReleaseYear = 2024 };
            var season = new Season { Id = "season-" + id, AnimeId = id, Anime = anime, Number = 1, Title = "Season", SortOrder = 1 };
            db.Episodes.Add(new Episode { Id = episodeId, SeasonId = season.Id, Season = season, Number = 1, Title = "Episode", SortOrder = 1, Status = "published", DurationSeconds = 600, PublishedAt = fixture.Clock.GetUtcNow() });
            await db.SaveChangesAsync();
        });
        await SendAsync(user.Client, HttpMethod.Put, $"/api/v1/me/library/{id}", new { version = 0, status = "watching", isFavorite = true });
        await SendAsync(user.Client, HttpMethod.Put, $"/api/v1/me/progress/{episodeId}", new { version = 0, positionSeconds = 123, completed = false });
        var comment = await SendAsync(user.Client, HttpMethod.Post, $"/api/v1/me/anime/{id}/comments", new { body = "Keep my comment" }, HttpStatusCode.Created);
        await SendAsync(manager.Client, HttpMethod.Patch, $"/api/v1/admin/anime/{id}/archive", new { version = 1, archived = true }, HttpStatusCode.Forbidden);
        await SendAsync(admin.Client, HttpMethod.Patch, $"/api/v1/admin/anime/{id}/archive", new { version = 1 }, HttpStatusCode.BadRequest);
        await SendAsync(user.Client, HttpMethod.Get, "/api/v1/admin/audit-logs", status: HttpStatusCode.Forbidden);
        await SendAsync(admin.Client, HttpMethod.Patch, $"/api/v1/admin/anime/{id}/archive", new { version = 1, archived = true });
        await SendAsync(fixture.Client, HttpMethod.Get, $"/api/v1/common/anime/archive-{id}", status: HttpStatusCode.NotFound);
        await SendAsync(fixture.Client, HttpMethod.Get, $"/api/v1/common/episodes/{episodeId}/playback", status: HttpStatusCode.NotFound);
        var favorites = await SendAsync(user.Client, HttpMethod.Get, "/api/v1/me/library?isFavorite=true&pageSize=50");
        var item = favorites.GetProperty("data").EnumerateArray().Single(x => x.GetProperty("animeId").GetString() == id);
        Assert.False(item.GetProperty("anime").GetProperty("available").GetBoolean());
        var history = await SendAsync(user.Client, HttpMethod.Get, $"/api/v1/me/progress?animeId={id}");
        Assert.Equal(123, history.GetProperty("data")[0].GetProperty("positionSeconds").GetInt32());
        var watching = await SendAsync(user.Client, HttpMethod.Get, $"/api/v1/me/progress?animeId={id}&collection=watching");
        Assert.Empty(watching.GetProperty("data").EnumerateArray());
        await SendAsync(user.Client, HttpMethod.Put, $"/api/v1/me/library/{id}", new { version = 1, status = "watching", isFavorite = false });
        await SendAsync(admin.Client, HttpMethod.Patch, $"/api/v1/admin/anime/{id}/archive", new { version = 1, archived = false }, HttpStatusCode.Conflict);
        await SendAsync(admin.Client, HttpMethod.Delete, $"/api/v1/admin/anime/{id}?version=2", status: HttpStatusCode.Conflict);
        var restored = await SendAsync(admin.Client, HttpMethod.Patch, $"/api/v1/admin/anime/{id}/archive", new { version = 2, archived = false });
        Assert.Equal("draft", restored.GetProperty("data").GetProperty("publicationStatus").GetString());
        await DatabaseAsync(async db => Assert.True(await db.Comments.AnyAsync(x => x.Id == comment.GetProperty("data").GetProperty("id").GetString())));
        var logs = await SendAsync(manager.Client, HttpMethod.Get, $"/api/v1/admin/audit-logs?q={id}&resourceType=anime");
        Assert.Equal(2, logs.GetProperty("meta").GetProperty("total").GetInt32());
        Assert.Equal(new[] { "restore", "archive" }.Order(), logs.GetProperty("data").EnumerateArray().Select(x => x.GetProperty("action").GetString()).Order());
        Assert.All(logs.GetProperty("data").EnumerateArray(), x => Assert.Equal(admin.Id, x.GetProperty("actorId").GetString()));
    }

    [PostgreSqlFact]
    public async Task AuditTracksSuccessfulRoleStatusAndCatalogMutationsWithoutSecretsAsync()
    {
        using var admin = await RegisterAsync("admin");
        using var user = await RegisterAsync();
        await SendAsync(admin.Client, HttpMethod.Patch, $"/api/v1/admin/users/{user.Id}/role", new { version = 1, role = "manage" });
        await SendAsync(admin.Client, HttpMethod.Patch, $"/api/v1/admin/users/{user.Id}/status", new { version = 2, status = "blocked" });
        await SendAsync(admin.Client, HttpMethod.Patch, $"/api/v1/admin/users/{user.Id}/status", new { version = 2, status = "active" }, HttpStatusCode.Conflict);
        var logs = await SendAsync(admin.Client, HttpMethod.Get, $"/api/v1/admin/audit-logs?q={user.Id}&resourceType=account");
        Assert.Equal(2, logs.GetProperty("meta").GetProperty("total").GetInt32());
        Assert.Contains(logs.GetProperty("data").EnumerateArray(), x => x.GetProperty("action").GetString() == "change_role");
        Assert.Contains(logs.GetProperty("data").EnumerateArray(), x => x.GetProperty("action").GetString() == "change_status");
        var json = logs.GetRawText();
        Assert.DoesNotContain(Password, json); Assert.DoesNotContain(user.Token, json); Assert.DoesNotContain("PasswordHash", json);
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/audit-logs", new { }, HttpStatusCode.MethodNotAllowed);
    }
}
