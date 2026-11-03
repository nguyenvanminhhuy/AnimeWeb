using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Operations;

public sealed record OperationsDto(RuntimeSnapshot Runtime, bool DatabaseReady, double DatabaseProbeMs);
public sealed class PlaybackReportInput
{
    [Required, RegularExpression("^(media|hls|subtitle|expired)$")] public string Kind { get; set; } = "";
}
[ApiController, Route("api/v1")]
public sealed class OperationsController(RuntimeDiagnostics diagnostics, AnimeWebDbContext db) : ControllerBase
{
    [HttpGet("admin/operations"), Permission("admin:dashboard:read")]
    public async Task<ApiResponse<OperationsDto>> Get(CancellationToken ct)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct); timeout.CancelAfter(TimeSpan.FromSeconds(2));
        var watch = Stopwatch.StartNew(); var ready = false;
        try { ready = await db.Database.CanConnectAsync(timeout.Token); }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception) {/* Probe failure is reported as status, never with connection details. */}
        return new(new(diagnostics.Snapshot(), ready, Math.Round(watch.Elapsed.TotalMilliseconds, 2)));
    }
    [HttpPost("common/episodes/{episodeId}/playback-reports"), AllowAnonymous]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Report([StringLength(100)] string episodeId, PlaybackReportInput input, CancellationToken ct)
    {
        if (!await db.Episodes.AnyAsync(x => x.Id == episodeId && x.Status == "published" && x.Season.Anime.PublicationStatus == "published", ct)) throw ApiFailure.NotFound();
        diagnostics.PlaybackFailure(input.Kind); return NoContent();
    }
}
