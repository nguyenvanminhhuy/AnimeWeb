using AnimeWeb.Api.Features.Episodes;
using AnimeWeb.Api.Shared;
using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Features.Playback;

public sealed class PlaybackSource : VersionedEntity
{
    public string Id { get; set; } = FeatureRules.Id();
    public string EpisodeId { get; set; } = "";
    public Episode Episode { get; set; } = null!;
    public string ProviderKey { get; set; } = "direct";
    public string Label { get; set; } = "";
    public string Language { get; set; } = "";
    public string Type { get; set; } = "mp4";
    public string Url { get; set; } = "";
    public bool Enabled { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ExpiresAt { get; set; }
    public List<SubtitleTrack> Subtitles { get; set; } = [];
}

public sealed class SubtitleTrack : VersionedEntity
{
    public string Id { get; set; } = FeatureRules.Id();
    public string PlaybackSourceId { get; set; } = "";
    public PlaybackSource Source { get; set; } = null!;
    public string Label { get; set; } = "";
    public string Language { get; set; } = "";
    public string Format { get; set; } = "vtt";
    public string Url { get; set; } = "";
    public bool IsDefault { get; set; }
}

public sealed class ViewSession
{
    public string Id { get; set; } = FeatureRules.Id();
    public string EpisodeId { get; set; } = "";
    public Episode Episode { get; set; } = null!;
    public string ViewerHash { get; set; } = "";
    public int StartPosition { get; set; }
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ViewEvent
{
    public string AnimeId { get; set; } = "";
    public AnimeEntity Anime { get; set; } = null!;
    public string ViewerHash { get; set; } = "";
    public long Bucket { get; set; }
    public DateTimeOffset RecordedAt { get; set; } = DateTimeOffset.UtcNow;
}
