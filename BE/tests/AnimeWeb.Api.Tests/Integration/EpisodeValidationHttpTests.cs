using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Tests.Fixtures;

namespace AnimeWeb.Api.Tests.Integration;

public sealed class EpisodeValidationHttpTests
{
    [Theory]
    [InlineData("?page=0", "page")]
    [InlineData("?page=-1", "page")]
    [InlineData("?page=invalid", "page")]
    [InlineData("?page=2147483648", "page")]
    [InlineData("?pageSize=0", "pageSize")]
    [InlineData("?pageSize=51", "pageSize")]
    public async Task InvalidPaginationIsRejectedWithoutDatabaseAccessAsync(string query, string expectedField)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/common/seasons/example/episodes" + query);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("VALIDATION_ERROR", json.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(new[] { expectedField },
            json.GetProperty("error").GetProperty("fields").EnumerateObject().Select(field => field.Name));
    }

    [Theory]
    [InlineData("/api/v1/common/anime/{0}/seasons", "animeId")]
    [InlineData("/api/v1/common/seasons/{0}/episodes", "seasonId")]
    [InlineData("/api/v1/common/episodes/{0}", "episodeId")]
    public async Task OverlongIdIsRejectedAsync(string pattern, string expectedField)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync(string.Format(pattern, new string('x', 101)));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(new[] { expectedField },
            json.GetProperty("error").GetProperty("fields").EnumerateObject().Select(field => field.Name));
    }
}
