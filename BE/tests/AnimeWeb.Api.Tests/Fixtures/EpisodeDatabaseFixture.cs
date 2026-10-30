using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Infrastructure.Persistence.Seeding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Fixtures;

public sealed class EpisodeDatabaseFixture : IAsyncLifetime
{
    private readonly CatalogDatabaseFixture catalog = new();
    public ApiFactory Factory => catalog.Factory;
    public HttpClient Client => catalog.Client;

    public async Task InitializeAsync()
    {
        await catalog.InitializeAsync();
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ANIMEWEB_TEST_DATABASE")))
        {
            return;
        }
        await using var scope = Factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        Assert.True(await EpisodeDemoSeeder.SeedAsync(database));
        Assert.False(await EpisodeDemoSeeder.SeedAsync(database));
        Assert.Equal(5, await database.Seasons.CountAsync());
        Assert.Equal(8, await database.Episodes.CountAsync());
    }

    public Task DisposeAsync() => catalog.DisposeAsync();
}
