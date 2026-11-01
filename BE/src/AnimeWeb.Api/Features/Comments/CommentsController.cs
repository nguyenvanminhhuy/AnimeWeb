using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Comments;

[ApiController, Route("api/v1")]
public sealed class CommentsController(CommentService service) : ControllerBase
{
    [AllowAnonymous, HttpGet("common/anime/{animeId}/comments")]
    public Task<PagedResponse<CommentDto>> List([StringLength(100)] string animeId, [FromQuery] PageQuery query, CancellationToken ct) =>
        service.PublicAsync(animeId, query, ct);
    [Permission("comment:create"), HttpPost("me/anime/{animeId}/comments")]
    [ProducesResponseType<ApiResponse<CommentDto>>(201)]
    public async Task<ActionResult<ApiResponse<CommentDto>>> Create([StringLength(100)] string animeId, CommentInput input, CancellationToken ct) =>
        StatusCode(201, new ApiResponse<CommentDto>(await service.CreateAsync(User.UserId(), animeId, input, ct)));
    [Permission("comment:update:own"), HttpPatch("me/comments/{id}")]
    public async Task<ApiResponse<CommentDto>> Update([StringLength(100)] string id, CommentInput input, CancellationToken ct) =>
        new(await service.UpdateAsync(User.UserId(), id, input, ct));
    [Permission("comment:delete:own"), HttpDelete("me/comments/{id}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Delete([StringLength(100)] string id, [FromQuery] DeleteQuery query, CancellationToken ct)
    {
        await service.DeleteAsync(User.UserId(), id, query.Version!.Value, ct);
        return NoContent();
    }
    [Permission("admin:comment:read"), HttpGet("admin/comments")]
    public Task<SummaryResponse<AdminCommentDto, CommentSummary>> AdminList([FromQuery] AdminQuery query, CancellationToken ct) => service.AdminListAsync(query, ct);
    [Permission("admin:comment:read"), HttpGet("admin/comments/{id}")]
    public async Task<ApiResponse<AdminCommentDto>> AdminGet([StringLength(100)] string id, CancellationToken ct) => new(await service.AdminGetAsync(id, ct));
    [Permission("admin:comment:moderate"), HttpPost("admin/comments/{id}/moderations")]
    public async Task<ApiResponse<AdminCommentDto>> Moderate([StringLength(100)] string id, ModerationInput input, CancellationToken ct) =>
        new(await service.ModerateAsync(User.UserId(), id, input, ct));
}
