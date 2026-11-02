using AnimeWeb.Api.Infrastructure.Persistence;

namespace AnimeWeb.Api.Features.Anime;

public static class CatalogOrdering
{
    public static IOrderedQueryable<Anime> PlayableFirst(this IQueryable<Anime> query,
        AnimeWebDbContext database, DateTimeOffset now) => query.OrderByDescending(anime =>
        database.PlaybackSources.Any(source => source.Episode.Season.AnimeId == anime.Id
            && source.Episode.Status == "published" && source.Enabled
            && (source.ExpiresAt == null || source.ExpiresAt > now)));
}
