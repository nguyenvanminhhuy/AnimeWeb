using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Playback;

public sealed record SubtitleDto(string Id, string Language, string Label, string Format, string Url, bool IsDefault);
public sealed record SourceDto(string Id, string Type, string Label, string Language, string Url, DateTimeOffset? ExpiresAt, List<SubtitleDto> Subtitles);
public sealed record PlaybackDto(string EpisodeId, List<SourceDto> Sources, string? PreviousEpisodeId, string? NextEpisodeId);
public sealed record ViewStartDto(string Id, DateTimeOffset StartedAt);
public sealed record ViewConfirmDto(bool Counted);
public interface IPlaybackProvider
{
    Task<SourceDto> ResolveAsync(SourceDto source, CancellationToken ct);
}
public sealed class DirectPlaybackProvider : IPlaybackProvider
{
    public Task<SourceDto> ResolveAsync(SourceDto source, CancellationToken ct)
    { ct.ThrowIfCancellationRequested(); return Task.FromResult(source); }
}
public sealed class ViewInput
{
    [Range(0, int.MaxValue)] public int PositionSeconds { get; set; }
}

public sealed class PlaybackService(AnimeWebDbContext db, IPlaybackProvider provider, TimeProvider time)
{
    public async Task<PlaybackDto> GetAsync(string id, CancellationToken ct)
    {
        var episode = await db.Episodes.AsNoTracking().Where(x => x.Id == id && x.Status == "published"
            && x.Season.Anime.PublicationStatus == "published").Select(x => new
            {
                x.Id,
                x.SeasonId,
                x.SortOrder,
                SeasonOrder = x.Season.SortOrder,
                x.Season.AnimeId
            }).SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
        var now = time.GetUtcNow();
        var sources = await db.PlaybackSources.AsNoTracking().Where(x => x.EpisodeId == id && x.Enabled
                && (x.ExpiresAt == null || x.ExpiresAt > now)).OrderBy(x => x.CreatedAt).ThenBy(x => x.Id)
            .Select(x => new SourceDto(x.Id, x.Type, x.Label, x.Language, x.Url, x.ExpiresAt,
                x.Subtitles.OrderByDescending(t => t.IsDefault).ThenBy(t => t.Id)
                    .Select(t => new SubtitleDto(t.Id, t.Language, t.Label, t.Format, t.Url, t.IsDefault)).ToList())).ToListAsync(ct);
        var resolved = new List<SourceDto>();
        foreach (var source in sources)
        {
            try { resolved.Add(await provider.ResolveAsync(source, ct)); }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception error) when (error is HttpRequestException or TimeoutException or OperationCanceledException)
            { throw new ApiFailure(503, "SERVICE_UNAVAILABLE", "Playback provider is temporarily unavailable."); }
        }
        var playlist = db.Episodes.AsNoTracking().Where(x => x.Status == "published" && x.Season.AnimeId == episode.AnimeId
            && x.Season.Anime.PublicationStatus == "published");
        var next = await playlist.Where(x => x.Season.SortOrder > episode.SeasonOrder
            || x.Season.SortOrder == episode.SeasonOrder && x.SeasonId.CompareTo(episode.SeasonId) > 0
            || x.SeasonId == episode.SeasonId && (x.SortOrder > episode.SortOrder || x.SortOrder == episode.SortOrder && x.Id.CompareTo(id) > 0))
            .OrderBy(x => x.Season.SortOrder).ThenBy(x => x.SeasonId).ThenBy(x => x.SortOrder).ThenBy(x => x.Id).Select(x => x.Id).FirstOrDefaultAsync(ct);
        var previous = await playlist.Where(x => x.Season.SortOrder < episode.SeasonOrder
            || x.Season.SortOrder == episode.SeasonOrder && x.SeasonId.CompareTo(episode.SeasonId) < 0
            || x.SeasonId == episode.SeasonId && (x.SortOrder < episode.SortOrder || x.SortOrder == episode.SortOrder && x.Id.CompareTo(id) < 0))
            .OrderByDescending(x => x.Season.SortOrder).ThenByDescending(x => x.SeasonId).ThenByDescending(x => x.SortOrder).ThenByDescending(x => x.Id)
            .Select(x => x.Id).FirstOrDefaultAsync(ct);
        return new(id, resolved, previous, next);
    }

    public string Viewer(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true && context.User.FindFirst("accountStatus")?.Value == "active")
            return AccountService.Hash("user:" + context.User.UserId());
        var cookie = context.Request.Cookies["animeweb-viewer"];
        if (cookie is null || cookie.Length != 64 || !cookie.All(Uri.IsHexDigit))
        {
            cookie = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            context.Response.Cookies.Append("animeweb-viewer", cookie, new CookieOptions
            {
                HttpOnly = true,
                Secure = !context.RequestServices.GetRequiredService<IHostEnvironment>().IsDevelopment(),
                SameSite = SameSiteMode.Lax,
                MaxAge = TimeSpan.FromDays(30),
                IsEssential = true
            });
        }
        return AccountService.Hash("guest:" + cookie);
    }
    public async Task<ViewStartDto> StartViewAsync(string id, string viewer, ViewInput input, CancellationToken ct)
    {
        var now = time.GetUtcNow();
        var episode = await db.Episodes.Where(x => x.Id == id && x.Status == "published" && x.Season.Anime.PublicationStatus == "published")
            .Select(x => new
            {
                x.DurationSeconds,
                HasSource = db.PlaybackSources.Any(s => s.EpisodeId == id && s.Enabled
                && (s.ExpiresAt == null || s.ExpiresAt > now))
            }).SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
        if (!episode.HasSource) throw ApiFailure.Conflict();
        if (episode.DurationSeconds.HasValue && input.PositionSeconds > episode.DurationSeconds) throw ApiFailure.Invalid("positionSeconds");
        var session = new ViewSession { EpisodeId = id, ViewerHash = viewer, StartPosition = input.PositionSeconds, StartedAt = now };
        db.ViewSessions.Add(session); await db.SaveChangesAsync(ct);
        return new(session.Id, session.StartedAt);
    }
    public async Task<ViewConfirmDto> ConfirmViewAsync(string id, string viewer, ViewInput input, CancellationToken ct)
    {
        var now = time.GetUtcNow();
        var session = await db.ViewSessions.Include(x => x.Episode).ThenInclude(x => x.Season).ThenInclude(x => x.Anime)
            .SingleOrDefaultAsync(x => x.Id == id && x.ViewerHash == viewer, ct) ?? throw ApiFailure.NotFound();
        if (session.Episode.Status != "published" || session.Episode.Season.Anime.PublicationStatus != "published") throw ApiFailure.NotFound();
        if (session.Episode.DurationSeconds.HasValue && input.PositionSeconds > session.Episode.DurationSeconds) throw ApiFailure.Invalid("positionSeconds");
        if (now - session.StartedAt > TimeSpan.FromMinutes(10)) throw ApiFailure.Conflict();
        if (now - session.StartedAt < TimeSpan.FromSeconds(30) || (long)input.PositionSeconds - session.StartPosition < 30)
            throw ApiFailure.Invalid("positionSeconds", "At least 30 seconds of playback is required.");
        var bucket = session.StartedAt.ToUnixTimeSeconds() / 1800;
        var animeId = session.Episode.Season.AnimeId;
        // PostgreSQL unique key makes duplicate confirms and concurrent sessions idempotent.
        var inserted = await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO \"ViewEvents\" (\"AnimeId\",\"ViewerHash\",\"Bucket\",\"RecordedAt\") VALUES ({animeId},{viewer},{bucket},{now}) ON CONFLICT DO NOTHING", ct);
        return new(inserted == 1);
    }
}
