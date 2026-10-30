using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Anime.Dtos;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Anime;

[ApiController]
[AllowAnonymous]
[Route("api/v1/common/anime")]
public sealed class AnimeController(AnimeService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResponse<AnimeSummaryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status400BadRequest)]
    public Task<PagedResponse<AnimeSummaryDto>> ListAsync([FromQuery] AnimeQuery query, CancellationToken cancellationToken) =>
        service.ListAsync(query, cancellationToken);

    [HttpGet("{slug}")]
    [ProducesResponseType<ApiResponse<AnimeDetailDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<AnimeDetailDto>>> GetBySlugAsync(
        [StringLength(200), RegularExpression("^[a-z0-9]+(-[a-z0-9]+)*$")] string slug,
        CancellationToken cancellationToken)
    {
        var anime = await service.GetBySlugAsync(slug, cancellationToken);
        if (anime is null)
        {
            return NotFound(new ApiErrorResponse(new ApiError(
                "ANIME_NOT_FOUND", "Không tìm thấy anime.", HttpContext.TraceIdentifier)));
        }
        return Ok(new ApiResponse<AnimeDetailDto>(anime));
    }
}
