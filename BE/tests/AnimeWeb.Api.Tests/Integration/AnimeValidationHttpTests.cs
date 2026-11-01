using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Tests.Fixtures;

namespace AnimeWeb.Api.Tests.Integration;

public sealed class AnimeValidationHttpTests
{
    [Theory]
    [InlineData("Invalid-Slug")]
    [InlineData("invalid%20slug")]
    public async Task InvalidSlugReturnsFieldErrorBeforeDatabaseAccessAsync(string slug)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/common/anime/" + slug);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("VALIDATION_ERROR", json.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(new[] { "slug" },
            json.GetProperty("error").GetProperty("fields").EnumerateObject().Select(field => field.Name));
    }

    [Theory]
    [InlineData("?page=0", "page")]
    [InlineData("?page=oops", "page")]
    [InlineData("?pageSize=51", "pageSize")]
    [InlineData("?year=0", "year")]
    [InlineData("?status=deleted", "status")]
    [InlineData("?status=1", "status")]
    [InlineData("?format=unknown", "format")]
    [InlineData("?sort=popular", "sort")]
    [InlineData("?genre=Invalid%20Slug", "genre")]
    public async Task InvalidQueryFailsBeforeDatabaseAccessAsync(string query, string expectedField)
    {
        await using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/common/anime" + query);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("VALIDATION_ERROR", json.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal(new[] { expectedField },
            json.GetProperty("error").GetProperty("fields").EnumerateObject().Select(field => field.Name));
    }
}
