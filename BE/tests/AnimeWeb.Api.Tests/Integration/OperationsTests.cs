using System.Net;
using AnimeWeb.Api.Features.Operations;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Integration;

public sealed partial class FeatureWorkflowTests
{
    [PostgreSqlFact]
    public async Task OperationsRequireAdminReadAndPlayerReportsAreBoundedAsync()
    {
        using var user = await RegisterAsync(); using var manager = await RegisterAsync("manage");
        await SendAsync(fixture.Client, HttpMethod.Get, "/api/v1/admin/operations", status: HttpStatusCode.Unauthorized);
        await SendAsync(user.Client, HttpMethod.Get, "/api/v1/admin/operations", status: HttpStatusCode.Forbidden);
        await SendAsync(user.Client, HttpMethod.Post, $"/api/v1/common/episodes/{Main}/playback-reports", new { kind = "media" }, HttpStatusCode.NoContent);
        await SendAsync(user.Client, HttpMethod.Post, $"/api/v1/common/episodes/{Main}/playback-reports", new { kind = "media", url = "https://secret.fixture.invalid" }, HttpStatusCode.BadRequest);
        await SendAsync(user.Client, HttpMethod.Post, $"/api/v1/common/episodes/{Main}/playback-reports", new { kind = "https://secret.invalid?token=fixture" }, HttpStatusCode.BadRequest);
        await SendAsync(user.Client, HttpMethod.Post, "/api/v1/common/episodes/missing/playback-reports", new { kind = "media" }, HttpStatusCode.NotFound);
        var result = await SendAsync(manager.Client, HttpMethod.Get, "/api/v1/admin/operations");
        var data = result.GetProperty("data"); Assert.True(data.GetProperty("databaseReady").GetBoolean());
        Assert.True(data.GetProperty("runtime").GetProperty("clientPlaybackFailures").GetProperty("media").GetInt64() > 0);
        Assert.True(data.GetProperty("runtime").GetProperty("database").GetProperty("count").GetInt64() > 0);
        Assert.DoesNotContain(user.Token, result.GetRawText()); Assert.DoesNotContain("Password", result.GetRawText());
        await using var limited = await TrafficFactoryAsync(new() { ["RateLimits:Telemetry"] = "1" });
        using var client = limited.CreateClient();
        await SendAsync(client, HttpMethod.Post, $"/api/v1/common/episodes/{Main}/playback-reports", new { kind = "hls" }, HttpStatusCode.NoContent);
        await SendAsync(client, HttpMethod.Post, $"/api/v1/common/episodes/{Main}/playback-reports", new { kind = "hls" }, HttpStatusCode.TooManyRequests);
    }
}

public sealed class OperationsBoundsTests
{
    [Fact]
    public void RouteStatsAreBoundedAndMetricsDoNotRetainRawPayloads()
    {
        using var diagnostics = new RuntimeDiagnostics();
        for (var i = 0; i < 1000; i++) { diagnostics.Begin(); diagnostics.End("route-" + i, 25, i % 2 == 0 ? 500 : 429); }
        var result = diagnostics.Snapshot(); Assert.InRange(result.Requests.Length, 1, 129);
        Assert.Equal(1000, result.Requests.Sum(row => row.Count)); Assert.Equal(0, result.ActiveRequests);
        diagnostics.Cleanup(DateTimeOffset.UtcNow, 3, null); diagnostics.Cleanup(DateTimeOffset.UtcNow, 0, "FixtureError");
        Assert.NotNull(diagnostics.Snapshot().Cleanup.LastSuccessAt); Assert.Equal("FixtureError", diagnostics.Snapshot().Cleanup.ErrorType);
    }
}
