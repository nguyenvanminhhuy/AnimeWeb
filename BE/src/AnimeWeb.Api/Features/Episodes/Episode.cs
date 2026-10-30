namespace AnimeWeb.Api.Features.Episodes;

public sealed class Episode
{
    public required string Id { get; set; }
    public required string SeasonId { get; set; }
    public Season Season { get; set; } = null!;
    public decimal Number { get; set; }
    public required string Title { get; set; }
    public int SortOrder { get; set; }
    public int? DurationSeconds { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
    public DateTimeOffset? PublishedAt { get; set; }
    public string Status { get; set; } = "draft";
}
