using System.Net;
using System.Text.Json;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.AspNetCore.Http;

namespace AnimeWeb.Api.Tests.Integration;

public sealed class TrafficTests
{
    [Theory]
    [InlineData("127.0.0.1", "198.51.100.23", "198.51.100.23", "https")]
    [InlineData("::ffff:127.0.0.1", "198.51.100.23", "198.51.100.23", "https")]
    [InlineData("192.0.2.10", "198.51.100.23", "192.0.2.10", "http")]
    [InlineData("127.0.0.1", "203.0.113.99, 198.51.100.23", "198.51.100.23", "https")]
    public async Task ForwardedIdentityOnlyComesFromTrustedProxyAsync(string peer, string forwarded, string expected, string scheme)
    {
        await using var factory = new ApiFactory();
        _ = factory.CreateClient();
        var result = await factory.Server.SendAsync(context =>
        {
            context.Connection.RemoteIpAddress = IPAddress.Parse(peer);
            context.Request.Method = "GET";
            context.Request.Scheme = "http";
            context.Request.Path = "/_tests/pipeline/client";
            context.Request.Headers["X-Forwarded-For"] = forwarded;
            context.Request.Headers["X-Forwarded-Proto"] = "https";
        });
        Assert.Equal(200, result.Response.StatusCode);
        var json = await JsonSerializer.DeserializeAsync<JsonElement>(result.Response.Body);
        Assert.Equal(expected, json.GetProperty("ip").GetString());
        Assert.Equal(scheme, json.GetProperty("scheme").GetString());
    }

    [Fact]
    public async Task ProxyClientsHaveIndependentGuestBudgetsAndRejectedRequestHasRetryAfterAsync()
    {
        await using var factory = new ApiFactory(settings: new Dictionary<string, string?> { ["RateLimits:PublicRead"] = "1" });
        _ = factory.CreateClient();
        async Task<HttpContext> Request(string ip) => await factory.Server.SendAsync(context =>
        {
            context.Connection.RemoteIpAddress = IPAddress.Loopback;
            context.Request.Method = "GET"; context.Request.Scheme = "http";
            context.Request.Path = "/api/v1/health";
            context.Request.Headers["X-Forwarded-For"] = ip;
        });
        Assert.Equal(200, (await Request("198.51.100.1")).Response.StatusCode);
        var limited = await Request("198.51.100.1");
        Assert.Equal(429, limited.Response.StatusCode);
        Assert.True(int.Parse(limited.Response.Headers.RetryAfter!) > 0);
        var error = await JsonSerializer.DeserializeAsync<JsonElement>(limited.Response.Body);
        Assert.True(error.TryGetProperty("error", out _));
        Assert.Equal(200, (await Request("198.51.100.2")).Response.StatusCode);
    }
}
