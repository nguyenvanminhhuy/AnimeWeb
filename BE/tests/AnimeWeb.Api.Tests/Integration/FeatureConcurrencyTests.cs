using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Integration;

public sealed partial class FeatureWorkflowTests
{
    [PostgreSqlFact]
    public async Task ConcurrentProgressAndSubtitleWritesPreserveVersionsAndSingleDefaultAsync()
    {
        using var user = await RegisterAsync();
        var url = "/api/v1/me/progress/episode_demo_main_b";
        await SendAsync(user.Client, HttpMethod.Put, url, new { positionSeconds = 1, version = 0 });
        var writes = await Task.WhenAll(user.Client.PutAsJsonAsync(url, new { positionSeconds = 10, version = 1 }),
            user.Client.PutAsJsonAsync(url, new { positionSeconds = 20, version = 1 }));
        Assert.Single(writes, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Single(writes, x => x.StatusCode == HttpStatusCode.Conflict);
        var conflict = await writes.Single(x => x.StatusCode == HttpStatusCode.Conflict).Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("PROGRESS_CONFLICT", conflict.GetProperty("error").GetProperty("code").GetString());
        foreach (var response in writes) response.Dispose();
        using var admin = await RegisterAsync("admin");
        var source = (await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/playback-sources", new
        { episodeId = "episode_demo_main_b", label = "Concurrent", language = "vi", url = "https://media.fixture.invalid/concurrent.mp4" }, HttpStatusCode.Created)).GetProperty("data");
        var sourceId = source.GetProperty("id").GetString();
        object Track(string label) => new { playbackSourceId = sourceId, label, language = "vi", format = "vtt", url = "https://media.fixture.invalid/test.vtt", isDefault = true };
        var tracks = await Task.WhenAll(admin.Client.PostAsJsonAsync("/api/v1/admin/subtitles", Track("A")), admin.Client.PostAsJsonAsync("/api/v1/admin/subtitles", Track("B")));
        Assert.All(tracks, x => Assert.Equal(HttpStatusCode.Created, x.StatusCode));
        foreach (var response in tracks) response.Dispose();
        var result = (await SendAsync(admin.Client, HttpMethod.Get, $"/api/v1/admin/playback-sources/{sourceId}/subtitles")).GetProperty("data");
        Assert.Single(result.EnumerateArray(), x => x.GetProperty("isDefault").GetBoolean());
    }
    [PostgreSqlFact]
    public async Task BootstrapIsExplicitIdempotentAndDoesNotElevateRegisteredAccountAsync()
    {
        var isolated = new CatalogDatabaseFixture();
        await isolated.InitializeAsync();
        try
        {
            var registered = (await SendAsync(isolated.Client, HttpMethod.Post, "/api/v1/auth/register",
                new { displayName = "Regular user", email = "regular@fixture.invalid", password = Password }, HttpStatusCode.Created))
                .GetProperty("data").GetProperty("profile").GetProperty("id").GetString();
            await using var scope = isolated.Factory.Services.CreateAsyncScope();
            var bootstrap = scope.ServiceProvider.GetRequiredService<AdminBootstrap>();
            var db = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
            Assert.True(await bootstrap.CreateAsync(new RegisterInput { DisplayName = "Bootstrap", Email = Guid.NewGuid() + "@fixture.invalid", Password = Password }));
            Assert.False(await bootstrap.CreateAsync(new RegisterInput { DisplayName = "Bootstrap", Email = Guid.NewGuid() + "@fixture.invalid", Password = Password }));
            Assert.False(await db.UserRoles.AnyAsync(x => x.UserId == registered && x.RoleCode == "admin"));
        }
        finally { await isolated.DisposeAsync(); }
    }
    [PostgreSqlFact]
    public async Task ExpiredSourcesAreNotExposedAndUnknownProviderInputIsRejectedAsync()
    {
        using var admin = await RegisterAsync("admin");
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/playback-sources", new
        {
            episodeId = "episode_demo_side",
            label = "Expired",
            language = "vi",
            enabled = true,
            url = "https://media.fixture.invalid/expired.mp4",
            expiresAt = fixture.Clock.GetUtcNow().AddMinutes(-1)
        }, HttpStatusCode.Created);
        var playback = (await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/episodes/episode_demo_side/playback")).GetProperty("data");
        Assert.Empty(playback.GetProperty("sources").EnumerateArray());
        var detail = (await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/common/episodes/episode_demo_side")).GetProperty("data");
        Assert.False(detail.GetProperty("hasPlayback").GetBoolean());
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/playback-sources", new
        { episodeId = Main, providerKey = "unconfigured", label = "Invalid", language = "vi", url = "https://media.fixture.invalid/x.mp4" }, HttpStatusCode.BadRequest);
        await SendAsync(admin.Client, HttpMethod.Post, "/api/v1/admin/playback-sources", new
        { episodeId = Main, label = "Invalid", language = "vi", url = "https://user:secret@media.fixture.invalid/x.mp4" }, HttpStatusCode.BadRequest);
    }
}
