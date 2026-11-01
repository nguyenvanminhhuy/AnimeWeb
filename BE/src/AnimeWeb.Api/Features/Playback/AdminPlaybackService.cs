using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Playback;

public sealed class SourceInput : VersionInput
{
    [Required, StringLength(100)] public string EpisodeId { get; set; } = "";
    [Required, RegularExpression("^direct$")] public string ProviderKey { get; set; } = "direct";
    [Required, StringLength(100)] public string Label { get; set; } = "";
    [Required, StringLength(30)] public string Language { get; set; } = "";
    [Required, RegularExpression("^(mp4|hls)$")] public string Type { get; set; } = "mp4";
    [Required, StringLength(2048)] public string Url { get; set; } = "";
    public bool Enabled { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
}
public sealed class SubtitleInput : VersionInput
{
    [Required, StringLength(100)] public string PlaybackSourceId { get; set; } = "";
    [Required, StringLength(100)] public string Label { get; set; } = "";
    [Required, StringLength(30)] public string Language { get; set; } = "";
    [Required, RegularExpression("^(vtt|srt)$")] public string Format { get; set; } = "vtt";
    [Required, StringLength(2048)] public string Url { get; set; } = "";
    public bool IsDefault { get; set; }
}
public sealed record AdminSourceDto(string Id, string EpisodeId, string ProviderKey, string Label, string Language,
    string Type, string Url, bool Enabled, DateTimeOffset CreatedAt, DateTimeOffset? ExpiresAt, long Version);
public sealed record AdminSubtitleDto(string Id, string PlaybackSourceId, string Label, string Language,
    string Format, string Url, bool IsDefault, long Version);

public sealed class AdminPlaybackService(AnimeWebDbContext db, IHostEnvironment environment, TimeProvider time)
{
    private static IQueryable<AdminSourceDto> Sources(IQueryable<PlaybackSource> query) => query.Select(x => new AdminSourceDto(
        x.Id, x.EpisodeId, x.ProviderKey, x.Label, x.Language, x.Type, x.Url, x.Enabled, x.CreatedAt, x.ExpiresAt, x.Version));
    private static IQueryable<AdminSubtitleDto> Tracks(IQueryable<SubtitleTrack> query) => query.Select(x => new AdminSubtitleDto(
        x.Id, x.PlaybackSourceId, x.Label, x.Language, x.Format, x.Url, x.IsDefault, x.Version));
    public async Task<PagedResponse<AdminSourceDto>> ListAsync(AdminQuery filters, CancellationToken ct)
    {
        var query = db.PlaybackSources.AsNoTracking();
        if (filters.AnimeId is not null) query = query.Where(x => x.Episode.Season.AnimeId == filters.AnimeId);
        if (filters.SeasonId is not null) query = query.Where(x => x.Episode.SeasonId == filters.SeasonId);
        if (filters.EpisodeId is not null) query = query.Where(x => x.EpisodeId == filters.EpisodeId);
        if (filters.Enabled.HasValue) query = query.Where(x => x.Enabled == filters.Enabled);
        var search = filters.Q?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search)) query = query.Where(x => x.Label.ToLower().Contains(search)
            || x.ProviderKey.ToLower().Contains(search) || x.Language.ToLower().Contains(search));
        var sort = FeatureRules.Choice(filters.Sort ?? "created", "sort", "created", "label");
        query = sort == "label" ? query.OrderBy(x => x.Label.ToLower()).ThenBy(x => x.Id) : query.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id);
        return await Sources(query).PageAsync(filters, ct);
    }
    public async Task<AdminSourceDto> GetAsync(string id, CancellationToken ct) =>
        await Sources(db.PlaybackSources.AsNoTracking().Where(x => x.Id == id)).SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
    public async Task<AdminSourceDto> SaveAsync(string? id, SourceInput input, CancellationToken ct)
    {
        if (!await db.Episodes.AnyAsync(x => x.Id == input.EpisodeId, ct)) throw ApiFailure.Invalid("episodeId");
        PlaybackSource source;
        if (id is null)
        {
            FeatureRules.NewVersion(input.Version);
            source = new() { CreatedAt = time.GetUtcNow() }; db.PlaybackSources.Add(source);
        }
        else
        {
            source = await db.PlaybackSources.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
            FeatureRules.Version(source, input.Version);
            if (source.EpisodeId != input.EpisodeId) throw ApiFailure.Invalid("episodeId");
        }
        source.EpisodeId = input.EpisodeId;
        source.ProviderKey = input.ProviderKey;
        source.Label = FeatureRules.Text(input.Label, "label", 1, 100);
        source.Language = FeatureRules.Text(input.Language, "language", 1, 30);
        source.Type = input.Type;
        source.Url = FeatureRules.MediaUrl(input.Url, "url", !environment.IsDevelopment());
        source.Enabled = input.Enabled;
        source.ExpiresAt = input.ExpiresAt?.ToUniversalTime();
        await db.SaveChangesAsync(ct); return await GetAsync(source.Id, ct);
    }
    public async Task<List<AdminSubtitleDto>> SubtitlesAsync(string id, CancellationToken ct)
    {
        if (!await db.PlaybackSources.AnyAsync(x => x.Id == id, ct)) throw ApiFailure.NotFound();
        return await Tracks(db.SubtitleTracks.AsNoTracking().Where(x => x.PlaybackSourceId == id)
            .OrderByDescending(x => x.IsDefault).ThenBy(x => x.Id)).ToListAsync(ct);
    }
    public async Task<AdminSubtitleDto> SubtitleAsync(string id, CancellationToken ct) =>
        await Tracks(db.SubtitleTracks.AsNoTracking().Where(x => x.Id == id)).SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
    public async Task<AdminSubtitleDto> SaveSubtitleAsync(string? id, SubtitleInput input, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var lockKey = "subtitle:" + input.PlaybackSourceId;
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({lockKey}, 0))", ct);
        if (!await db.PlaybackSources.AnyAsync(x => x.Id == input.PlaybackSourceId, ct)) throw ApiFailure.Invalid("playbackSourceId");
        SubtitleTrack track;
        if (id is null)
        {
            FeatureRules.NewVersion(input.Version); track = new(); db.SubtitleTracks.Add(track);
        }
        else
        {
            track = await db.SubtitleTracks.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
            FeatureRules.Version(track, input.Version);
            if (track.PlaybackSourceId != input.PlaybackSourceId) throw ApiFailure.Invalid("playbackSourceId");
        }
        if (input.IsDefault) await db.SubtitleTracks.Where(x => x.PlaybackSourceId == input.PlaybackSourceId && x.Id != track.Id && x.IsDefault)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false).SetProperty(x => x.Version, x => x.Version + 1), ct);
        track.PlaybackSourceId = input.PlaybackSourceId;
        track.Label = FeatureRules.Text(input.Label, "label", 1, 100);
        track.Language = FeatureRules.Text(input.Language, "language", 1, 30);
        track.Format = input.Format;
        track.Url = FeatureRules.MediaUrl(input.Url, "url", !environment.IsDevelopment());
        track.IsDefault = input.IsDefault;
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return await SubtitleAsync(track.Id, ct);
    }
    public async Task DeleteAsync(string id, long version, CancellationToken ct)
    {
        var source = await db.PlaybackSources.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(source, version); db.Remove(source); await db.SaveChangesAsync(ct);
    }
    public async Task DeleteSubtitleAsync(string id, long version, CancellationToken ct)
    {
        var track = await db.SubtitleTracks.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(track, version); db.Remove(track); await db.SaveChangesAsync(ct);
    }
}
