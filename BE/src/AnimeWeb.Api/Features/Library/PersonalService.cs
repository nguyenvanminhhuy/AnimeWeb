using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Anime;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Library;

public sealed class PersonalQuery : PageQuery
{
    [FromQuery(Name = "q"), StringLength(200)] public string? Q { get; set; }
    [FromQuery(Name = "sort"), RegularExpression("^(recent|title)$")] public string Sort { get; set; } = "recent";
    [FromQuery(Name = "status"), RegularExpression("^(plan_to_watch|watching|completed|on_hold|dropped)$")] public string? Status { get; set; }
    [FromQuery(Name = "isFavorite")] public bool? IsFavorite { get; set; }
    [FromQuery(Name = "animeId"), StringLength(100)] public string? AnimeId { get; set; }
    [FromQuery(Name = "completed")] public bool? Completed { get; set; }
    [FromQuery(Name = "collection"), RegularExpression("^(history|watching)$")] public string Collection { get; set; } = "history";
}
public sealed class LibraryInput : VersionInput
{
    [Required, RegularExpression("^(plan_to_watch|watching|completed|on_hold|dropped)$")] public string Status { get; set; } = "";
    public bool IsFavorite { get; set; }
}
public sealed class ProgressInput : VersionInput
{
    [Range(0, int.MaxValue)] public int PositionSeconds { get; set; }
    public bool Completed { get; set; }
}
public sealed record ProgressDto(string EpisodeId, string AnimeId, decimal EpisodeNumber, int PositionSeconds,
    int? DurationSeconds, bool Completed, DateTimeOffset UpdatedAt, long Version);
public sealed record ProgressRow(string EpisodeId, string AnimeId, decimal EpisodeNumber, int PositionSeconds,
    int? DurationSeconds, bool Completed, DateTimeOffset UpdatedAt, long Version, AnimeCardDto Anime);
public sealed record LibraryDto(string AnimeId, string Status, bool IsFavorite, DateTimeOffset UpdatedAt, long Version);
public sealed record LibraryRow(string AnimeId, string Status, bool IsFavorite, DateTimeOffset UpdatedAt,
    long Version, AnimeCardDto Anime, ProgressDto? Progress);
public sealed record PersonalSummary(int FavoriteAnimeCount, int InProgressEpisodeCount, int CompletedEpisodeCount,
    int HistoryEpisodeCount, IReadOnlyList<ProgressRow> Preview);

public sealed class PersonalService(AnimeWebDbContext db, TimeProvider time)
{
    private static ProgressRow Row(ProgressDto p, AnimeCardDto anime) => new(p.EpisodeId, p.AnimeId, p.EpisodeNumber,
        p.PositionSeconds, p.DurationSeconds, p.Completed, p.UpdatedAt, p.Version, anime);
    private IQueryable<WatchProgress> PublicProgress(string user) => db.WatchProgress.AsNoTracking().Where(p =>
        p.UserId == user && p.Episode.Status == "published" && p.Episode.Season.Anime.PublicationStatus == "published");
    private IQueryable<LibraryEntry> PublicLibrary(string user) => db.LibraryEntries.AsNoTracking()
        .Where(p => p.UserId == user && p.Anime.PublicationStatus == "published");
    private IQueryable<WatchProgress> Latest(string user)
    {
        var all = PublicProgress(user);
        return all.Where(p => !all.Any(other => other.Episode.Season.AnimeId == p.Episode.Season.AnimeId
            && (other.UpdatedAt > p.UpdatedAt || other.UpdatedAt == p.UpdatedAt && other.EpisodeId.CompareTo(p.EpisodeId) < 0)))
            ;
    }
    private IQueryable<WatchProgress> Watching(string user) => Latest(user).Where(p => !p.Completed);
    private static IQueryable<ProgressDto> Project(IQueryable<WatchProgress> query) => query.Select(p => new ProgressDto(
        p.EpisodeId, p.Episode.Season.AnimeId, p.Episode.Number, p.PositionSeconds, p.Episode.DurationSeconds,
        p.Completed, p.UpdatedAt, p.Version));

    public async Task<PersonalSummary> SummaryAsync(string user, CancellationToken ct)
    {
        var progress = PublicProgress(user);
        var preview = await Project(Watching(user).OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.EpisodeId).Take(6)).ToListAsync(ct);
        var cards = await CardsAsync(preview.Select(x => x.AnimeId), ct);
        return new(await PublicLibrary(user).CountAsync(x => x.IsFavorite, ct),
            await progress.CountAsync(x => !x.Completed, ct), await progress.CountAsync(x => x.Completed, ct),
            await progress.CountAsync(ct), preview.Select(x => Row(x, cards[x.AnimeId])).ToArray());
    }

    public async Task<SummaryResponse<LibraryRow, CollectionSummary>> LibraryAsync(string user, PersonalQuery filters, CancellationToken ct)
    {
        var query = PublicLibrary(user);
        if (filters.IsFavorite.HasValue) query = query.Where(x => x.IsFavorite == filters.IsFavorite);
        if (filters.Status is not null) query = query.Where(x => x.Status == filters.Status);
        var count = await query.CountAsync(ct);
        var search = filters.Q?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search)) query = query.Where(x => x.Anime.Title.ToLower().Contains(search) || x.Anime.Subtitle.ToLower().Contains(search));
        query = filters.Sort == "title" ? query.OrderBy(x => x.Anime.Title.ToLower()).ThenBy(x => x.AnimeId)
            : query.OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.AnimeId);
        var result = await query.Select(x => new LibraryDto(x.AnimeId, x.Status, x.IsFavorite, x.UpdatedAt, x.Version)).PageAsync(filters, ct);
        var ids = result.Data.Select(x => x.AnimeId).ToArray();
        var cards = await CardsAsync(ids, ct);
        var recent = await Project(Latest(user).Where(x => ids.Contains(x.Episode.Season.AnimeId))
            .OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.EpisodeId)).ToListAsync(ct);
        return new(result.Data.Select(x => new LibraryRow(x.AnimeId, x.Status, x.IsFavorite, x.UpdatedAt, x.Version,
            cards[x.AnimeId], recent.FirstOrDefault(p => p.AnimeId == x.AnimeId))).ToArray(), result.Meta, new(count));
    }

    public async Task<SummaryResponse<ProgressRow, CollectionSummary>> ProgressAsync(string user, PersonalQuery filters, CancellationToken ct)
    {
        var query = filters.Collection == "watching" ? Watching(user) : PublicProgress(user);
        if (filters.AnimeId is not null) query = query.Where(x => x.Episode.Season.AnimeId == filters.AnimeId);
        if (filters.Completed.HasValue) query = query.Where(x => x.Completed == filters.Completed);
        var count = await query.CountAsync(ct);
        var search = filters.Q?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search)) query = query.Where(x => x.Episode.Season.Anime.Title.ToLower().Contains(search)
            || x.Episode.Season.Anime.Subtitle.ToLower().Contains(search));
        query = filters.Sort == "title" ? query.OrderBy(x => x.Episode.Season.Anime.Title.ToLower()).ThenBy(x => x.EpisodeId)
            : query.OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.EpisodeId);
        var result = await Project(query).PageAsync(filters, ct);
        var cards = await CardsAsync(result.Data.Select(x => x.AnimeId), ct);
        return new(result.Data.Select(x => Row(x, cards[x.AnimeId])).ToArray(), result.Meta, new(count));
    }

    private Task<Dictionary<string, AnimeCardDto>> CardsAsync(IEnumerable<string> ids, CancellationToken ct) =>
        db.Anime.AsNoTracking().Where(x => ids.Contains(x.Id)).Select(CatalogProjection.Card).ToDictionaryAsync(x => x.Id, ct);

    public async Task<LibraryDto> SaveLibraryAsync(string user, string animeId, LibraryInput input, CancellationToken ct)
    {
        if (!await db.Anime.AnyAsync(x => x.Id == animeId && x.PublicationStatus == "published", ct)) throw ApiFailure.NotFound();
        var entry = await db.LibraryEntries.SingleOrDefaultAsync(x => x.UserId == user && x.AnimeId == animeId, ct);
        if (entry is null)
        {
            FeatureRules.NewVersion(input.Version);
            entry = new() { UserId = user, AnimeId = animeId };
            db.LibraryEntries.Add(entry);
        }
        else FeatureRules.Version(entry, input.Version);
        entry.Status = input.Status;
        entry.IsFavorite = input.IsFavorite;
        entry.UpdatedAt = time.GetUtcNow();
        await db.SaveChangesAsync(ct);
        return new(entry.AnimeId, entry.Status, entry.IsFavorite, entry.UpdatedAt, entry.Version);
    }

    public async Task DeleteLibraryAsync(string user, string id, long version, CancellationToken ct)
    {
        var entry = await db.LibraryEntries.SingleOrDefaultAsync(x => x.UserId == user && x.AnimeId == id, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(entry, version);
        db.Remove(entry);
        await db.SaveChangesAsync(ct);
    }

    public async Task<ProgressDto> SaveProgressAsync(string user, string episodeId, ProgressInput input, CancellationToken ct)
    {
        var episode = await db.Episodes.AsNoTracking().Where(x => x.Id == episodeId && x.Status == "published"
            && x.Season.Anime.PublicationStatus == "published")
            .Select(x => new { x.Number, x.DurationSeconds, x.Season.AnimeId }).SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
        if (episode.DurationSeconds.HasValue && input.PositionSeconds > episode.DurationSeconds) throw ApiFailure.Invalid("positionSeconds");
        var entry = await db.WatchProgress.SingleOrDefaultAsync(x => x.UserId == user && x.EpisodeId == episodeId, ct);
        if (entry is null)
        {
            FeatureRules.NewVersion(input.Version);
            entry = new() { UserId = user, EpisodeId = episodeId };
            db.WatchProgress.Add(entry);
        }
        else FeatureRules.Version(entry, input.Version);
        entry.PositionSeconds = input.PositionSeconds;
        entry.Completed = input.Completed;
        entry.UpdatedAt = time.GetUtcNow();
        await db.SaveChangesAsync(ct);
        return new(episodeId, episode.AnimeId, episode.Number, entry.PositionSeconds, episode.DurationSeconds,
            entry.Completed, entry.UpdatedAt, entry.Version);
    }
}
