using AnimeWeb.Api.Features.Anime.Dtos;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Anime;

public sealed class AnimeService(AnimeWebDbContext database)
{
    public async Task<PagedResponse<AnimeSummaryDto>> ListAsync(AnimeQuery filters, CancellationToken cancellationToken)
    {
        var query = database.Anime.AsNoTracking().Where(anime => anime.PublicationStatus == "published");
        var search = filters.Q?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            // Treat LIKE wildcard characters as literal user input.
            var pattern = "%" + search.Replace("~", "~~").Replace("%", "~%").Replace("_", "~_") + "%";
            query = query.Where(anime =>
                EF.Functions.ILike(anime.Title, pattern, "~")
                || anime.AlternativeTitles.Any(title => EF.Functions.ILike(title, pattern, "~")));
        }
        if (!string.IsNullOrEmpty(filters.Genre))
        {
            query = query.Where(anime => anime.Genres.Any(genre => genre.Slug == filters.Genre));
        }
        if (!string.IsNullOrEmpty(filters.Status))
        {
            query = query.Where(anime => anime.Status == filters.Status);
        }
        if (filters.Year.HasValue)
        {
            query = query.Where(anime => anime.ReleaseYear == filters.Year.Value);
        }
        if (!string.IsNullOrEmpty(filters.Format))
        {
            query = query.Where(anime => anime.Format == filters.Format);
        }

        var total = await query.CountAsync(cancellationToken);
        var meta = new PageMeta(filters.Page, filters.PageSize, total, (int)Math.Ceiling(total / (double)filters.PageSize));
        // Count before casting to int avoids overflow for a valid but very large page.
        var offset = ((long)filters.Page - 1) * filters.PageSize;
        if (offset >= total)
        {
            return new([], meta);
        }
        var ordered = filters.Sort == "title"
            ? query.OrderBy(anime => EF.Functions.Collate(anime.Title.ToLower(), "C")).ThenBy(anime => anime.Id)
            : query.OrderByDescending(anime => anime.ReleaseYear).ThenBy(anime => anime.Id);
        var data = await ordered.Skip((int)offset).Take(filters.PageSize)
            .Select(anime => new AnimeSummaryDto(
                anime.Id, anime.Slug, anime.Title, anime.PosterUrl,
                anime.Status, anime.Format, anime.ReleaseYear,
                anime.Genres.OrderBy(genre => genre.Slug)
                    .Select(genre => new GenreDto(genre.Id, genre.Slug, genre.Name)).ToList()))
            .ToListAsync(cancellationToken);
        return new(data, meta);
    }

    public Task<AnimeDetailDto?> GetBySlugAsync(string slug, CancellationToken cancellationToken) =>
        database.Anime.AsNoTracking()
            .Where(anime => anime.PublicationStatus == "published" && anime.Slug == slug)
            .Select(anime => new AnimeDetailDto(
                anime.Id, anime.Slug, anime.Title, anime.PosterUrl,
                anime.Status, anime.Format, anime.ReleaseYear,
                anime.Genres.OrderBy(genre => genre.Slug)
                    .Select(genre => new GenreDto(genre.Id, genre.Slug, genre.Name)).ToList(),
                anime.Synopsis, anime.AlternativeTitles, anime.BannerUrl))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<List<GenreDto>> ListGenresAsync(CancellationToken cancellationToken) =>
        database.Genres.AsNoTracking()
            .Where(genre => genre.Anime.Any(anime => anime.PublicationStatus == "published"))
            .OrderBy(genre => genre.Slug)
            .Select(genre => new GenreDto(genre.Id, genre.Slug, genre.Name))
            .ToListAsync(cancellationToken);
}
