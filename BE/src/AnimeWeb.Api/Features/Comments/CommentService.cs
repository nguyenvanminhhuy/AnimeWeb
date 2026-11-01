using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Comments;

public sealed class CommentInput : VersionInput
{
    [Required, StringLength(2000, MinimumLength = 1)] public string Body { get; set; } = "";
}
public sealed class ModerationInput : VersionInput
{
    [Required, RegularExpression("^(hide|restore)$")] public string Action { get; set; } = "";
    [Required, StringLength(300, MinimumLength = 3)] public string Reason { get; set; } = "";
}
public sealed record AuthorDto(string Id, string DisplayName, string? AvatarUrl);
public sealed record ModerationDto(string Action, string Reason, string ModeratorName, DateTimeOffset ModeratedAt);
public sealed record CommentDto(string Id, string AnimeId, AuthorDto Author, string? Body, string Status,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, long Version);
public sealed record AdminCommentDto(CommentDto Comment, ModerationDto? LastModeration);
public sealed record CommentSummary(int Total, int Visible, int Hidden, int Deleted);

public sealed class CommentService(AnimeWebDbContext db, TimeProvider time)
{
    private static readonly Expression<Func<Comment, CommentDto>> Projection = x => new(x.Id, x.AnimeId,
        new(x.UserId, x.User.DisplayName, null), x.Status == "deleted" ? null : x.Body, x.Status, x.CreatedAt, x.UpdatedAt, x.Version);
    public async Task<PagedResponse<CommentDto>> PublicAsync(string animeId, PageQuery query, CancellationToken ct)
    {
        await RequirePublicAsync(animeId, ct);
        return await db.Comments.AsNoTracking().Where(x => x.AnimeId == animeId && x.Status == "visible")
            .OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id).Select(Projection).PageAsync(query, ct);
    }
    private async Task RequirePublicAsync(string id, CancellationToken ct)
    {
        if (!await db.Anime.AnyAsync(x => x.Id == id && x.PublicationStatus == "published", ct)) throw ApiFailure.NotFound();
    }
    public async Task<CommentDto> CreateAsync(string user, string animeId, CommentInput input, CancellationToken ct)
    {
        FeatureRules.NewVersion(input.Version);
        await RequirePublicAsync(animeId, ct);
        var comment = new Comment
        {
            AnimeId = animeId,
            UserId = user,
            Body = FeatureRules.Text(input.Body, "body", 1, 2000),
            CreatedAt = time.GetUtcNow(),
            UpdatedAt = time.GetUtcNow()
        };
        db.Comments.Add(comment);
        await db.SaveChangesAsync(ct);
        return await GetAsync(comment.Id, ct);
    }
    private async Task<Comment> OwnAsync(string user, string id, long version, CancellationToken ct)
    {
        var comment = await db.Comments.SingleOrDefaultAsync(x => x.Id == id && x.UserId == user, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(comment, version);
        return comment;
    }
    public async Task<CommentDto> UpdateAsync(string user, string id, CommentInput input, CancellationToken ct)
    {
        var comment = await OwnAsync(user, id, input.Version, ct);
        await RequirePublicAsync(comment.AnimeId, ct);
        if (comment.Status != "visible") throw ApiFailure.Conflict();
        comment.Body = FeatureRules.Text(input.Body, "body", 1, 2000);
        comment.UpdatedAt = time.GetUtcNow();
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }
    public async Task DeleteAsync(string user, string id, long version, CancellationToken ct)
    {
        var comment = await OwnAsync(user, id, version, ct);
        if (comment.Status == "deleted") throw ApiFailure.Conflict();
        comment.Status = "deleted";
        comment.Body = null;
        comment.DeletedAt = comment.UpdatedAt = time.GetUtcNow();
        await db.SaveChangesAsync(ct);
    }
    private async Task<CommentDto> GetAsync(string id, CancellationToken ct) =>
        await db.Comments.AsNoTracking().Where(x => x.Id == id).Select(Projection).SingleAsync(ct);

    public async Task<SummaryResponse<AdminCommentDto, CommentSummary>> AdminListAsync(AdminQuery filters, CancellationToken ct)
    {
        var query = db.Comments.AsNoTracking().AsQueryable();
        if (filters.AnimeId is not null) query = query.Where(x => x.AnimeId == filters.AnimeId);
        var summary = new CommentSummary(await query.CountAsync(ct), await query.CountAsync(x => x.Status == "visible", ct),
            await query.CountAsync(x => x.Status == "hidden", ct), await query.CountAsync(x => x.Status == "deleted", ct));
        if (filters.Status is not null)
        {
            var status = FeatureRules.Choice(filters.Status, "status", "visible", "hidden", "deleted");
            query = query.Where(x => x.Status == status);
        }
        var search = filters.Q?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search)) query = query.Where(x => x.Id.ToLower().Contains(search) || x.UserId.ToLower().Contains(search)
            || x.User.DisplayName.ToLower().Contains(search) || x.Status != "deleted" && x.Body!.ToLower().Contains(search));
        var sort = FeatureRules.Choice(filters.Sort ?? "newest", "sort", "newest", "oldest", "updated");
        query = sort == "oldest" ? query.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id) : sort == "updated"
            ? query.OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.Id) : query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id);
        var result = await query.Select(Projection).PageAsync(filters, ct);
        var ids = result.Data.Select(x => x.Id).ToArray();
        var audits = await db.CommentModerations.AsNoTracking().Where(x => ids.Contains(x.CommentId))
            .Where(x => !db.CommentModerations.Any(other => other.CommentId == x.CommentId && (other.ModeratedAt > x.ModeratedAt
                || other.ModeratedAt == x.ModeratedAt && other.Id.CompareTo(x.Id) < 0)))
            .Select(x => new { x.CommentId, Audit = new ModerationDto(x.Action, x.Reason, x.Moderator.DisplayName, x.ModeratedAt) })
            .ToDictionaryAsync(x => x.CommentId, x => x.Audit, ct);
        return new(result.Data.Select(x => new AdminCommentDto(x, audits.GetValueOrDefault(x.Id))).ToArray(), result.Meta, summary);
    }
    public async Task<AdminCommentDto> AdminGetAsync(string id, CancellationToken ct)
    {
        var comment = await db.Comments.AsNoTracking().Where(x => x.Id == id).Select(Projection).SingleOrDefaultAsync(ct)
            ?? throw ApiFailure.NotFound();
        var audit = await db.CommentModerations.AsNoTracking().Where(x => x.CommentId == id)
            .OrderByDescending(x => x.ModeratedAt).ThenBy(x => x.Id)
            .Select(x => new ModerationDto(x.Action, x.Reason, x.Moderator.DisplayName, x.ModeratedAt)).FirstOrDefaultAsync(ct);
        return new(comment, audit);
    }
    public async Task<AdminCommentDto> ModerateAsync(string user, string id, ModerationInput input, CancellationToken ct)
    {
        var comment = await db.Comments.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(comment, input.Version);
        if (input.Action == "hide" && comment.Status != "visible" || input.Action == "restore" && comment.Status != "hidden")
            throw ApiFailure.Conflict();
        comment.Status = input.Action == "hide" ? "hidden" : "visible";
        comment.UpdatedAt = time.GetUtcNow();
        db.CommentModerations.Add(new()
        {
            CommentId = id,
            ModeratorId = user,
            Action = input.Action,
            Reason = FeatureRules.Text(input.Reason, "reason", 3, 300),
            ModeratedAt = time.GetUtcNow()
        });
        await db.SaveChangesAsync(ct);
        return await AdminGetAsync(id, ct);
    }
}
