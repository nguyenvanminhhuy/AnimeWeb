using AnimeWeb.Api.Features.Anime.Dtos;
using AnimeWeb.Api.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Anime;

[ApiController]
[AllowAnonymous]
[Route("api/v1/common/genres")]
public sealed class GenresController(AnimeService service) : ControllerBase
{
    [HttpGet]
    public async Task<ApiResponse<List<GenreDto>>> ListAsync(CancellationToken cancellationToken) =>
        new(await service.ListGenresAsync(cancellationToken));
}
