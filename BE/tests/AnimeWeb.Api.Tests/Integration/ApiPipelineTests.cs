using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.Extensions.Options;

namespace AnimeWeb.Api.Tests.Integration;

public sealed class ApiPipelineTests : IDisposable
{
    private readonly ApiFactory factory = new();
    private readonly HttpClient client;

    public ApiPipelineTests()
    {
        client = factory.CreateClient();
    }

    public void Dispose()
    {
        client.Dispose();
        factory.Dispose();
    }

    [Fact]
    public async Task LivenessDoesNotRequireDatabaseAsync()
    {
        var response = await client.GetAsync("/api/v1/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ok", json.GetProperty("data").GetProperty("status").GetString());
    }

    [Theory]
    [InlineData("/missing-route", "GET", HttpStatusCode.NotFound, "NOT_FOUND")]
    [InlineData("/api/v1/health", "POST", HttpStatusCode.MethodNotAllowed, "METHOD_NOT_ALLOWED")]
    [InlineData("/api/v1/health/ready", "GET", HttpStatusCode.ServiceUnavailable, "SERVICE_UNAVAILABLE")]
    public async Task ErrorsUseContractAsync(string path, string method, HttpStatusCode status, string code)
    {
        var response = await client.SendAsync(new HttpRequestMessage(new HttpMethod(method), path));
        Assert.Equal(status, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(code, json.GetProperty("error").GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(json.GetProperty("error").GetProperty("requestId").GetString()));
        Assert.False(json.TryGetProperty("trace", out _));
    }

    [Fact]
    public async Task ModelValidationUsesFieldsEnvelopeAsync()
    {
        var response = await client.PostAsJsonAsync("/_tests/pipeline/validation", new { });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("VALIDATION_ERROR", json.GetProperty("error").GetProperty("code").GetString());
        var fields = json.GetProperty("error").GetProperty("fields");
        Assert.Equal(new[] { "name" }, fields.EnumerateObject().Select(field => field.Name));
    }

    [Fact]
    public async Task MalformedJsonDoesNotEchoBodyAsync()
    {
        var response = await client.PostAsync("/_tests/pipeline/validation",
            new StringContent("{fixture-secret", System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.DoesNotContain("fixture-secret", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task ExceptionsNeverExposeDetailsEvenInDevelopmentAsync()
    {
        var response = await client.GetAsync("/_tests/pipeline/exception");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("fixture-secret", body);
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.Contains("INTERNAL_ERROR", body);
    }

    [Theory]
    [InlineData("http://localhost:5173", true)]
    [InlineData("https://untrusted.invalid", false)]
    public async Task CorsOnlyAllowsConfiguredOriginAsync(string origin, bool allowed)
    {
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/health");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "GET");
        var response = await client.SendAsync(request);
        Assert.Equal(allowed, response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task OpenApiDescribesHealthEndpointAsync()
    {
        var response = await client.GetAsync("/openapi/v1.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("paths").TryGetProperty("/api/v1/health", out _));
    }

    [Theory]
    [InlineData("/api/v1/common/anime", new[] { "q", "genre", "status", "year", "format", "sort", "page", "pageSize" })]
    [InlineData("/api/v1/common/seasons/{seasonId}/episodes", new[] { "page", "pageSize" })]
    public async Task OpenApiQueryNamesMatchHttpContractAsync(string path, string[] expectedNames)
    {
        var json = await client.GetFromJsonAsync<JsonElement>("/openapi/v1.json");
        var parameters = json.GetProperty("paths").GetProperty(path).GetProperty("get").GetProperty("parameters");
        var queryNames = parameters.EnumerateArray()
            .Where(parameter => parameter.GetProperty("in").GetString() == "query")
            .Select(parameter => parameter.GetProperty("name").GetString()).ToArray();
        Assert.Equal(expectedNames.Order(), queryNames.Order());
    }

    [Theory]
    [InlineData("/api/v1/common/anime/{slug}")]
    [InlineData("/api/v1/common/anime/{animeId}/seasons")]
    [InlineData("/api/v1/common/seasons/{seasonId}/episodes")]
    [InlineData("/api/v1/common/episodes/{episodeId}")]
    public async Task OpenApiDocumentsValidationErrorEnvelopeAsync(string path)
    {
        var json = await client.GetFromJsonAsync<JsonElement>("/openapi/v1.json");
        var response = json.GetProperty("paths").GetProperty(path).GetProperty("get")
            .GetProperty("responses").GetProperty("400");
        var schema = response.GetProperty("content").GetProperty("application/json").GetProperty("schema");
        Assert.EndsWith("/ApiErrorResponse", schema.GetProperty("$ref").GetString());
    }

    [Fact]
    public void MissingConnectionStringFailsStartupWithoutEchoingCredentials()
    {
        using var invalidFactory = new ApiFactory("");
        var error = Assert.Throws<OptionsValidationException>(() => invalidFactory.CreateClient());
        Assert.Contains("ConnectionStrings:AnimeWeb", error.Message);
    }
}
