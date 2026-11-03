using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;

namespace AnimeWeb.Api.Features.Anime;

// Only explicitly public DTOs enter this cache. Playback, personal and admin responses never do.
public sealed class PublicCatalogCache(IServiceScopeFactory scopes, IConfiguration configuration) : IDisposable
{
    private readonly MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 128 });
    private readonly SemaphoreSlim fill = new(1, 1);
    private readonly bool enabled = configuration.GetValue("CatalogCache:Enabled", true);
    private readonly TimeSpan lifetime = TimeSpan.FromSeconds(Math.Clamp(configuration.GetValue("CatalogCache:Seconds", 10), 1, 60));
    private long generation;

    public void Invalidate() => Interlocked.Increment(ref generation);

    public async Task<T> GetAsync<T>(string key, Func<CatalogAggregateService, CancellationToken, Task<T>> load, CancellationToken ct)
    {
        if (!enabled) return await LoadAsync(load, ct);
        while (true)
        {
            ct.ThrowIfCancellationRequested();
            var version = Volatile.Read(ref generation);
            var cacheKey = (version, key);
            if (cache.TryGetValue<T>(cacheKey, out var cached)) return cached!;
            await fill.WaitAsync(ct);
            try
            {
                if (version != Volatile.Read(ref generation)) continue;
                if (cache.TryGetValue<T>(cacheKey, out cached)) return cached!;
                var value = await LoadAsync(load, ct);
                // A request begun before an admin write must not refill the new cache with old data.
                if (version != Volatile.Read(ref generation)) continue;
                cache.Set(cacheKey, value, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = lifetime, Size = 1 });
                return value;
            }
            finally { fill.Release(); }
        }
    }
    private async Task<T> LoadAsync<T>(Func<CatalogAggregateService, CancellationToken, Task<T>> load, CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        return await load(scope.ServiceProvider.GetRequiredService<CatalogAggregateService>(), ct);
    }
    public void Dispose() { cache.Dispose(); fill.Dispose(); }
}

public sealed class CatalogCacheInvalidationFilter(PublicCatalogCache cache) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var result = await next();
        var request = context.HttpContext.Request;
        var status = result.Result switch { ObjectResult obj => obj.StatusCode ?? 200, StatusCodeResult code => code.StatusCode, _ => context.HttpContext.Response.StatusCode };
        if (result.Exception is null && status < 400 && request.Path.StartsWithSegments("/api/v1/admin")
            && !HttpMethods.IsGet(request.Method) && !HttpMethods.IsHead(request.Method)) cache.Invalidate();
    }
}
