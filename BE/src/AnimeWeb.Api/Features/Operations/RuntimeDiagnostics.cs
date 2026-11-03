using System.Diagnostics.Metrics;

namespace AnimeWeb.Api.Features.Operations;

public sealed record TimingSnapshot(string Name, long Count, long Errors, long Limited, double AverageMs, double P95UpperBoundMs, double MaxMs);
public sealed record CleanupSnapshot(DateTimeOffset? LastRunAt, DateTimeOffset? LastSuccessAt, int Removed, string? ErrorType);
public sealed record RuntimeSnapshot(string InstanceId, DateTimeOffset StartedAt, int ActiveRequests, TimingSnapshot[] Requests,
    TimingSnapshot Database, Dictionary<string, long> ClientPlaybackFailures, CleanupSnapshot Cleanup);

public sealed class RuntimeDiagnostics : IDisposable
{
    private static readonly double[] bounds = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, double.PositiveInfinity];
    private sealed class Timing
    {
        public long Count, Errors, Limited; public double Total, Max; public readonly long[] Buckets = new long[bounds.Length];
        public void Add(double ms, int status) { Count++; Total += ms; Max = Math.Max(Max, ms); if (status >= 500) Errors++; if (status == 429) Limited++; Buckets[Array.FindIndex(bounds, b => ms <= b)]++; }
        public TimingSnapshot Snapshot(string name) { long sum = 0; var p95 = 0d; for (var i = 0; i < bounds.Length; i++) { sum += Buckets[i]; if (sum >= Math.Ceiling(Count * 0.95)) { p95 = double.IsPositiveInfinity(bounds[i]) ? Max : bounds[i]; break; } } return new(name, Count, Errors, Limited, Count == 0 ? 0 : Math.Round(Total / Count, 2), Count == 0 ? 0 : p95, Math.Round(Max, 2)); }
    }
    private readonly object sync = new();
    private readonly Dictionary<string, Timing> requests = new();
    private readonly Timing database = new();
    private readonly Dictionary<string, long> playback = new() { ["media"] = 0, ["hls"] = 0, ["subtitle"] = 0, ["expired"] = 0 };
    private readonly Meter meter = new("AnimeWeb.Operations", "1.0");
    private readonly Histogram<double> duration;
    private readonly Counter<long> failures;
    private readonly string instance = Guid.NewGuid().ToString("N");
    private readonly DateTimeOffset started = DateTimeOffset.UtcNow;
    private CleanupSnapshot cleanup = new(null, null, 0, null);
    private int active;
    public RuntimeDiagnostics() { duration = meter.CreateHistogram<double>("animeweb.http.duration", "ms"); failures = meter.CreateCounter<long>("animeweb.playback.client_failures"); }
    public void Begin() => Interlocked.Increment(ref active);
    public void End(string route, double ms, int status)
    {
        Interlocked.Decrement(ref active);
        lock (sync) { if (!requests.TryGetValue(route, out var timing)) { if (requests.Count >= 128) route = "other"; if (!requests.TryGetValue(route, out timing)) requests[route] = timing = new(); } timing.Add(ms, status); }
        duration.Record(ms, new KeyValuePair<string, object?>("route", route), new("status", status));
    }
    public void DatabaseCommand(double ms, bool success) { lock (sync) database.Add(ms, success ? 200 : 500); }
    public void PlaybackFailure(string kind) { lock (sync) { if (!playback.ContainsKey(kind)) return; playback[kind]++; } failures.Add(1, new KeyValuePair<string, object?>("kind", kind)); }
    public void Cleanup(DateTimeOffset at, int removed, string? error) { lock (sync) cleanup = new(at, error is null ? at : cleanup.LastSuccessAt, removed, error); }
    public RuntimeSnapshot Snapshot() { lock (sync) return new(instance, started, Volatile.Read(ref active), requests.Select(p => p.Value.Snapshot(p.Key)).OrderByDescending(x => x.Count).ToArray(), database.Snapshot("database"), new(playback), cleanup); }
    public void Dispose() => meter.Dispose();
}
