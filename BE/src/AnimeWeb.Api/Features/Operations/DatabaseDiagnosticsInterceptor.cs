using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace AnimeWeb.Api.Features.Operations;

public sealed class DatabaseDiagnosticsInterceptor(RuntimeDiagnostics diagnostics) : DbCommandInterceptor
{
    public override ValueTask<DbDataReader> ReaderExecutedAsync(DbCommand command, CommandExecutedEventData data, DbDataReader result, CancellationToken ct = default)
    { diagnostics.DatabaseCommand(data.Duration.TotalMilliseconds, true); return ValueTask.FromResult(result); }
    public override ValueTask<int> NonQueryExecutedAsync(DbCommand command, CommandExecutedEventData data, int result, CancellationToken ct = default)
    { diagnostics.DatabaseCommand(data.Duration.TotalMilliseconds, true); return ValueTask.FromResult(result); }
    public override ValueTask<object?> ScalarExecutedAsync(DbCommand command, CommandExecutedEventData data, object? result, CancellationToken ct = default)
    { diagnostics.DatabaseCommand(data.Duration.TotalMilliseconds, true); return ValueTask.FromResult(result); }
    public override Task CommandFailedAsync(DbCommand command, CommandErrorEventData data, CancellationToken ct = default)
    { diagnostics.DatabaseCommand(data.Duration.TotalMilliseconds, false); return Task.CompletedTask; }
}
