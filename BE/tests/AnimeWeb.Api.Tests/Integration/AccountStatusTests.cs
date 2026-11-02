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
public sealed class AccountStatusTests(CatalogDatabaseFixture fixture) : IClassFixture<CatalogDatabaseFixture>
{
    private const string Password = "Fixture-status-password-123";
    private sealed record Actor(string Id, string Email, HttpClient Client);
    private async Task<Actor> Register(string role)
    {
        var client = fixture.Factory.CreateClient();
        var email = Guid.NewGuid().ToString("N") + "@status.invalid";
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new { email, password = Password, displayName = "Status fixture" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var data = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        var id = data.GetProperty("profile").GetProperty("id").GetString()!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", data.GetProperty("accessToken").GetString());
        if (role != "user")
        {
            await using var scope = fixture.Factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
            await db.UserRoles.Where(x => x.UserId == id).ExecuteDeleteAsync();
            db.UserRoles.Add(new() { UserId = id, RoleCode = role });
            await db.SaveChangesAsync();
        }
        return new(id, email, client);
    }
    private static async Task<JsonElement> Body(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
    private static Task<HttpResponseMessage> Set(Actor actor, string id, string status, long version) =>
        actor.Client.PatchAsJsonAsync($"/api/v1/admin/users/{id}/status", new { status, version });

    [PostgreSqlFact]
    public async Task RoleBoundariesVersionsSessionRevocationAndConcurrentAdministratorProtectionAsync()
    {
        var admin = await Register("admin");
        var other = await Register("admin");
        var manager = await Register("manage");
        var user = await Register("user");
        using var guest = fixture.Factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.PatchAsJsonAsync($"/api/v1/admin/users/{user.Id}/status", new { status = "blocked", version = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Set(user, user.Id, "blocked", 1)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Set(manager, user.Id, "blocked", 1)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Set(admin, user.Id, "unknown", 1)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.Client.PatchAsJsonAsync($"/api/v1/admin/users/{user.Id}/status", new { status = "blocked" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Set(admin, "missing", "blocked", 1)).StatusCode);
        var self = await Set(admin, admin.Id, "blocked", 1);
        Assert.Equal(HttpStatusCode.Conflict, self.StatusCode);
        Assert.Equal("SELF_BLOCK_NOT_ALLOWED", (await self.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("error").GetProperty("code").GetString());

        var blocked = await Set(admin, user.Id, "blocked", 1);
        Assert.Equal(HttpStatusCode.OK, blocked.StatusCode);
        Assert.Equal(2, (await Body(blocked)).GetProperty("version").GetInt64());
        Assert.Equal(HttpStatusCode.Unauthorized, (await user.Client.GetAsync("/api/v1/me")).StatusCode);
        var deniedLogin = await guest.PostAsJsonAsync("/api/v1/auth/login", new { email = user.Email, password = Password });
        Assert.Equal(HttpStatusCode.Forbidden, deniedLogin.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Set(admin, user.Id, "active", 1)).StatusCode);
        var unblocked = await Set(admin, user.Id, "active", 2);
        Assert.Equal(HttpStatusCode.OK, unblocked.StatusCode);
        Assert.Equal(3, (await Body(unblocked)).GetProperty("version").GetInt64());
        Assert.Equal(HttpStatusCode.Unauthorized, (await user.Client.GetAsync("/api/v1/me")).StatusCode);
        var login = await guest.PostAsJsonAsync("/api/v1/auth/login", new { email = user.Email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.Equal(3, (await Body(await Set(admin, user.Id, "active", 3))).GetProperty("version").GetInt64());
        var race = await Task.WhenAll(Set(admin, user.Id, "blocked", 3), Set(other, user.Id, "blocked", 3));
        Assert.Single(race, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Single(race, x => x.StatusCode == HttpStatusCode.Conflict);

        var cross = await Task.WhenAll(Set(admin, other.Id, "blocked", 1), Set(other, admin.Id, "blocked", 1));
        Assert.Single(cross, x => x.StatusCode == HttpStatusCode.OK);
        Assert.All(cross.Where(x => x.StatusCode != HttpStatusCode.OK), x =>
            Assert.Contains(x.StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden, HttpStatusCode.Conflict }));
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        var activeAdmins = await db.Accounts.Where(x => x.Status == "active" && db.UserRoles.Any(r => r.UserId == x.Id && r.RoleCode == "admin")).ToListAsync();
        var survivor = Assert.Single(activeAdmins);
        // Deliberately grant a non-admin fixture the permission to exercise the last-admin guard independently of self-block protection.
        db.RolePermissions.Add(new() { RoleCode = "manage", PermissionCode = "admin:user:status:write" });
        await db.SaveChangesAsync();
        var last = await Set(manager, survivor.Id, "blocked", survivor.Version);
        Assert.Equal(HttpStatusCode.Conflict, last.StatusCode);
        Assert.Equal("LAST_ACTIVE_ADMIN", (await last.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(1, await db.Accounts.CountAsync(x => x.Status == "active" && db.UserRoles.Any(r => r.UserId == x.Id && r.RoleCode == "admin")));
    }
}
