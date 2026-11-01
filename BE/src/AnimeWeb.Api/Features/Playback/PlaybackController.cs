using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Playback;

[ApiController, AllowAnonymous, Route("api/v1/common")]
public sealed class PlaybackController(PlaybackService service) : ControllerBase
{
    [HttpGet("episodes/{episodeId}/playback")]
    [ProducesResponseType<global::AnimeWeb.Api.Shared.Errors.ApiErrorResponse>(503)]
    public async Task<ApiResponse<PlaybackDto>> Get([StringLength(100)] string episodeId, CancellationToken ct) => new(await service.GetAsync(episodeId, ct));
    [HttpPost("episodes/{episodeId}/view-sessions")]
    [ProducesResponseType<ApiResponse<ViewStartDto>>(201)]
    public async Task<ActionResult<ApiResponse<ViewStartDto>>> Start([StringLength(100)] string episodeId, ViewInput input, CancellationToken ct) =>
        StatusCode(201, new ApiResponse<ViewStartDto>(await service.StartViewAsync(episodeId, service.Viewer(HttpContext), input, ct)));
    [HttpPost("view-sessions/{id}/confirm")]
    public async Task<ApiResponse<ViewConfirmDto>> Confirm([StringLength(100)] string id, ViewInput input, CancellationToken ct) =>
        new(await service.ConfirmViewAsync(id, service.Viewer(HttpContext), input, ct));
}
