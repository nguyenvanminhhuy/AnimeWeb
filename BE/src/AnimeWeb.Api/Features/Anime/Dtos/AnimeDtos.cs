namespace AnimeWeb.Api.Features.Anime.Dtos;

public sealed record GenreDto(string Id, string Slug, string Name);

public sealed record AnimeSummaryDto(
    string Id, string Slug, string Title, string PosterUrl,
    string Status, string Format, int ReleaseYear, List<GenreDto> Genres);

public sealed record AnimeDetailDto(
    string Id, string Slug, string Title, string PosterUrl,
    string Status, string Format, int ReleaseYear, List<GenreDto> Genres,
    string Synopsis, string[] AlternativeTitles, string? BannerUrl);
