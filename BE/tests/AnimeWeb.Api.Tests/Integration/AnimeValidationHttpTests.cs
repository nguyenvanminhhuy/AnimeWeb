using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Tests.Fixtures;

namespace AnimeWeb.Api.Tests.Integration;

public sealed class AnimeValidationHttpTests
{
    [Theory]
    [InlineData("?page=0")]
    [InlineData("?page=oops")]
    [InlineData("?pageSize=51")]
    [InlineData("?year=0")]
    [InlineData("?status=deleted")]
    [InlineData("?status=1")]
    [InlineData("?format=unknown")]
    [InlineData("?sort=popular")]
    [InlineData("?genre=Invalid%20Slug")]
    public async Task InvalidQueryFailsBeforeDatabaseAccessAsync(string query)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/common/anime" + query);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("VALIDATION_ERROR", json.GetProperty("error").GetProperty("code").GetString());
        Assert.NotEmpty(json.GetProperty("error").GetProperty("fields").EnumerateObject());
    }
}
