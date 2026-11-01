using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Integration;

[Trait("Category", "PostgreSQL")]
public sealed partial class FeatureWorkflowTests(EpisodeDatabaseFixture fixture) : IClassFixture<EpisodeDatabaseFixture>
{
    private const string Password = "Fixture-password-123";
    private const string Main = "episode_demo_main_z";

    private sealed record TestAccount(HttpClient Client, string Id, string Email, string Token) : IDisposable
    { public void Dispose() => Client.Dispose(); }
    private async Task<TestAccount> RegisterAsync(string role = "user")
    {
        var client = fixture.Factory.CreateClient();
        var email = Guid.NewGuid().ToString("N") + "@fixture.invalid";
        var json = await SendAsync(client, HttpMethod.Post, "/api/v1/auth/register", new { email, password = Password, displayName = "Fixture viewer" }, HttpStatusCode.Created);
        var data = json.GetProperty("data");
        var id = data.GetProperty("profile").GetProperty("id").GetString()!;
        var token = data.GetProperty("accessToken").GetString()!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (role != "user") await DatabaseAsync(async db =>
        {
            db.UserRoles.Add(new() { UserId = id, RoleCode = role }); await db.SaveChangesAsync();
        });
        return new(client, id, email, token);
    }
    private async Task DatabaseAsync(Func<AnimeWebDbContext, Task> action)
    {
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        await action(scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>());
    }
    private static async Task<JsonElement> SendAsync(HttpClient client, HttpMethod method, string url, object? body = null, HttpStatusCode status = HttpStatusCode.OK)
    {
        using var request = new HttpRequestMessage(method, url);
        if (body is not null) request.Content = JsonContent.Create(body);
        using var response = await client.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == status, $"{method} {url}: expected {(int)status}, got {(int)response.StatusCode}: {text}");
        return text.Length == 0 ? default : JsonSerializer.Deserialize<JsonElement>(text);
    }

    [PostgreSqlFact]
    public async Task RegistrationHashesCredentialsNormalizesEmailAndRejectsPrivilegePayloadAsync()
    {
        using var user = await RegisterAsync();
        var profile = (await SendAsync(user.Client, HttpMethod.Get, "/api/v1/me")).GetProperty("data");
        Assert.Equal(new[] { "user" }, profile.GetProperty("roles").EnumerateArray().Select(x => x.GetString()));
        Assert.False(profile.TryGetProperty("passwordHash", out _));
        await DatabaseAsync(async db =>
        {
            var account = await db.Accounts.SingleAsync(x => x.Id == user.Id);
            Assert.NotEqual(Password, account.PasswordHash);
            Assert.Equal(user.Email.ToUpperInvariant(), account.NormalizedEmail);
            Assert.True(await db.LoginSessions.AnyAsync(x => x.UserId == user.Id && x.TokenHash == AccountService.Hash(user.Token)));
            Assert.False(await db.LoginSessions.AnyAsync(x => x.TokenHash == user.Token));
        });
        await SendAsync(fixture.Client, HttpMethod.Post, "/api/v1/auth/login", new { email = user.Email.ToUpperInvariant(), password = Password });
        await SendAsync(fixture.Client, HttpMethod.Post, "/api/v1/auth/login", new { email = user.Email, password = "wrong-password" }, HttpStatusCode.Unauthorized);
        await SendAsync(fixture.Client, HttpMethod.Post, "/api/v1/auth/register", new { email = user.Email, password = Password, displayName = "Duplicate" }, HttpStatusCode.Conflict);
        await SendAsync(fixture.Client, HttpMethod.Post, "/api/v1/auth/register", new { email = "attack@fixture.invalid", password = Password, displayName = "Attack", roles = new[] { "admin" } }, HttpStatusCode.BadRequest);
    }
    [PostgreSqlFact]
    public async Task PasswordChangeLogoutExpiryAndBlockedStateRevokeAccessAsync()
    {
        using var user = await RegisterAsync();
        var other = await SendAsync(fixture.Client, HttpMethod.Post, "/api/v1/auth/login", new { email = user.Email, password = Password });
        using var second = fixture.Factory.CreateClient();
        second.DefaultRequestHeaders.Authorization = new("Bearer", other.GetProperty("data").GetProperty("accessToken").GetString());
        await SendAsync(user.Client, HttpMethod.Post, "/api/v1/me/change-password", new { currentPassword = Password, newPassword = Password + "new" }, HttpStatusCode.NoContent);
        await SendAsync(user.Client, HttpMethod.Get, "/api/v1/me", status: HttpStatusCode.Unauthorized);
        await SendAsync(second, HttpMethod.Get, "/api/v1/me", status: HttpStatusCode.Unauthorized);
        await SendAsync(fixture.Client, HttpMethod.Post, "/api/v1/auth/login", new { email = user.Email, password = Password }, HttpStatusCode.Unauthorized);
        var login = await SendAsync(fixture.Client, HttpMethod.Post, "/api/v1/auth/login", new { email = user.Email, password = Password + "new" });
        second.DefaultRequestHeaders.Authorization = new("Bearer", login.GetProperty("data").GetProperty("accessToken").GetString());
        await SendAsync(second, HttpMethod.Post, "/api/v1/auth/logout", status: HttpStatusCode.NoContent);
        await SendAsync(second, HttpMethod.Get, "/api/v1/me", status: HttpStatusCode.Unauthorized);
        using var expiring = await RegisterAsync();
        fixture.Clock.Advance(TimeSpan.FromDays(8));
        await SendAsync(expiring.Client, HttpMethod.Get, "/api/v1/me", status: HttpStatusCode.Unauthorized);
        using var blocked = await RegisterAsync("manage");
        await DatabaseAsync(db => db.Accounts.Where(x => x.Id == blocked.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, "blocked")));
        await SendAsync(blocked.Client, HttpMethod.Get, "/api/v1/me", status: HttpStatusCode.Forbidden);
        await SendAsync(blocked.Client, HttpMethod.Get, "/api/v1/admin/users", status: HttpStatusCode.Forbidden);
        await SendAsync(blocked.Client, HttpMethod.Get, "/api/v1/common/anime");
    }
    [PostgreSqlFact]
    public async Task GuestUserManageAndLiveRoleChangesEnforcePermissionsAsync()
    {
        var urls = new[] { "/admin/anime", "/admin/genres", "/admin/seasons?animeId=anime_demo_001", "/admin/episodes",
            "/admin/playback-sources", "/admin/comments", "/admin/users", "/admin/dashboard" };
        using var user = await RegisterAsync();
        using var manager = await RegisterAsync("manage");
        foreach (var url in urls)
        {
            await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1" + url, status: HttpStatusCode.Unauthorized);
            await SendAsync(user.Client, HttpMethod.Get, "/api/v1" + url, status: HttpStatusCode.Forbidden);
            await SendAsync(manager.Client, HttpMethod.Get, "/api/v1" + url);
        }
        await SendAsync(manager.Client, HttpMethod.Post, "/api/v1/admin/genres", new { name = "Denied", slug = "denied" }, HttpStatusCode.Forbidden);
        await SendAsync(manager.Client, HttpMethod.Post, "/api/v1/admin/comments/missing/moderations", new { action = "hide", reason = "Denied", version = 1 }, HttpStatusCode.Forbidden);
        await DatabaseAsync(db => db.UserRoles.Where(x => x.UserId == manager.Id && x.RoleCode == "manage").ExecuteDeleteAsync());
        await SendAsync(manager.Client, HttpMethod.Get, "/api/v1/admin/users", status: HttpStatusCode.Forbidden);
    }
    [PostgreSqlFact]
    public async Task PersonalDataIsIsolatedVersionedAndWatchingUsesLatestEpisodeAsync()
    {
        using var user = await RegisterAsync(); using var other = await RegisterAsync();
        var progress = await SendAsync(user.Client, HttpMethod.Put, "/api/v1/me/progress/" + Main, new { positionSeconds = 30, completed = false, version = 0 });
        Assert.Equal(1, progress.GetProperty("data").GetProperty("version").GetInt64());
        await SendAsync(user.Client, HttpMethod.Put, "/api/v1/me/progress/" + Main, new { positionSeconds = 40, completed = false, version = 0 }, HttpStatusCode.Conflict);
        fixture.Clock.Advance(TimeSpan.FromSeconds(1));
        await SendAsync(user.Client, HttpMethod.Put, "/api/v1/me/progress/episode_demo_main_a", new { positionSeconds = 1440, completed = true, version = 0 });
        var watching = await SendAsync(user.Client, HttpMethod.Get, "/api/v1/me/progress?collection=watching");
        Assert.Equal(0, watching.GetProperty("meta").GetProperty("total").GetInt32());
        var isolated = await SendAsync(other.Client, HttpMethod.Get, "/api/v1/me/progress");
        Assert.Equal(0, isolated.GetProperty("meta").GetProperty("total").GetInt32());
        await SendAsync(user.Client, HttpMethod.Put, "/api/v1/me/library/anime_demo_001", new { status = "watching", isFavorite = true, version = 0 });
        await SendAsync(user.Client, HttpMethod.Put, "/api/v1/me/library/anime_demo_001", new { status = "watching", isFavorite = false, version = 1 });
        var filtered = await SendAsync(user.Client, HttpMethod.Get, "/api/v1/me/library?q=no-match&pageSize=1");
        Assert.Empty(filtered.GetProperty("data").EnumerateArray()); Assert.Equal(1, filtered.GetProperty("summary").GetProperty("total").GetInt32());
        var entries = await SendAsync(user.Client, HttpMethod.Get, "/api/v1/me/library");
        Assert.Equal("anime_demo_001", entries.GetProperty("data")[0].GetProperty("animeId").GetString());
        Assert.False(entries.GetProperty("data")[0].GetProperty("isFavorite").GetBoolean());
        var rows = await SendAsync(user.Client, HttpMethod.Get, "/api/v1/me/progress");
        Assert.True(rows.GetProperty("data")[0].TryGetProperty("episodeId", out _));
        var summary = (await SendAsync(user.Client, HttpMethod.Get, "/api/v1/me/library/summary")).GetProperty("data");
        Assert.Equal(0, summary.GetProperty("favoriteAnimeCount").GetInt32());
        Assert.Equal(1, summary.GetProperty("inProgressEpisodeCount").GetInt32()); Assert.Equal(1, summary.GetProperty("completedEpisodeCount").GetInt32());
        await SendAsync(user.Client, HttpMethod.Delete, "/api/v1/me/library/anime_demo_001?version=2", status: HttpStatusCode.NoContent);
        var history = await SendAsync(user.Client, HttpMethod.Get, "/api/v1/me/progress?page=2147483647");
        Assert.Equal(2, history.GetProperty("meta").GetProperty("total").GetInt32()); Assert.Empty(history.GetProperty("data").EnumerateArray());
        await SendAsync(user.Client, HttpMethod.Put, "/api/v1/me/progress/episode_demo_main_draft", new { positionSeconds = 1 }, HttpStatusCode.NotFound);
        await SendAsync(user.Client, HttpMethod.Put, "/api/v1/me/progress/" + Main, new { positionSeconds = 99999, version = 1 }, HttpStatusCode.BadRequest);
        await SendAsync(user.Client, HttpMethod.Put, "/api/v1/me/progress/episode_demo_side", new { positionSeconds = 5000, completed = false, version = 0 });
    }
    [PostgreSqlFact]
    public async Task CommentsOwnModerationAndDeletedContentAreProtectedAsync()
    {
        using var author = await RegisterAsync(); using var other = await RegisterAsync(); using var admin = await RegisterAsync("admin");
        var created = (await SendAsync(author.Client, HttpMethod.Post, "/api/v1/me/anime/anime_demo_001/comments", new { body = "  Fixture comment  " }, HttpStatusCode.Created)).GetProperty("data");
        var id = created.GetProperty("id").GetString(); Assert.Equal("Fixture comment", created.GetProperty("body").GetString());
        Assert.False(created.GetProperty("author").TryGetProperty("email", out _));
        await SendAsync(other.Client, HttpMethod.Patch, "/api/v1/me/comments/" + id, new { body = "Stolen", version = 1 }, HttpStatusCode.NotFound);
        await SendAsync(admin.Client, HttpMethod.Post, $"/api/v1/admin/comments/{id}/moderations", new { action = "hide", reason = "Fixture reason", version = 1 });
        await SendAsync(author.Client, HttpMethod.Patch, "/api/v1/me/comments/" + id, new { body = "Restore by edit", version = 2 }, HttpStatusCode.Conflict);
        var list = await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/anime/anime_demo_001/comments?pageSize=50");
        Assert.DoesNotContain(list.GetProperty("data").EnumerateArray(), x => x.GetProperty("id").GetString() == id);
        await SendAsync(author.Client, HttpMethod.Delete, $"/api/v1/me/comments/{id}?version=2", status: HttpStatusCode.NoContent);
        var deleted = (await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/comments/" + id)).GetProperty("data");
        Assert.Equal(JsonValueKind.Null, deleted.GetProperty("comment").GetProperty("body").ValueKind);
        Assert.Equal("hide", deleted.GetProperty("lastModeration").GetProperty("action").GetString());
        await SendAsync(admin.Client, HttpMethod.Post, $"/api/v1/admin/comments/{id}/moderations", new { action = "restore", reason = "Not allowed", version = 3 }, HttpStatusCode.Conflict);
        await SendAsync(admin.Client, HttpMethod.Get, "/api/v1/admin/comments?q=fixture&sort=updated&pageSize=1");
    }
}
