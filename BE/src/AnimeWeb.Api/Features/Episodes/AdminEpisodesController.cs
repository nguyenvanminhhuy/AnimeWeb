using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Episodes;

[ApiController, Route("api/v1/admin")]
public sealed class AdminEpisodesController(AdminEpisodeService service) : ControllerBase
{
    [Permission("admin:episode:read"), HttpGet("seasons")]
    public Task<PagedResponse<AdminSeasonDto>> Seasons([FromQuery] AdminQuery query, CancellationToken ct) => service.SeasonsAsync(query, ct);
    [Permission("admin:episode:read"), HttpGet("seasons/{id}")]
    public async Task<ApiResponse<AdminSeasonDto>> Season([StringLength(100)] string id, CancellationToken ct) => new(await service.SeasonAsync(id, ct));
    [Permission("admin:episode:write"), HttpPost("seasons")]
    [ProducesResponseType<ApiResponse<AdminSeasonDto>>(201)]
    public async Task<ActionResult<ApiResponse<AdminSeasonDto>>> CreateSeason(SeasonInput input, CancellationToken ct) =>
        StatusCode(201, new ApiResponse<AdminSeasonDto>(await service.SaveSeasonAsync(null, input, ct)));
    [Permission("admin:episode:write"), HttpPatch("seasons/{id}")]
    public async Task<ApiResponse<AdminSeasonDto>> UpdateSeason([StringLength(100)] string id, SeasonInput input, CancellationToken ct) => new(await service.SaveSeasonAsync(id, input, ct));
    [Permission("admin:episode:write"), HttpDelete("seasons/{id}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteSeason([StringLength(100)] string id, [FromQuery] DeleteQuery query, CancellationToken ct)
    { await service.DeleteSeasonAsync(id, query.Version!.Value, ct); return NoContent(); }
    [Permission("admin:episode:read"), HttpGet("episodes")]
    public Task<PagedResponse<AdminEpisodeDto>> Episodes([FromQuery] AdminQuery query, CancellationToken ct) => service.EpisodesAsync(query, ct);
    [Permission("admin:episode:read"), HttpGet("episodes/{id}")]
    public async Task<ApiResponse<AdminEpisodeDto>> Episode([StringLength(100)] string id, CancellationToken ct) => new(await service.EpisodeAsync(id, ct));
    [Permission("admin:episode:write"), HttpPost("episodes")]
    [ProducesResponseType<ApiResponse<AdminEpisodeDto>>(201)]
    public async Task<ActionResult<ApiResponse<AdminEpisodeDto>>> CreateEpisode(EpisodeInput input, CancellationToken ct) =>
        StatusCode(201, new ApiResponse<AdminEpisodeDto>(await service.SaveEpisodeAsync(null, input, ct)));
    [Permission("admin:episode:write"), HttpPatch("episodes/{id}")]
    public async Task<ApiResponse<AdminEpisodeDto>> UpdateEpisode([StringLength(100)] string id, EpisodeInput input, CancellationToken ct) => new(await service.SaveEpisodeAsync(id, input, ct));
    [Permission("admin:episode:write"), HttpDelete("episodes/{id}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteEpisode([StringLength(100)] string id, [FromQuery] DeleteQuery query, CancellationToken ct)
    { await service.DeleteEpisodeAsync(id, query.Version!.Value, ct); return NoContent(); }
}
