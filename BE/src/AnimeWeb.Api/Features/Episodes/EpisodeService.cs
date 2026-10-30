using AnimeWeb.Api.Features.Episodes.Dtos;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Episodes;

public sealed class EpisodeService(AnimeWebDbContext database)
{
    public async Task<List<SeasonDto>?> ListSeasonsAsync(string animeId, CancellationToken cancellationToken)
    {
        if (!await database.Anime.AnyAsync(anime => anime.Id == animeId && anime.PublicationStatus == "published", cancellationToken))
        {
            return null;
        }
        return await database.Seasons.AsNoTracking()
            .Where(season => season.AnimeId == animeId && season.Anime.PublicationStatus == "published")
            .OrderBy(season => season.SortOrder).ThenBy(season => season.Id)
            .Select(season => new SeasonDto(season.Id, season.AnimeId, season.Number, season.Title, season.SortOrder))
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResponse<EpisodeDto>?> ListEpisodesAsync(string seasonId, PageQuery pagination,
        CancellationToken cancellationToken)
    {
        if (!await database.Seasons.AnyAsync(season => season.Id == seasonId
            && season.Anime.PublicationStatus == "published", cancellationToken))
        {
            return null;
        }
        var query = database.Episodes.AsNoTracking().Where(episode => episode.SeasonId == seasonId
            && episode.Status == "published" && episode.Season.Anime.PublicationStatus == "published");
        var total = await query.CountAsync(cancellationToken);
        var meta = new PageMeta(pagination.Page, pagination.PageSize, total, (int)Math.Ceiling(total / (double)pagination.PageSize));
        var offset = ((long)pagination.Page - 1) * pagination.PageSize;
        if (offset >= total)
        {
            return new([], meta);
        }
        var data = await query.OrderBy(episode => episode.SortOrder).ThenBy(episode => episode.Id)
            .Skip((int)offset).Take(pagination.PageSize)
            .Select(episode => new EpisodeDto(
                episode.Id, episode.SeasonId, episode.Number, episode.Title, episode.SortOrder,
                episode.DurationSeconds, episode.ThumbnailUrl, episode.PublishedAt!.Value, episode.Status, false))
            .ToListAsync(cancellationToken);
        return new(data, meta);
    }

    public Task<EpisodeDetailDto?> GetEpisodeAsync(string episodeId, CancellationToken cancellationToken) =>
        database.Episodes.AsNoTracking()
            .Where(episode => episode.Id == episodeId && episode.Status == "published"
                && episode.Season.Anime.PublicationStatus == "published")
            .Select(episode => new EpisodeDetailDto(
                episode.Id, episode.Season.AnimeId, episode.Season.Anime.Slug,
                episode.SeasonId, episode.Number, episode.Title, episode.SortOrder,
                episode.DurationSeconds, episode.ThumbnailUrl, episode.PublishedAt!.Value, episode.Status, false))
            .SingleOrDefaultAsync(cancellationToken);
}
