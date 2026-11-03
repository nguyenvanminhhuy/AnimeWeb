using AnimeWeb.Api.Features.Operations;
using AnimeWeb.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AnimeWeb.Api.Features.Playback;

public sealed class ViewSessionCleanupOptions
{
    public bool Enabled { get; set; } = true;
    public int RetentionMinutes { get; set; } = 60;
    public int IntervalMinutes { get; set; } = 5;
    public int BatchSize { get; set; } = 1000;
}
public sealed class ViewSessionCleanup(AnimeWebDbContext db, TimeProvider time, IOptions<ViewSessionCleanupOptions> options)
{
    public Task<int> RunAsync(CancellationToken ct)
    {
        var cutoff = time.GetUtcNow().AddMinutes(-options.Value.RetentionMinutes);
        return db.ViewSessions.Where(x => x.StartedAt < cutoff).OrderBy(x => x.StartedAt).ThenBy(x => x.Id)
            .Take(options.Value.BatchSize).ExecuteDeleteAsync(ct);
    }
}
public sealed class ViewSessionCleanupWorker(IServiceScopeFactory scopes, IOptions<ViewSessionCleanupOptions> options,
    TimeProvider time, ILogger<ViewSessionCleanupWorker> logger, RuntimeDiagnostics diagnostics) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled) return;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Delay first run so startup/migrations are independent of housekeeping.
                await Task.Delay(TimeSpan.FromMinutes(options.Value.IntervalMinutes), time, stoppingToken);
                await using var scope = scopes.CreateAsyncScope();
                var count = await scope.ServiceProvider.GetRequiredService<ViewSessionCleanup>().RunAsync(stoppingToken);
                diagnostics.Cleanup(time.GetUtcNow(), count, null);
                if (count > 0) logger.LogInformation("Removed {Count} expired playback sessions.", count);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception error) { diagnostics.Cleanup(time.GetUtcNow(), 0, error.GetType().Name); logger.LogWarning("Playback session cleanup failed with {ExceptionType}; retrying next interval.", error.GetType().Name); }
        }
    }
}
