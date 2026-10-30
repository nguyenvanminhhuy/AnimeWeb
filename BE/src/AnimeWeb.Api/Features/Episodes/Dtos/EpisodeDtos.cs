namespace AnimeWeb.Api.Features.Episodes.Dtos;

public sealed record SeasonDto(string Id, string AnimeId, int Number, string Title, int SortOrder);

public sealed record EpisodeDto(
    string Id, string SeasonId, decimal Number, string Title, int SortOrder,
    int? DurationSeconds, string ThumbnailUrl, DateTimeOffset PublishedAt, string Status, bool HasPlayback);

public sealed record EpisodeDetailDto(
    string Id, string AnimeId, string AnimeSlug, string SeasonId, decimal Number,
    string Title, int SortOrder, int? DurationSeconds, string ThumbnailUrl,
    DateTimeOffset PublishedAt, string Status, bool HasPlayback);
