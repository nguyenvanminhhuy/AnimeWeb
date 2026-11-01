using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Features.Episodes;
using AnimeWeb.Api.Shared;
using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Features.Library;

public sealed class LibraryEntry : VersionedEntity
{
    public string UserId { get; set; } = "";
    public Account User { get; set; } = null!;
    public string AnimeId { get; set; } = "";
    public AnimeEntity Anime { get; set; } = null!;
    public string Status { get; set; } = "plan_to_watch";
    public bool IsFavorite { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class WatchProgress : VersionedEntity
{
    public string UserId { get; set; } = "";
    public Account User { get; set; } = null!;
    public string EpisodeId { get; set; } = "";
    public Episode Episode { get; set; } = null!;
    public int PositionSeconds { get; set; }
    public bool Completed { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
