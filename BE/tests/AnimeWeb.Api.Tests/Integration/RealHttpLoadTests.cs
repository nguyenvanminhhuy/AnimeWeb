using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Features.Playback;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Integration;

[CollectionDefinition("Isolated HTTP load", DisableParallelization = true)]
public sealed class HttpLoadCollection;

[Collection("Isolated HTTP load")]
public sealed class RealHttpLoadTests
{
    private sealed record Stage(int Users, int Requests, double Seconds, double RequestsPerSecond, double P50Ms, double P95Ms, double P99Ms,
        long ResponseBytes, long WorkingSetBytes, double CpuMs, Dictionary<int, int> Statuses);
    [PostgreSqlFact]
    [Trait("Category", "Load")]
    public async Task LoopbackKestrelStagesMeasureApiAndSyntheticRangeTrafficAsync()
    {
        var seconds = 0;
        var configured = Environment.GetEnvironmentVariable("ANIMEWEB_LOAD_SECONDS");
        if (configured is not null && (!int.TryParse(configured, out seconds) || seconds is < 0 or > 60))
            throw new InvalidOperationException("ANIMEWEB_LOAD_SECONDS must be 0..60 seconds per stage.");
        var isolated = new EpisodeDatabaseFixture(); await isolated.InitializeAsync();
        try
        {
            string? connection;
            await using (var scope = isolated.Factory.Services.CreateAsyncScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>(); connection = db.Database.GetConnectionString();
                db.PlaybackSources.Add(new PlaybackSource { EpisodeId = "episode_demo_main_z", Url = "https://media.fixture.invalid/load.mp4", Enabled = true });
                await db.SaveChangesAsync();
            }
            await using var host = new ApiFactory(connection, clock: isolated.Clock, settings: new Dictionary<string, string?> { ["CatalogCache:Enabled"] = "true" });
            host.UseKestrel(0);
            using var client = host.CreateClient();
            Assert.True(IPAddress.IsLoopback(Dns.GetHostAddresses(client.BaseAddress!.Host)[0]));
            var tokens = new List<string>();
            for (var i = 0; i < 50; i++)
            {
                using var response = await client.PostAsJsonAsync("/api/v1/auth/register", new { email = $"load-{Guid.NewGuid():N}@fixture.invalid", password = "Fixture-password-123", displayName = "Load fixture" });
                Assert.Equal(HttpStatusCode.Created, response.StatusCode);
                tokens.Add((await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").GetProperty("accessToken").GetString()!);
            }
            var versions = new long[50]; var stages = new List<Stage>();
            foreach (var users in new[] { 5, 20, 50 })
            {
                var times = new ConcurrentBag<double>(); var statuses = new ConcurrentDictionary<int, int>(); long bytes = 0;
                var process = Process.GetCurrentProcess(); var cpu = process.TotalProcessorTime; var clock = Stopwatch.StartNew();
                await Task.WhenAll(Enumerable.Range(0, users).Select(async user =>
                {
                    async Task Send(string path, HttpMethod method, object? body = null, bool range = false)
                    {
                        using var request = new HttpRequestMessage(method, path);
                        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokens[user]);
                        if (body is not null) request.Content = JsonContent.Create(body);
                        if (range) request.Headers.Range = new RangeHeaderValue(0, 65535);
                        var watch = Stopwatch.StartNew();
                        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
                        var content = await response.Content.ReadAsByteArrayAsync();
                        times.Add(watch.Elapsed.TotalMilliseconds); statuses.AddOrUpdate((int)response.StatusCode, 1, (_, count) => count + 1); Interlocked.Add(ref bytes, content.Length);
                        Assert.Equal(range ? HttpStatusCode.PartialContent : HttpStatusCode.OK, response.StatusCode);
                        if (range) { Assert.Equal(65536, content.Length); Assert.Equal(0, response.Content.Headers.ContentRange!.From); }
                    }
                    for (var iteration = 0; seconds > 0 ? clock.Elapsed.TotalSeconds < seconds : iteration < 3; iteration++)
                    {
                        await Send(iteration switch { 0 => "/api/v1/common/home", 1 => "/api/v1/common/anime?q=hanh", _ => "/api/v1/common/episodes/episode_demo_main_z/playback" }, HttpMethod.Get);
                        await Send("/api/v1/me/progress/episode_demo_main_z", HttpMethod.Put, new { version = versions[user], positionSeconds = (iteration * 10 + users) % 600 }); versions[user]++;
                        await Send("/_tests/pipeline/media", HttpMethod.Get, range: true);
                    }
                }));
                clock.Stop(); var sorted = times.Order().ToArray();
                double Percentile(double p) => Math.Round(sorted[(int)Math.Ceiling(sorted.Length * p) - 1], 2);
                stages.Add(new(users, sorted.Length, Math.Round(clock.Elapsed.TotalSeconds, 3), Math.Round(sorted.Length / clock.Elapsed.TotalSeconds, 2), Percentile(0.5), Percentile(0.95), Percentile(0.99), bytes, process.WorkingSet64, Math.Round((process.TotalProcessorTime - cpu).TotalMilliseconds, 2), new(statuses)));
            }
            var directory = new DirectoryInfo(AppContext.BaseDirectory);
            while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "AnimeWeb.slnx"))) directory = directory.Parent;
            Assert.NotNull(directory);
            var output = Path.Combine(directory.FullName, ".local", "load-tests"); Directory.CreateDirectory(output);
            var report = JsonSerializer.Serialize(new
            {
                GeneratedAt = DateTimeOffset.UtcNow,
                PoolMax = 8,
                SustainedSecondsPerStage = seconds,
                Transport = "Loopback Kestrel HTTP",
                Database = "Isolated PostgreSQL fixture",
                RateLimits = "Fixture Global=10000/Auth=1000",
                Media = "Synthetic 256KiB file, 64KiB Range reads; no video decode or outside provider",
                Stages = stages
            }, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(Path.Combine(output, "latest.json"), report);
            await File.WriteAllTextAsync(Path.Combine(output, seconds > 0 ? "sustained.json" : "smoke.json"), report);
            if (seconds == 0) Assert.Equal(675, stages.Sum(stage => stage.Requests));
            else Assert.All(stages, stage => Assert.True(stage.Requests > 0));
        }
        finally { await isolated.DisposeAsync(); }
    }
}
