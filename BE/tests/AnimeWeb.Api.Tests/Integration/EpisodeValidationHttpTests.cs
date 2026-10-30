using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Tests.Fixtures;

namespace AnimeWeb.Api.Tests.Integration;

public sealed class EpisodeValidationHttpTests
{
    [Theory]
    [InlineData("?page=0")]
    [InlineData("?page=-1")]
    [InlineData("?page=invalid")]
    [InlineData("?page=2147483648")]
    [InlineData("?pageSize=0")]
    [InlineData("?pageSize=51")]
    public async Task InvalidPaginationIsRejectedWithoutDatabaseAccessAsync(string query)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/common/seasons/example/episodes" + query);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("VALIDATION_ERROR", json.GetProperty("error").GetProperty("code").GetString());
    }

    [Theory]
    [InlineData("/api/v1/common/anime/{0}/seasons")]
    [InlineData("/api/v1/common/seasons/{0}/episodes")]
    [InlineData("/api/v1/common/episodes/{0}")]
    public async Task OverlongIdIsRejectedAsync(string pattern)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync(string.Format(pattern, new string('x', 101)));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
