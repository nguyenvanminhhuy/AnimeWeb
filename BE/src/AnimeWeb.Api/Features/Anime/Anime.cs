namespace AnimeWeb.Api.Features.Anime;

public sealed class Anime
{
    public required string Id { get; set; }
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public string[] AlternativeTitles { get; set; } = [];
    public string Synopsis { get; set; } = string.Empty;
    public required string PosterUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string Status { get; set; } = "upcoming";
    public string Format { get; set; } = "tv";
    public int ReleaseYear { get; set; }
    public string PublicationStatus { get; set; } = "draft";
    public List<Genre> Genres { get; set; } = [];
}
