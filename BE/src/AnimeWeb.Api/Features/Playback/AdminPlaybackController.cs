using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Playback;

[ApiController, Route("api/v1/admin")]
public sealed class AdminPlaybackController(AdminPlaybackService service) : ControllerBase
{
    [Permission("admin:playback:read"), HttpGet("playback-sources")]
    public Task<PagedResponse<AdminSourceDto>> List([FromQuery] AdminQuery query, CancellationToken ct) => service.ListAsync(query, ct);
    [Permission("admin:playback:read"), HttpGet("playback-sources/{id}")]
    public async Task<ApiResponse<AdminSourceDto>> Get([StringLength(100)] string id, CancellationToken ct) => new(await service.GetAsync(id, ct));
    [Permission("admin:playback:write"), HttpPost("playback-sources")]
    [ProducesResponseType<ApiResponse<AdminSourceDto>>(201)]
    public async Task<ActionResult<ApiResponse<AdminSourceDto>>> Create(SourceInput input, CancellationToken ct) =>
        StatusCode(201, new ApiResponse<AdminSourceDto>(await service.SaveAsync(null, input, ct)));
    [Permission("admin:playback:write"), HttpPatch("playback-sources/{id}")]
    public async Task<ApiResponse<AdminSourceDto>> Update([StringLength(100)] string id, SourceInput input, CancellationToken ct) => new(await service.SaveAsync(id, input, ct));
    [Permission("admin:playback:write"), HttpDelete("playback-sources/{id}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Delete([StringLength(100)] string id, [FromQuery] DeleteQuery query, CancellationToken ct)
    { await service.DeleteAsync(id, query.Version!.Value, ct); return NoContent(); }
    [Permission("admin:playback:read"), HttpGet("playback-sources/{id}/subtitles")]
    public async Task<ApiResponse<List<AdminSubtitleDto>>> Subtitles([StringLength(100)] string id, CancellationToken ct) => new(await service.SubtitlesAsync(id, ct));
    [Permission("admin:playback:read"), HttpGet("subtitles/{id}")]
    public async Task<ApiResponse<AdminSubtitleDto>> Subtitle([StringLength(100)] string id, CancellationToken ct) => new(await service.SubtitleAsync(id, ct));
    [Permission("admin:playback:write"), HttpPost("subtitles")]
    [ProducesResponseType<ApiResponse<AdminSubtitleDto>>(201)]
    public async Task<ActionResult<ApiResponse<AdminSubtitleDto>>> CreateSubtitle(SubtitleInput input, CancellationToken ct) =>
        StatusCode(201, new ApiResponse<AdminSubtitleDto>(await service.SaveSubtitleAsync(null, input, ct)));
    [Permission("admin:playback:write"), HttpPatch("subtitles/{id}")]
    public async Task<ApiResponse<AdminSubtitleDto>> UpdateSubtitle([StringLength(100)] string id, SubtitleInput input, CancellationToken ct) => new(await service.SaveSubtitleAsync(id, input, ct));
    [Permission("admin:playback:write"), HttpDelete("subtitles/{id}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteSubtitle([StringLength(100)] string id, [FromQuery] DeleteQuery query, CancellationToken ct)
    { await service.DeleteSubtitleAsync(id, query.Version!.Value, ct); return NoContent(); }
}
