using System.ComponentModel.DataAnnotations;
using System.Globalization;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Episodes;

public sealed class SeasonInput : VersionInput
{
    [Required, StringLength(100)] public string AnimeId { get; set; } = "";
    [Range(0, int.MaxValue)] public int Number { get; set; }
    [Required, StringLength(300)] public string Title { get; set; } = "";
    [Range(0, int.MaxValue)] public int SortOrder { get; set; }
}
public sealed class EpisodeInput : VersionInput
{
    [Required, StringLength(100)] public string AnimeId { get; set; } = "";
    [Required, StringLength(100)] public string SeasonId { get; set; } = "";
    [Range(typeof(decimal), "0", "999999.99")] public decimal Number { get; set; }
    [Required, StringLength(300)] public string Title { get; set; } = "";
    [Range(0, int.MaxValue)] public int SortOrder { get; set; }
    [Range(0, int.MaxValue)] public int? DurationSeconds { get; set; }
    [Required, RegularExpression("^(draft|published)$")] public string Status { get; set; } = "draft";
    [StringLength(2048)] public string ThumbnailUrl { get; set; } = "";
}
public sealed record AdminSeasonDto(string Id, string AnimeId, int Number, string Title, int SortOrder, long Version);
public sealed record AdminEpisodeDto(string Id, string AnimeId, string SeasonId, decimal Number, string Title, int SortOrder,
    int? DurationSeconds, string ThumbnailUrl, string Status, DateTimeOffset? PublishedAt, bool HasPlayback, long Version);

public sealed class AdminEpisodeService(AnimeWebDbContext db, TimeProvider time)
{
    public async Task<PagedResponse<AdminSeasonDto>> SeasonsAsync(AdminQuery query, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(query.AnimeId)) throw ApiFailure.Invalid("animeId");
        if (!await db.Anime.AnyAsync(x => x.Id == query.AnimeId, ct)) throw ApiFailure.NotFound();
        return await db.Seasons.AsNoTracking().Where(x => x.AnimeId == query.AnimeId).OrderBy(x => x.SortOrder).ThenBy(x => x.Id)
            .Select(x => new AdminSeasonDto(x.Id, x.AnimeId, x.Number, x.Title, x.SortOrder, x.Version)).PageAsync(query, ct);
    }
    public async Task<AdminSeasonDto> SeasonAsync(string id, CancellationToken ct) => await db.Seasons.AsNoTracking().Where(x => x.Id == id)
        .Select(x => new AdminSeasonDto(x.Id, x.AnimeId, x.Number, x.Title, x.SortOrder, x.Version)).SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
    public async Task<AdminSeasonDto> SaveSeasonAsync(string? id, SeasonInput input, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await LockAnimeAsync(input.AnimeId, ct);
        var anime = await db.Anime.SingleOrDefaultAsync(x => x.Id == input.AnimeId, ct) ?? throw ApiFailure.Invalid("animeId");
        Season season;
        if (id is null)
        {
            FeatureRules.NewVersion(input.Version);
            season = new() { Id = FeatureRules.Id(), AnimeId = input.AnimeId, Title = "" };
            db.Seasons.Add(season);
        }
        else
        {
            season = await db.Seasons.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
            FeatureRules.Version(season, input.Version);
            if (season.AnimeId != input.AnimeId) throw ApiFailure.Invalid("animeId", "A season cannot move to another anime.");
        }
        if (anime.Format == "movie" && await db.Seasons.AnyAsync(x => x.AnimeId == input.AnimeId && x.Id != season.Id, ct)) throw ApiFailure.Conflict();
        season.Title = FeatureRules.Text(input.Title, "title", 1, 300);
        season.Number = input.Number;
        season.SortOrder = input.SortOrder;
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return await SeasonAsync(season.Id, ct);
    }
    private IQueryable<AdminEpisodeDto> EpisodesProjection(IQueryable<Episode> query) => query.Select(x => new AdminEpisodeDto(
        x.Id, x.Season.AnimeId, x.SeasonId, x.Number, x.Title, x.SortOrder, x.DurationSeconds, x.ThumbnailUrl, x.Status, x.PublishedAt,
        db.PlaybackSources.Any(s => s.EpisodeId == x.Id && s.Enabled && (s.ExpiresAt == null || s.ExpiresAt > time.GetUtcNow())), x.Version));
    public async Task<PagedResponse<AdminEpisodeDto>> EpisodesAsync(AdminQuery filters, CancellationToken ct)
    {
        var query = db.Episodes.AsNoTracking();
        if (filters.AnimeId is not null) query = query.Where(x => x.Season.AnimeId == filters.AnimeId);
        if (filters.SeasonId is not null) query = query.Where(x => x.SeasonId == filters.SeasonId);
        if (filters.Status is not null)
        {
            var status = FeatureRules.Choice(filters.Status, "status", "draft", "published");
            query = query.Where(x => x.Status == status);
        }
        var search = filters.Q?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search))
        {
            var isNumber = decimal.TryParse(search, NumberStyles.Number, CultureInfo.InvariantCulture, out var number);
            query = query.Where(x => x.Title.ToLower().Contains(search) || isNumber && x.Number == number);
        }
        var sort = FeatureRules.Choice(filters.Sort ?? "order", "sort", "order", "title");
        query = sort == "title" ? query.OrderBy(x => x.Title.ToLower()).ThenBy(x => x.Id)
            : query.OrderBy(x => x.Season.SortOrder).ThenBy(x => x.SeasonId).ThenBy(x => x.SortOrder).ThenBy(x => x.Id);
        return await EpisodesProjection(query).PageAsync(filters, ct);
    }
    public async Task<AdminEpisodeDto> EpisodeAsync(string id, CancellationToken ct) => await EpisodesProjection(db.Episodes.AsNoTracking().Where(x => x.Id == id))
        .SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
    public async Task<AdminEpisodeDto> SaveEpisodeAsync(string? id, EpisodeInput input, CancellationToken ct)
    {
        if (decimal.Round(input.Number, 2) != input.Number) throw ApiFailure.Invalid("number");
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await LockAnimeAsync(input.AnimeId, ct);
        var parent = await db.Seasons.Where(x => x.Id == input.SeasonId && x.AnimeId == input.AnimeId)
            .Select(x => new { x.Anime.Format }).SingleOrDefaultAsync(ct) ?? throw ApiFailure.Invalid("seasonId");
        Episode episode;
        if (id is null)
        {
            FeatureRules.NewVersion(input.Version);
            episode = new() { Id = FeatureRules.Id(), SeasonId = input.SeasonId, Title = "" };
            db.Episodes.Add(episode);
        }
        else
        {
            episode = await db.Episodes.Include(x => x.Season).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
            FeatureRules.Version(episode, input.Version);
            if (episode.Season.AnimeId != input.AnimeId) throw ApiFailure.Invalid("animeId", "An episode cannot move to another anime.");
        }
        if (parent.Format == "movie" && await db.Episodes.AnyAsync(x => x.Season.AnimeId == input.AnimeId && x.Id != episode.Id, ct)) throw ApiFailure.Conflict();
        episode.SeasonId = input.SeasonId;
        episode.Number = input.Number;
        episode.Title = FeatureRules.Text(input.Title, "title", 1, 300);
        episode.SortOrder = input.SortOrder;
        episode.DurationSeconds = input.DurationSeconds;
        episode.ThumbnailUrl = input.ThumbnailUrl;
        episode.Status = input.Status;
        if (input.Status == "published" && episode.PublishedAt is null) episode.PublishedAt = time.GetUtcNow();
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return await EpisodeAsync(episode.Id, ct);
    }
    private Task LockAnimeAsync(string id, CancellationToken ct) => db.Database
        .ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({id}, 0))", ct);
    public async Task DeleteSeasonAsync(string id, long version, CancellationToken ct)
    {
        var season = await db.Seasons.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(season, version); db.Remove(season); await db.SaveChangesAsync(ct);
    }
    public async Task DeleteEpisodeAsync(string id, long version, CancellationToken ct)
    {
        var episode = await db.Episodes.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(episode, version);
        if (episode.Status == "published") throw ApiFailure.Conflict();
        db.Remove(episode); await db.SaveChangesAsync(ct);
    }
}
