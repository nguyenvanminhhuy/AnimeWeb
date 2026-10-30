using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Features.Episodes;

public sealed class Season
{
    public required string Id { get; set; }
    public required string AnimeId { get; set; }
    public AnimeEntity Anime { get; set; } = null!;
    public int Number { get; set; }
    public required string Title { get; set; }
    public int SortOrder { get; set; }
}
