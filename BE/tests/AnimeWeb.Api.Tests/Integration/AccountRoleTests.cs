using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Integration;

[Trait("Category", "PostgreSQL")]
public sealed class AccountRoleTests(CatalogDatabaseFixture fixture) : IClassFixture<CatalogDatabaseFixture>
{
    private const string Password = "Fixture-role-password-123";
    private sealed record Actor(string Id, string Email, HttpClient Client);
    private async Task<Actor> Register(string role)
    {
        var client = fixture.Factory.CreateClient();
        var email = Guid.NewGuid().ToString("N") + "@role.invalid";
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new { email, password = Password, displayName = "Role fixture" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var data = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        var id = data.GetProperty("profile").GetProperty("id").GetString()!;
        client.DefaultRequestHeaders.Authorization = new("Bearer", data.GetProperty("accessToken").GetString());
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
    private async Task<HttpClient> Login(Actor actor)
    {
        var client = fixture.Factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { email = actor.Email, password = Password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var data = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        client.DefaultRequestHeaders.Authorization = new("Bearer", data.GetProperty("accessToken").GetString());
        return client;
    }
    private static Task<HttpResponseMessage> Set(Actor actor, string id, string role, long version) =>
        actor.Client.PatchAsJsonAsync($"/api/v1/admin/users/{id}/role", new { role, version });
    private static async Task<JsonElement> Data(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
    private static async Task Error(HttpResponseMessage response, string code)
    {
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(code, (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("error").GetProperty("code").GetString());
    }
    [PostgreSqlFact]
    public async Task RolesValidationRevocationAndConcurrentRoleStatusChangesAsync()
    {
        var admin = await Register("admin");
        var other = await Register("admin");
        var manager = await Register("manage");
        var user = await Register("user");
        using var guest = fixture.Factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.PatchAsJsonAsync($"/api/v1/admin/users/{user.Id}/role", new { role = "admin", version = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Set(user, user.Id, "admin", 1)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await Set(manager, user.Id, "admin", 1)).StatusCode);
        foreach (var invalid in new[] { "manager", "owner", "Admin", "", "user,admin" })
            Assert.Equal(HttpStatusCode.BadRequest, (await Set(admin, user.Id, invalid, 1)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Set(admin, user.Id, "manage", 0)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.Client.PatchAsJsonAsync($"/api/v1/admin/users/{user.Id}/role", new { role = "manage" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Set(admin, "missing", "manage", 1)).StatusCode);
        await Error(await Set(admin, admin.Id, "user", 1), "SELF_ROLE_CHANGE_NOT_ALLOWED");
        Assert.Equal(1, (await Data(await Set(admin, admin.Id, "admin", 1))).GetProperty("version").GetInt64());
        Assert.Equal(HttpStatusCode.OK, (await admin.Client.GetAsync("/api/v1/me")).StatusCode);
        using var secondSession = await Login(user);
        var promoted = await Set(admin, user.Id, "manage", 1);
        Assert.Equal(HttpStatusCode.OK, promoted.StatusCode);
        var dto = await Data(promoted);
        Assert.Equal(2, dto.GetProperty("version").GetInt64());
        Assert.Equal("manage", Assert.Single(dto.GetProperty("roles").EnumerateArray()).GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, (await user.Client.GetAsync("/api/v1/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await secondSession.GetAsync("/api/v1/me")).StatusCode);
        using var manageLogin = await Login(user);
        Assert.Equal(HttpStatusCode.OK, (await manageLogin.GetAsync("/api/v1/admin/users")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await manageLogin.PatchAsJsonAsync($"/api/v1/admin/users/{user.Id}/role", new { role = "admin", version = 2 })).StatusCode);
        await Error(await Set(admin, user.Id, "user", 1), "CONFLICT");
        Assert.Equal(3, (await Data(await Set(admin, user.Id, "user", 2))).GetProperty("version").GetInt64());
        Assert.Equal(HttpStatusCode.Unauthorized, (await manageLogin.GetAsync("/api/v1/admin/users")).StatusCode);
        using var userLogin = await Login(user);
        Assert.Equal(HttpStatusCode.Forbidden, (await userLogin.GetAsync("/api/v1/admin/users")).StatusCode);
        Assert.Equal(4, (await Data(await Set(admin, user.Id, "admin", 3))).GetProperty("version").GetInt64());
        using var adminLogin = await Login(user);
        Assert.Equal(HttpStatusCode.OK, (await adminLogin.GetAsync("/api/v1/admin/users")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.Client.PatchAsJsonAsync($"/api/v1/admin/users/{user.Id}/status", new { status = "blocked", version = 4 })).StatusCode);
        var blockedRole = await Set(admin, user.Id, "manage", 5);
        Assert.Equal(HttpStatusCode.OK, blockedRole.StatusCode);
        dto = await Data(blockedRole);
        Assert.Equal("blocked", dto.GetProperty("status").GetString());
        Assert.Equal(6, dto.GetProperty("version").GetInt64());
        Assert.Equal(HttpStatusCode.Unauthorized, (await adminLogin.GetAsync("/api/v1/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await guest.PostAsJsonAsync("/api/v1/auth/login", new { email = user.Email, password = Password })).StatusCode);
        // Normalize a historical multi-role assignment rather than accumulating permissions.
        await using (var legacyScope = fixture.Factory.Services.CreateAsyncScope())
        {
            var legacyDb = legacyScope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
            legacyDb.UserRoles.Add(new() { UserId = user.Id, RoleCode = "user" });
            await legacyDb.SaveChangesAsync();
        }
        var normalized = await Data(await Set(admin, user.Id, "manage", 6));
        Assert.Equal(7, normalized.GetProperty("version").GetInt64());
        Assert.Equal("manage", Assert.Single(normalized.GetProperty("roles").EnumerateArray()).GetString());
        var race = await Task.WhenAll(Set(admin, manager.Id, "user", 1),
            other.Client.PatchAsJsonAsync($"/api/v1/admin/users/{manager.Id}/status", new { status = "blocked", version = 1 }));
        Assert.Single(race, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Single(race, x => x.StatusCode == HttpStatusCode.Conflict);
        var cross = await Task.WhenAll(Set(admin, other.Id, "user", 1), Set(other, admin.Id, "manage", 1));
        Assert.Single(cross, x => x.StatusCode == HttpStatusCode.OK);
        Assert.All(cross.Where(x => x.StatusCode != HttpStatusCode.OK), x =>
            Assert.Contains(x.StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden, HttpStatusCode.Conflict }));
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        var activeAdmins = await db.Accounts.Where(x => x.Status == "active" && db.UserRoles.Any(r => r.UserId == x.Id && r.RoleCode == "admin")).ToListAsync();
        var survivor = Assert.Single(activeAdmins);
        // Isolated fixture only: independently exercise the last-admin guard with a delegated permission.
        var delegated = await Register("manage");
        db.RolePermissions.Add(new() { RoleCode = "manage", PermissionCode = "admin:user:role:write" });
        await db.SaveChangesAsync();
        await Error(await Set(delegated, survivor.Id, "user", survivor.Version), "LAST_ACTIVE_ADMIN");
        // A permission revoked while an actor was waiting for the admin lock cannot be used.
        var loser = survivor.Id == admin.Id ? other : admin;
        Assert.Contains((await Set(loser, user.Id, "user", 6)).StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden });
        Assert.Equal(1, await db.Accounts.CountAsync(x => x.Status == "active" && db.UserRoles.Any(r => r.UserId == x.Id && r.RoleCode == "admin")));
    }
}
