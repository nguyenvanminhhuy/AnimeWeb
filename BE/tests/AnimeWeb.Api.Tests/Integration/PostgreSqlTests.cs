using System.Net;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace AnimeWeb.Api.Tests.Integration;

public sealed class PostgreSqlTests
{
    [PostgreSqlFact]
    [Trait("Category", "PostgreSQL")]
    public async Task BaselineMigrationIsIdempotentAndReadinessConnectsAsync()
    {
        var connectionString = Environment.GetEnvironmentVariable("ANIMEWEB_TEST_DATABASE")!;
        var parsed = new NpgsqlConnectionStringBuilder(connectionString);
        // Never apply test migrations to arbitrary developer or production databases.
        Assert.Equal("127.0.0.1", parsed.Host);
        Assert.Equal(54330, parsed.Port);
        Assert.Equal("animeweb_test", parsed.Database);
        Assert.Equal("animeweb_test", parsed.Username);

        await using var factory = new ApiFactory(connectionString);
        var client = factory.CreateClient();
        await using var scope = factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
        await database.Database.MigrateAsync();
        var applied = (await database.Database.GetAppliedMigrationsAsync()).ToArray();
        Assert.Equal(3, applied.Length);
        Assert.EndsWith("_InitialInfrastructure", applied[0]);
        Assert.EndsWith("_InitialCatalog", applied[1]);
        Assert.EndsWith("_InitialEpisodes", applied[2]);
        await database.Database.MigrateAsync();
        Assert.Equal(applied, (await database.Database.GetAppliedMigrationsAsync()).ToArray());
        Assert.Empty(await database.Database.GetPendingMigrationsAsync());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/health/ready")).StatusCode);
    }
}
