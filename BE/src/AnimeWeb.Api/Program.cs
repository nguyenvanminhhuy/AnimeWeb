using System.Text.Json.Serialization;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared.Configuration;
using AnimeWeb.Api.Shared.Errors;
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
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.SnakeCaseLower, allowIntegerValues: false)))
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
builder.Services.AddOpenApi();

var app = builder.Build();

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
app.MapControllers();
app.Run();

public partial class Program;
