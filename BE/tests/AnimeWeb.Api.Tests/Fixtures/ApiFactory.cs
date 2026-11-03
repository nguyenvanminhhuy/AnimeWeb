using AnimeWeb.Api.Tests.Integration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Fixtures;

public sealed class ApiFactory(string? connectionString = null, int authLimit = 1000, TimeProvider? clock = null,
    IReadOnlyDictionary<string, string?>? settings = null) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:AnimeWeb"] = connectionString
                    ?? "Host=127.0.0.1;Port=1;Database=unavailable_test;Username=test;Password=fixture;Timeout=1",
                ["Cors:AllowedOrigins:0"] = "http://localhost:5173",
                ["Cors:AllowedOrigins:1"] = "http://127.0.0.1:5173"
                ,
                ["RateLimits:Auth"] = authLimit.ToString(System.Globalization.CultureInfo.InvariantCulture),
                ["RateLimits:Global"] = "10000"
                ,
                ["CatalogCache:Enabled"] = "false",
                ["ViewSessionCleanup:Enabled"] = "false",
                ["Logging:LogLevel:Default"] = "Warning"
            }));
        if (settings is not null) builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(settings));
        builder.ConfigureServices(services =>
        {
            if (clock is not null) services.AddSingleton(clock);
            services.AddControllers().AddApplicationPart(typeof(PipelineProbeController).Assembly);
        });
    }
}
