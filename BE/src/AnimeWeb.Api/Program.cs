using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using AnimeWeb.Api.Features.Anime;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Features.Comments;
using AnimeWeb.Api.Features.Episodes;
using AnimeWeb.Api.Features.Library;
using AnimeWeb.Api.Features.Playback;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Infrastructure.Persistence.Seeding;
using AnimeWeb.Api.Shared.Configuration;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOptions<DatabaseOptions>()
    .BindConfiguration("ConnectionStrings")
    .Validate(options => DatabaseOptions.IsValid(options.AnimeWeb),
        "ConnectionStrings:AnimeWeb must be a valid PostgreSQL connection string.")
    .ValidateOnStart();
builder.Services.AddOptions<CorsOptions>()
    .BindConfiguration("Cors")
    .Validate(options => options.AllowedOrigins.All(CorsOptions.IsValidOrigin),
        "Cors:AllowedOrigins must contain HTTP(S) origins without paths or wildcards.")
    .ValidateOnStart();
builder.Services.AddDbContext<AnimeWebDbContext>((services, options) =>
    options.UseNpgsql(services.GetRequiredService<IOptions<DatabaseOptions>>().Value.AnimeWeb));
builder.Services.AddControllers(options =>
    {
        options.ModelMetadataDetailsProviders.Add(new SystemTextJsonValidationMetadataProvider());
        options.Conventions.Add(new ApiContractConvention());
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.SnakeCaseLower, allowIntegerValues: false));
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressMapClientErrors = true;
        options.InvalidModelStateResponseFactory = context =>
        {
            var fields = context.ModelState
                .Where(entry => entry.Value?.Errors.Count > 0)
                .ToDictionary(entry => entry.Key, _ => new[] { "Invalid value." });
            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(
                ApiErrors.Create(context.HttpContext, 400, fields));
        };
    });
builder.Services.AddCors();
builder.Services.AddScoped<AnimeService>();
builder.Services.AddScoped<EpisodeService>();
builder.Services.AddOpenApi();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IPasswordHasher<Account>, PasswordHasher<Account>>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<AdminBootstrap>();
builder.Services.AddScoped<PersonalService>();
builder.Services.AddScoped<CommentService>();
builder.Services.AddScoped<AdminCatalogService>();
builder.Services.AddScoped<AdminEpisodeService>();
builder.Services.AddScoped<AdminPlaybackService>();
builder.Services.AddScoped<PlaybackService>();
builder.Services.AddScoped<CatalogAggregateService>();
builder.Services.AddScoped<AdminUserService>();
builder.Services.AddScoped<IPlaybackProvider, DirectPlaybackProvider>();
builder.Services.AddAuthentication(SessionAuthentication.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, SessionAuthentication>(SessionAuthentication.SchemeName, _ => { });
builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().RequireClaim("accountStatus", "active").Build();
    foreach (var permission in Permissions.All)
        options.AddPolicy(permission, policy => policy.RequireAuthenticatedUser()
            .RequireClaim("accountStatus", "active").RequireClaim("permission", permission));
});
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = builder.Configuration.GetValue("RateLimits:Global", 120), Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = builder.Configuration.GetValue("RateLimits:Auth", 10),
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsJsonAsync(ApiErrors.Create(context.HttpContext, 429), ct);
    };
});

var app = builder.Build();

if (args.Contains("--bootstrap-admin"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var created = await scope.ServiceProvider.GetRequiredService<AdminBootstrap>().CreateAsync(new RegisterInput
    {
        Email = app.Configuration["Bootstrap:Email"] ?? "",
        DisplayName = app.Configuration["Bootstrap:DisplayName"] ?? "Administrator",
        Password = app.Configuration["Bootstrap:Password"] ?? ""
    });
    app.Logger.LogInformation(created ? "Bootstrap administrator created." : "An administrator already exists; no changes.");
    return;
}

if (args.Contains("--seed-demo"))
{
    if (!app.Environment.IsDevelopment())
    {
        throw new InvalidOperationException("Demo seeding is only available in Development.");
    }
    await using var scope = app.Services.CreateAsyncScope();
    var database = scope.ServiceProvider.GetRequiredService<AnimeWebDbContext>();
    var inserted = await CatalogDemoSeeder.SeedAsync(database);
    app.Logger.LogInformation(inserted ? "Demo catalog inserted." : "Catalog already contains data; no changes.");
    var episodesInserted = await EpisodeDemoSeeder.SeedAsync(database);
    app.Logger.LogInformation(episodesInserted ? "Demo seasons and episodes inserted."
        : "Seasons/episodes exist or demo parents are unavailable; no changes.");
    return;
}

app.UseMiddleware<ApiExceptionMiddleware>();
app.UseStatusCodePages(async context =>
{
    await context.HttpContext.Response.WriteAsJsonAsync(
        ApiErrors.Create(context.HttpContext, context.HttpContext.Response.StatusCode));
});
var origins = app.Services.GetRequiredService<IOptions<CorsOptions>>().Value.AllowedOrigins;
app.UseCors(policy =>
{
    if (origins.Length > 0)
    {
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
    }
});
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program;
