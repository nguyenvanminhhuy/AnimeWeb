namespace AnimeWeb.Api.Features.Anime;

public sealed class Genre
{
    public required string Id { get; set; }
    public required string Slug { get; set; }
    public required string Name { get; set; }
    public List<Anime> Anime { get; set; } = [];
}

public sealed class AnimeGenre
{
    public required string AnimeId { get; set; }
    public required string GenreId { get; set; }
}
