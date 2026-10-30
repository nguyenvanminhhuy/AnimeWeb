using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Episodes.Dtos;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Episodes;

[ApiController]
[AllowAnonymous]
[Route("api/v1/common")]
public sealed class EpisodesController(EpisodeService service) : ControllerBase
{
    [HttpGet("anime/{animeId}/seasons")]
    [ProducesResponseType<ApiResponse<List<SeasonDto>>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<List<SeasonDto>>>> ListSeasonsAsync(
        [StringLength(100, MinimumLength = 1)] string animeId, CancellationToken cancellationToken)
    {
        var seasons = await service.ListSeasonsAsync(animeId, cancellationToken);
        if (seasons is null)
        {
            return ResourceNotFound("ANIME_NOT_FOUND", "Không tìm thấy anime.");
        }
        return Ok(new ApiResponse<List<SeasonDto>>(seasons));
    }

    [HttpGet("seasons/{seasonId}/episodes")]
    [ProducesResponseType<PagedResponse<EpisodeDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedResponse<EpisodeDto>>> ListEpisodesAsync(
        [StringLength(100, MinimumLength = 1)] string seasonId,
        [FromQuery] PageQuery query, CancellationToken cancellationToken)
    {
        var episodes = await service.ListEpisodesAsync(seasonId, query, cancellationToken);
        if (episodes is null)
        {
            return ResourceNotFound("SEASON_NOT_FOUND", "Không tìm thấy mùa phim.");
        }
        return Ok(episodes);
    }

    [HttpGet("episodes/{episodeId}")]
    [ProducesResponseType<ApiResponse<EpisodeDetailDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<EpisodeDetailDto>>> GetEpisodeAsync(
        [StringLength(100, MinimumLength = 1)] string episodeId, CancellationToken cancellationToken)
    {
        var episode = await service.GetEpisodeAsync(episodeId, cancellationToken);
        if (episode is null)
        {
            return ResourceNotFound("EPISODE_NOT_FOUND", "Không tìm thấy tập phim.");
        }
        return Ok(new ApiResponse<EpisodeDetailDto>(episode));
    }

    private NotFoundObjectResult ResourceNotFound(string code, string message) =>
        NotFound(new ApiErrorResponse(new ApiError(code, message, HttpContext.TraceIdentifier)));
}
