using System.Data.Common;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Features.Anime;
using AnimeWeb.Api.Features.Playback;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace AnimeWeb.Api.Tests.Integration;

public sealed partial class FeatureWorkflowTests
{
    private async Task<ApiFactory> TrafficFactoryAsync(Dictionary<string, string?> settings)
    {
        string? connection = null;
        await DatabaseAsync(db => { connection = db.Database.GetConnectionString(); return Task.CompletedTask; });
        return new ApiFactory(connection, clock: fixture.Clock, settings: settings);
    }

    [PostgreSqlFact]
    public async Task AccountsBehindOneIpHaveIndependentReadAndProgressLimitsAsync()
    {
        using var a = await RegisterAsync(); using var b = await RegisterAsync();
        await using var factory = await TrafficFactoryAsync(new() { ["RateLimits:UserRead"] = "2", ["RateLimits:Progress"] = "1" });
        using var first = factory.CreateClient(); using var second = factory.CreateClient();
        first.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", a.Token);
        second.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", b.Token);
        await SendAsync(first, HttpMethod.Get, "/api/v1/me"); await SendAsync(first, HttpMethod.Get, "/api/v1/me");
        await SendAsync(first, HttpMethod.Get, "/api/v1/me", status: HttpStatusCode.TooManyRequests);
        await SendAsync(second, HttpMethod.Get, "/api/v1/me");
        await SendAsync(first, HttpMethod.Put, $"/api/v1/me/progress/{Main}", new { version = 0, positionSeconds = 10 });
        await SendAsync(first, HttpMethod.Put, $"/api/v1/me/progress/{Main}", new { version = 1, positionSeconds = 20 }, HttpStatusCode.TooManyRequests);
        await SendAsync(second, HttpMethod.Put, $"/api/v1/me/progress/{Main}", new { version = 0, positionSeconds = 30 });
        await SendAsync(second, HttpMethod.Get, "/api/v1/me");
    }

    private sealed class ReadCounter : DbCommandInterceptor
    {
        private int count;
        public int Count => Volatile.Read(ref count);
        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command, CommandEventData eventData,
            InterceptionResult<DbDataReader> result, CancellationToken cancellationToken = default)
        { Interlocked.Increment(ref count); return ValueTask.FromResult(result); }
    }
    [PostgreSqlFact]
    public async Task PublicCacheCoalescesConcurrentMissesAndAdminArchiveInvalidatesAsync()
    {
        using var admin = await RegisterAsync("admin");
        await using var baseFactory = await TrafficFactoryAsync(new() { ["CatalogCache:Enabled"] = "true" });
        var counter = new ReadCounter();
        await using var factory = baseFactory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            services.AddDbContext<AnimeWebDbContext>(options => options.AddInterceptors(counter))));
        using var client = factory.CreateClient();
        var before = counter.Count;
        await SendAsync(client, HttpMethod.Get, "/api/v1/common/home");
        var cost = counter.Count - before; Assert.True(cost > 0);
        before = counter.Count;
        await SendAsync(client, HttpMethod.Get, "/api/v1/common/home"); Assert.Equal(before, counter.Count);
        factory.Services.GetRequiredService<PublicCatalogCache>().Invalidate();
        before = counter.Count;
        await Task.WhenAll(Enumerable.Range(0, 20).Select(_ => SendAsync(client, HttpMethod.Get, "/api/v1/common/home")));
        Assert.Equal(cost, counter.Count - before);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin.Token);
        var created = await SendAsync(client, HttpMethod.Post, "/api/v1/admin/anime", new { version = 0, title = "Cache fixture", slug = "cache-" + Guid.NewGuid().ToString("N"), releaseYear = 8888, posterUrl = "/fixture.svg", publicationStatus = "published" }, HttpStatusCode.Created);
        var id = created.GetProperty("data").GetProperty("anime").GetProperty("id").GetString();
        client.DefaultRequestHeaders.Authorization = null;
        var options = await SendAsync(client, HttpMethod.Get, "/api/v1/common/catalog/options");
        Assert.Contains(options.GetProperty("data").GetProperty("years").EnumerateArray(), x => x.GetInt32() == 8888);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin.Token);
        await SendAsync(client, HttpMethod.Patch, $"/api/v1/admin/anime/{id}/archive", new { version = 1, archived = true });
        client.DefaultRequestHeaders.Authorization = null;
        options = await SendAsync(client, HttpMethod.Get, "/api/v1/common/catalog/options");
        Assert.DoesNotContain(options.GetProperty("data").GetProperty("years").EnumerateArray(), x => x.GetInt32() == 8888);
    }

    [PostgreSqlFact]
    public async Task CleanupIsBoundedAndKeepsActiveSessionsAndViewEventsAsync()
    {
        var prefix = "cleanup-" + Guid.NewGuid().ToString("N");
        var isolated = new EpisodeDatabaseFixture();
        await isolated.InitializeAsync();
        try
        {
            await using var scope = isolated.Factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
            db.ViewSessions.AddRange(Enumerable.Range(0, 3).Select(i => new ViewSession { Id = prefix + i, EpisodeId = Main, ViewerHash = "fixture", StartedAt = isolated.Clock.GetUtcNow().AddHours(-2) }));
            db.ViewSessions.Add(new ViewSession { Id = prefix + "active", EpisodeId = Main, ViewerHash = "fixture", StartedAt = isolated.Clock.GetUtcNow() });
            await db.SaveChangesAsync();
            var events = await db.ViewEvents.CountAsync();
            var cleanup = new ViewSessionCleanup(db, isolated.Clock, Options.Create(new ViewSessionCleanupOptions { BatchSize = 2 }));
            Assert.Equal(2, await cleanup.RunAsync(CancellationToken.None));
            Assert.True(await db.ViewSessions.AnyAsync(x => x.Id == prefix + "active"));
            Assert.Equal(events, await db.ViewEvents.CountAsync());
            Assert.Equal(1, await cleanup.RunAsync(CancellationToken.None));
            Assert.Equal(0, await cleanup.RunAsync(CancellationToken.None));
            Assert.False(await db.ViewSessions.AnyAsync(x => x.Id.StartsWith(prefix) && x.Id != prefix + "active"));
        }
        finally { await isolated.DisposeAsync(); }
    }

    [PostgreSqlFact]
    public async Task CacheMissCannotRepopulateOldGenerationAfterInvalidationAsync()
    {
        await using var factory = await TrafficFactoryAsync(new() { ["CatalogCache:Enabled"] = "true" });
        _ = factory.CreateClient();
        var cache = factory.Services.GetRequiredService<PublicCatalogCache>();
        var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var calls = 0;
        var pending = cache.GetAsync("race", async (_, ct) =>
        {
            var call = Interlocked.Increment(ref calls);
            if (call == 1) { started.SetResult(); await release.Task.WaitAsync(ct); }
            return call;
        }, CancellationToken.None);
        await started.Task.WaitAsync(TimeSpan.FromSeconds(5));
        using (var cancelled = new CancellationTokenSource())
        {
            var waiting = cache.GetAsync("race", (_, _) => Task.FromResult(99), cancelled.Token);
            cancelled.Cancel();
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => waiting);
        }
        cache.Invalidate(); release.SetResult();
        Assert.Equal(2, await pending);
        Assert.Equal(2, await cache.GetAsync("race", (_, _) => Task.FromResult(99), CancellationToken.None));
    }

    [PostgreSqlFact]
    public async Task TwentyAccountsCanWatchOneEpisodeWithIndependentProgressAndIdempotentViewsAsync()
    {
        using var admin = await RegisterAsync("admin");
        var id = Guid.NewGuid().ToString("N"); var episodeId = "viewer-" + id;
        await DatabaseAsync(async db =>
        {
            var anime = new Anime { Id = id, Slug = "viewers-" + id, Title = "Concurrent fixture", PosterUrl = "/fixture.svg", ReleaseYear = 2025, PublicationStatus = "published" };
            var season = new AnimeWeb.Api.Features.Episodes.Season { Id = "season-" + id, AnimeId = id, Anime = anime, Number = 1, Title = "Fixture", SortOrder = 1 };
            var episode = new AnimeWeb.Api.Features.Episodes.Episode { Id = episodeId, SeasonId = season.Id, Season = season, Title = "Fixture", Number = 1, SortOrder = 1, DurationSeconds = 600, Status = "published", PublishedAt = fixture.Clock.GetUtcNow() };
            db.PlaybackSources.Add(new PlaybackSource { Id = "source-" + id, EpisodeId = episodeId, Episode = episode, Url = "https://media.fixture.invalid/movie.mp4", Enabled = true });
            await db.SaveChangesAsync();
        });
        var viewers = new List<TestAccount>();
        try
        {
            for (var i = 0; i < 20; i++) viewers.Add(await RegisterAsync());
            var watch = Stopwatch.StartNew();
            var sessions = await Task.WhenAll(viewers.Select(async (viewer, index) =>
            {
                await SendAsync(viewer.Client, HttpMethod.Get, $"/api/v1/common/episodes/{episodeId}/playback");
                await SendAsync(viewer.Client, HttpMethod.Put, $"/api/v1/me/progress/{episodeId}", new { version = 0, positionSeconds = index + 1 });
                var session = await SendAsync(viewer.Client, HttpMethod.Post, $"/api/v1/common/episodes/{episodeId}/view-sessions", new { positionSeconds = 0 }, HttpStatusCode.Created);
                return session.GetProperty("data").GetProperty("id").GetString();
            }));
            // Fixture timestamps simulate elapsed playback; no media or outside provider is contacted.
            await DatabaseAsync(db => db.ViewSessions.Where(x => sessions.Contains(x.Id)).ExecuteUpdateAsync(set => set.SetProperty(x => x.StartedAt, fixture.Clock.GetUtcNow().AddSeconds(-31))));
            var confirms = await Task.WhenAll(viewers.SelectMany((viewer, i) => Enumerable.Range(0, 2).Select(_ =>
                SendAsync(viewer.Client, HttpMethod.Post, $"/api/v1/common/view-sessions/{sessions[i]}/confirm", new { positionSeconds = 31 }))));
            Assert.Equal(20, confirms.Count(x => x.GetProperty("data").GetProperty("counted").GetBoolean()));
            await DatabaseAsync(async db =>
            {
                Assert.Equal(20, await db.ViewEvents.CountAsync(x => x.AnimeId == id));
                foreach (var (viewer, index) in viewers.Select((value, index) => (value, index)))
                    Assert.Equal(index + 1, await db.WatchProgress.Where(x => x.UserId == viewer.Id && x.EpisodeId == episodeId).Select(x => x.PositionSeconds).SingleAsync());
            });
            Console.WriteLine($"Concurrent viewer fixture: 20 accounts, 100 API requests, elapsed {watch.ElapsedMilliseconds} ms; TestServer only, not a video bandwidth benchmark.");
        }
        finally { foreach (var viewer in viewers) viewer.Dispose(); }
    }
}
