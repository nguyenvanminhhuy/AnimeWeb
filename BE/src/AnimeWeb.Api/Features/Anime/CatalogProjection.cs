using System.Linq.Expressions;
using AnimeWeb.Api.Features.Anime.Dtos;

namespace AnimeWeb.Api.Features.Anime;

public sealed record AnimeCardDto(string Id, string Slug, string Title, string Subtitle, string Synopsis,
    string PosterUrl, string? BannerUrl, string Status, string Format, int ReleaseYear, List<GenreDto> Genres);

public static class CatalogProjection
{
    public static readonly Expression<Func<Anime, AnimeCardDto>> Card = anime => new(
        anime.Id, anime.Slug, anime.Title, anime.Subtitle, anime.Synopsis, anime.PosterUrl, anime.BannerUrl,
        anime.Status, anime.Format, anime.ReleaseYear,
        anime.Genres.OrderBy(g => g.Slug).Select(g => new GenreDto(g.Id, g.Slug, g.Name)).ToList());
}
