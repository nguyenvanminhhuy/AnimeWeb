using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Shared;
using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Features.Comments;

public sealed class Comment : VersionedEntity
{
    public string Id { get; set; } = FeatureRules.Id();
    public string AnimeId { get; set; } = "";
    public AnimeEntity Anime { get; set; } = null!;
    public string UserId { get; set; } = "";
    public Account User { get; set; } = null!;
    public string? Body { get; set; }
    public string Status { get; set; } = "visible";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; set; }
    public List<CommentModeration> Moderations { get; set; } = [];
}

public sealed class CommentModeration
{
    public string Id { get; set; } = FeatureRules.Id();
    public string CommentId { get; set; } = "";
    public Comment Comment { get; set; } = null!;
    public string ModeratorId { get; set; } = "";
    public Account Moderator { get; set; } = null!;
    public string Action { get; set; } = "";
    public string Reason { get; set; } = "";
    public DateTimeOffset ModeratedAt { get; set; } = DateTimeOffset.UtcNow;
}
