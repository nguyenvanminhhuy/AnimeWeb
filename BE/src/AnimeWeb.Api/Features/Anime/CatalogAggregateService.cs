using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Anime;

public sealed record RankingDto(AnimeCardDto Anime, long ViewCount);
public sealed record HomeDto(List<AnimeCardDto> Featured, List<AnimeCardDto> Updated, List<AnimeCardDto> Recommended, List<RankingDto> TopViewed);
public sealed record CatalogOptionsDto(int[] Years, string[] Formats);
public sealed record StatusCountDto(string Status, string Label, int Count);
public sealed record RecentAnimeDto(string? PublicSlug, AnimeCardDto Anime, int EpisodeCount, DateTimeOffset? LastPublishedAt);
public sealed record DashboardDto(int TotalAnime, int PublishedEpisodes, int UpcomingAnime, int EpisodesWithoutVideo,
    int TotalSeasons, int TotalGenres, IReadOnlyList<StatusCountDto> Statuses, IReadOnlyList<RecentAnimeDto> RecentAnime, List<RankingDto> TopViewed);
public sealed class CatalogAggregateService(AnimeWebDbContext db, TimeProvider time)
{
    private IQueryable<Anime> Public => db.Anime.AsNoTracking().Where(x => x.PublicationStatus == "published");
    public async Task<List<RankingDto>> RankingAsync(int limit, CancellationToken ct)
    {
        var ranking = await Public.Select(x => new { x.Id, Views = db.ViewEvents.LongCount(v => v.AnimeId == x.Id) })
            .OrderByDescending(x => x.Views).ThenBy(x => x.Id).Take(limit).ToListAsync(ct);
        var ids = ranking.Select(x => x.Id).ToArray();
        var cards = await Public.Where(x => ids.Contains(x.Id)).Select(CatalogProjection.Card).ToDictionaryAsync(x => x.Id, ct);
        return ranking.Where(x => cards.ContainsKey(x.Id)).Select(x => new RankingDto(cards[x.Id], x.Views)).ToList();
    }
    public async Task<HomeDto> HomeAsync(string? genre, CancellationToken ct)
    {
        var now = time.GetUtcNow();
        var featured = await Public.PlayableFirst(db, now).ThenByDescending(x => x.ReleaseYear).ThenBy(x => x.Id).Take(6).Select(CatalogProjection.Card).ToListAsync(ct);
        var updated = await Public.Where(x => db.Episodes.Any(e => e.Season.AnimeId == x.Id && e.Status == "published"))
            .PlayableFirst(db, now).ThenByDescending(x => db.Episodes.Where(e => e.Season.AnimeId == x.Id && e.Status == "published").Max(e => e.PublishedAt))
            .ThenBy(x => x.Id).Take(12).Select(CatalogProjection.Card).ToListAsync(ct);
        var recommended = Public;
        if (!string.IsNullOrWhiteSpace(genre)) recommended = recommended.Where(x => x.Genres.Any(g => g.Slug == genre));
        var recommendations = await recommended.PlayableFirst(db, now).ThenByDescending(x => x.ReleaseYear).ThenBy(x => x.Id).Take(12).Select(CatalogProjection.Card).ToListAsync(ct);
        return new(featured, updated, recommendations, await RankingAsync(10, ct));
    }
    public async Task<List<AnimeCardDto>> RelatedAsync(string id, CancellationToken ct)
    {
        if (!await Public.AnyAsync(x => x.Id == id, ct)) throw ApiFailure.NotFound();
        var genreIds = await Public.Where(x => x.Id == id).SelectMany(x => x.Genres.Select(g => g.Id)).ToArrayAsync(ct);
        return await Public.Where(x => x.Id != id && x.Genres.Any(g => genreIds.Contains(g.Id)))
            .OrderByDescending(x => x.Genres.Count(g => genreIds.Contains(g.Id))).ThenByDescending(x => x.ReleaseYear).ThenBy(x => x.Id)
            .Take(12).Select(CatalogProjection.Card).ToListAsync(ct);
    }
    public async Task<CatalogOptionsDto> OptionsAsync(CancellationToken ct) => new(
        await Public.Select(x => x.ReleaseYear).Distinct().OrderByDescending(x => x).ToArrayAsync(ct),
        await Public.Select(x => x.Format).Distinct().OrderBy(x => x).ToArrayAsync(ct));
    public async Task<DashboardDto> DashboardAsync(CancellationToken ct)
    {
        var now = time.GetUtcNow();
        var recent = await db.Anime.AsNoTracking()
            .OrderByDescending(x => db.Episodes.Any(e => e.Season.AnimeId == x.Id && e.Status == "published"))
            .ThenByDescending(x => db.Episodes.Where(e => e.Season.AnimeId == x.Id && e.Status == "published").Max(e => e.PublishedAt))
            .ThenBy(x => x.Id).Take(6).Select(x => new
            {
                x.Id,
                publicSlug = x.PublicationStatus == "published" ? x.Slug : null,
                episodeCount = db.Episodes.Count(e => e.Season.AnimeId == x.Id && e.Status == "published"),
                lastPublishedAt = db.Episodes.Where(e => e.Season.AnimeId == x.Id && e.Status == "published").Max(e => e.PublishedAt)
            }).ToListAsync(ct);
        var ids = recent.Select(x => x.Id).ToArray();
        var cards = await db.Anime.AsNoTracking().Where(x => ids.Contains(x.Id)).Select(CatalogProjection.Card).ToDictionaryAsync(x => x.Id, ct);
        var counts = await db.Anime.GroupBy(x => x.Status).Select(g => new { status = g.Key, count = g.Count() }).ToDictionaryAsync(x => x.status, x => x.count, ct);
        return new(await db.Anime.CountAsync(ct), await db.Episodes.CountAsync(x => x.Status == "published", ct),
            await db.Anime.CountAsync(x => x.Status == "upcoming", ct),
            await db.Episodes.CountAsync(x => x.Status == "published" && !db.PlaybackSources.Any(s => s.EpisodeId == x.Id
                && s.Enabled && (s.ExpiresAt == null || s.ExpiresAt > now)), ct),
            await db.Seasons.CountAsync(ct), await db.Genres.CountAsync(ct),
            new[] { "upcoming", "airing", "completed" }.Select(status => new StatusCountDto(status, status, counts.GetValueOrDefault(status))).ToArray(),
            recent.Select(x => new RecentAnimeDto(x.publicSlug, cards[x.Id], x.episodeCount, x.lastPublishedAt)).ToArray(),
            await RankingAsync(10, ct));
    }
}
