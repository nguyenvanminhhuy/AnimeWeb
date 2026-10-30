using AnimeWeb.Api.Tests.Integration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AnimeWeb.Api.Tests.Fixtures;

public sealed class ApiFactory(string? connectionString = null) : WebApplicationFactory<Program>
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
            }));
        builder.ConfigureServices(services => services.AddControllers()
            .AddApplicationPart(typeof(PipelineProbeController).Assembly));
    }
}
