using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Tests.Fixtures;

namespace AnimeWeb.Api.Tests.Integration;

public sealed class FeatureBoundaryTests
{
    [Theory]
    [InlineData("/api/v1/me/library")]
    [InlineData("/api/v1/me/progress")]
    [InlineData("/api/v1/admin/anime")]
    [InlineData("/api/v1/admin/users")]
    [InlineData("/api/v1/admin/comments")]
    [InlineData("/api/v1/admin/dashboard")]
    public async Task OpenApiDescribesTypedPrivateResponsesAndAuthorizationErrorsAsync(string path)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var json = await client.GetFromJsonAsync<JsonElement>("/openapi/v1.json");
        var responses = json.GetProperty("paths").GetProperty(path).GetProperty("get").GetProperty("responses");
        foreach (var status in new[] { "200", "401", "403" })
        {
            Assert.True(responses.TryGetProperty(status, out _), responses.GetRawText());
            Assert.True(responses.GetProperty(status).GetProperty("content").GetProperty("application/json")
                .GetProperty("schema").TryGetProperty("$ref", out _));
        }
        Assert.False(json.GetProperty("components").GetProperty("schemas").TryGetProperty("Account", out _));
    }
    [Theory]
    [InlineData("/api/v1/me")]
    [InlineData("/api/v1/me/library")]
    [InlineData("/api/v1/me/library/summary")]
    [InlineData("/api/v1/me/progress")]
    [InlineData("/api/v1/admin/anime")]
    [InlineData("/api/v1/admin/genres")]
    [InlineData("/api/v1/admin/episodes")]
    [InlineData("/api/v1/admin/playback-sources")]
    [InlineData("/api/v1/admin/users")]
    [InlineData("/api/v1/admin/comments")]
    [InlineData("/api/v1/admin/dashboard")]
    public async Task GuestCannotReachPrivateDatabaseQueriesAsync(string path)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        using var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("Bearer", response.Headers.WwwAuthenticate.Single().Scheme);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("UNAUTHORIZED", json.GetProperty("error").GetProperty("code").GetString());
        Assert.False(response.Headers.Contains("Location"));
    }
    [Fact]
    public async Task AuthRateLimitReturnsJson429BeforeDatabaseAccessAsync()
    {
        await using var factory = new ApiFactory(authLimit: 1);
        using var client = factory.CreateClient();
        using var first = await client.PostAsJsonAsync("/api/v1/auth/login", new { });
        Assert.Equal(HttpStatusCode.BadRequest, first.StatusCode);
        using var second = await client.PostAsJsonAsync("/api/v1/auth/login", new { });
        Assert.Equal(HttpStatusCode.TooManyRequests, second.StatusCode);
        var json = await second.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("TOO_MANY_REQUESTS", json.GetProperty("error").GetProperty("code").GetString());
    }
    [Theory]
    [InlineData("/api/v1/common/rankings/anime?metric=rating")]
    [InlineData("/api/v1/common/rankings/anime?limit=0")]
    [InlineData("/api/v1/common/rankings/anime?limit=51")]
    public async Task InvalidRankingQueryIsRejectedBeforeDatabaseAccessAsync(string url)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        using var response = await client.GetAsync(url);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
