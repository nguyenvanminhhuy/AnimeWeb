using AnimeWeb.Api.Shared.Configuration;

namespace AnimeWeb.Api.Tests.Unit;

public sealed class ConfigurationTests
{
    [Theory]
    [InlineData("", false)]
    [InlineData("invalid", false)]
    [InlineData("Host=localhost;Database=test", false)]
    [InlineData("Host=localhost;Database=test;Username=test", true)]
    public void ConnectionStringsAreValidated(string value, bool expected)
    {
        Assert.Equal(expected, DatabaseOptions.IsValid(value));
    }

    [Theory]
    [InlineData("http://localhost:5173", true)]
    [InlineData("https://anime.example", true)]
    [InlineData("*", false)]
    [InlineData("https://anime.example/path", false)]
    [InlineData("https://user:password@anime.example", false)]
    public void CorsRejectsInvalidOrigins(string value, bool expected)
    {
        Assert.Equal(expected, CorsOptions.IsValidOrigin(value));
    }
}
