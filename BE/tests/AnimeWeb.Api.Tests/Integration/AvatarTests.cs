using System.Buffers.Binary;
using System.IO.Compression;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Integration;

[Trait("Category", "PostgreSQL")]
public sealed class AvatarTests(CatalogDatabaseFixture fixture) : IClassFixture<CatalogDatabaseFixture>
{
    private async Task<(HttpClient Client, string Id)> Register()
    {
        var client = fixture.Factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email = Guid.NewGuid().ToString("N") + "@avatar.invalid",
            password = "Fixture-avatar-password-123",
            displayName = "Avatar fixture"
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var data = await Data(response);
        client.DefaultRequestHeaders.Authorization = new("Bearer", data.GetProperty("accessToken").GetString());
        var profile = data.GetProperty("profile");
        Assert.Equal(JsonValueKind.Null, profile.GetProperty("avatarUrl").ValueKind);
        Assert.Contains(profile.GetProperty("permissions").EnumerateArray(), x => x.GetString() == "profile:avatar:write:own");
        return (client, profile.GetProperty("id").GetString()!);
    }
    private static async Task<JsonElement> Data(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
    private static async Task<HttpResponseMessage> Upload(HttpClient client, byte[] bytes, long version = 1, string type = "image/png")
    {
        using var body = new ByteArrayContent(bytes);
        body.Headers.ContentType = new(type);
        return await client.PutAsync($"/api/v1/me/avatar?version={version}", body);
    }
    public static byte[] Png(int width = 2, int height = 2, int excess = 0)
    {
        using var output = new MemoryStream();
        output.Write(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 });
        var header = new byte[13];
        BinaryPrimitives.WriteUInt32BigEndian(header, (uint)width);
        BinaryPrimitives.WriteUInt32BigEndian(header.AsSpan(4), (uint)height);
        header[8] = 8; header[9] = 6;
        Chunk("IHDR", header);
        using var compressed = new MemoryStream();
        using (var zip = new ZLibStream(compressed, CompressionMode.Compress, true))
            zip.Write(new byte[(width * 4 + 1) * height + excess]);
        Chunk("IDAT", compressed.ToArray());
        Chunk("IEND", []);
        return output.ToArray();
        void Chunk(string type, byte[] data)
        {
            var size = new byte[4];
            BinaryPrimitives.WriteUInt32BigEndian(size, (uint)data.Length); output.Write(size);
            var payload = Encoding.ASCII.GetBytes(type).Concat(data).ToArray();
            output.Write(payload);
            uint crc = uint.MaxValue;
            foreach (var value in payload)
            {
                crc ^= value;
                for (var bit = 0; bit < 8; bit++) crc = (crc >> 1) ^ ((crc & 1) == 0 ? 0u : 0xedb88320u);
            }
            BinaryPrimitives.WriteUInt32BigEndian(size, ~crc); output.Write(size);
        }
    }
    [PostgreSqlFact]
    public async Task UploadReplaceDeleteOwnershipVersionsAndImageValidationAsync()
    {
        var (owner, id) = await Register();
        var (other, _) = await Register();
        using var guest = fixture.Factory.CreateClient();
        // Actual Chromium canvas output from the JPEG conversion used by avatar.browser.mjs.
        var resource = typeof(AvatarTests).Assembly.GetManifestResourceNames().Single(x => x.EndsWith("avatar-canvas.base64", StringComparison.Ordinal));
        using var reader = new StreamReader(typeof(AvatarTests).Assembly.GetManifestResourceStream(resource)!);
        var png = Convert.FromBase64String(await reader.ReadToEndAsync());
        Assert.Equal(HttpStatusCode.Unauthorized, (await Upload(guest, png)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.DeleteAsync("/api/v1/me/avatar?version=1")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Upload(owner, png, 0)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PutAsync("/api/v1/me/avatar", new ByteArrayContent(png))).StatusCode);
        Assert.Equal(HttpStatusCode.UnsupportedMediaType, (await Upload(owner, png, type: "image/svg+xml")).StatusCode);
        foreach (var invalid in new[] { Array.Empty<byte>(), Encoding.UTF8.GetBytes("<svg onload='alert(1)'/>"), Png(513), Png(excess: 1), png[..^1] })
            Assert.Equal(HttpStatusCode.BadRequest, (await Upload(owner, invalid)).StatusCode);
        var corrupt = png.ToArray(); corrupt[30] ^= 1;
        Assert.Equal(HttpStatusCode.BadRequest, (await Upload(owner, corrupt)).StatusCode);
        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, (await Upload(owner, new byte[AvatarService.MaxBytes + 1])).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await guest.GetAsync("/api/v1/common/avatars/missing/key")).StatusCode);

        var saved = await Upload(owner, png);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var profile = await Data(saved);
        Assert.Equal(2, profile.GetProperty("version").GetInt64());
        var firstUrl = profile.GetProperty("avatarUrl").GetString()!;
        var image = await guest.GetAsync(firstUrl);
        Assert.Equal(HttpStatusCode.OK, image.StatusCode);
        Assert.Equal("image/png", image.Content.Headers.ContentType!.MediaType);
        Assert.Equal("nosniff", Assert.Single(image.Headers.GetValues("X-Content-Type-Options")));
        Assert.Equal(png, await image.Content.ReadAsByteArrayAsync());
        Assert.Equal(firstUrl, (await Data(await owner.GetAsync("/api/v1/me"))).GetProperty("avatarUrl").GetString());
        Assert.Equal(JsonValueKind.Null, (await Data(await other.GetAsync("/api/v1/me"))).GetProperty("avatarUrl").ValueKind);
        // There is no target-user parameter accepted by the mutation endpoint.
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsync($"/api/v1/me/avatar/{id}?version=2", new ByteArrayContent(png))).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Upload(other, png, 2)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Upload(owner, png, 1)).StatusCode);
        var replacement = await Data(await Upload(owner, Png(3), 2));
        var secondUrl = replacement.GetProperty("avatarUrl").GetString()!;
        Assert.NotEqual(firstUrl, secondUrl);
        Assert.Equal(HttpStatusCode.NotFound, (await guest.GetAsync(firstUrl)).StatusCode);
        var removed = await owner.DeleteAsync("/api/v1/me/avatar?version=3");
        Assert.Equal(HttpStatusCode.OK, removed.StatusCode);
        profile = await Data(removed);
        Assert.Equal(4, profile.GetProperty("version").GetInt64());
        Assert.Equal(JsonValueKind.Null, profile.GetProperty("avatarUrl").ValueKind);
        Assert.Equal(HttpStatusCode.NotFound, (await guest.GetAsync(secondUrl)).StatusCode);
        Assert.Equal(4, (await Data(await owner.DeleteAsync("/api/v1/me/avatar?version=4"))).GetProperty("version").GetInt64());
        var race = await Task.WhenAll(Upload(owner, png, 4), Upload(owner, Png(3), 4));
        Assert.Single(race, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Single(race, x => x.StatusCode == HttpStatusCode.Conflict);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync("/api/v1/me")).StatusCode);
        await using var scope = fixture.Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        Assert.Single(await db.AccountAvatars.Where(x => x.UserId == id).ToListAsync());
        var (admin, adminId) = await Register();
        await db.UserRoles.Where(x => x.UserId == adminId).ExecuteDeleteAsync();
        db.UserRoles.Add(new() { UserId = adminId, RoleCode = "admin" });
        await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.OK, (await admin.PatchAsJsonAsync($"/api/v1/admin/users/{id}/status", new { status = "blocked", version = 5 })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Upload(owner, png, 6)).StatusCode);
        await db.RolePermissions.Where(x => x.PermissionCode == "profile:avatar:write:own").ExecuteDeleteAsync();
        Assert.Equal(HttpStatusCode.Forbidden, (await Upload(other, png)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await other.DeleteAsync("/api/v1/me/avatar?version=1")).StatusCode);
    }
}
