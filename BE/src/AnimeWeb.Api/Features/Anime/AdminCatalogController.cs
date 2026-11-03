using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Anime;

[ApiController, Route("api/v1/admin")]
public sealed class AdminCatalogController(AdminCatalogService service) : ControllerBase
{
    [Permission("admin:anime:read"), HttpGet("anime")]
    public Task<AdminAnimeResult> List([FromQuery] AdminQuery query, CancellationToken ct) => service.ListAsync(query, ct);
    [Permission("admin:anime:read"), HttpGet("anime/options")]
    public Task<PagedResponse<AnimeOptionDto>> Options([FromQuery] AdminQuery query, CancellationToken ct) => service.OptionsAsync(query, ct);
    [Permission("admin:anime:read"), HttpGet("anime/{id}")]
    public async Task<ApiResponse<AdminAnimeDto>> Get([StringLength(100)] string id, CancellationToken ct) => new(await service.GetAsync(id, ct));
    [Permission("admin:anime:write"), HttpPost("anime")]
    [ProducesResponseType<ApiResponse<AdminAnimeDto>>(201)]
    public async Task<ActionResult<ApiResponse<AdminAnimeDto>>> Create(AdminAnimeInput input, CancellationToken ct) =>
        StatusCode(201, new ApiResponse<AdminAnimeDto>(await service.SaveAsync(null, input, ct)));
    [Permission("admin:anime:write"), HttpPatch("anime/{id}")]
    public async Task<ApiResponse<AdminAnimeDto>> Update([StringLength(100)] string id, AdminAnimeInput input, CancellationToken ct) => new(await service.SaveAsync(id, input, ct));
    [Permission("admin:anime:write"), HttpDelete("anime/{id}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Delete([StringLength(100)] string id, [FromQuery] DeleteQuery query, CancellationToken ct)
    { await service.DeleteAsync(id, query.Version!.Value, ct); return NoContent(); }
    [Permission("admin:genre:read"), HttpGet("genres")]
    public Task<PagedResponse<AdminGenreDto>> Genres([FromQuery] AdminQuery query, CancellationToken ct) => service.GenresAsync(query, ct);
    [Permission("admin:genre:read"), HttpGet("genres/options")]
    public async Task<ApiResponse<List<AdminGenreDto>>> GenreOptions(CancellationToken ct) => new(await service.GenreOptionsAsync(ct));
    [Permission("admin:genre:read"), HttpGet("genres/{id}")]
    public async Task<ApiResponse<AdminGenreDto>> Genre([StringLength(100)] string id, CancellationToken ct) => new(await service.GetGenreAsync(id, ct));
    [Permission("admin:genre:write"), HttpPost("genres")]
    [ProducesResponseType<ApiResponse<AdminGenreDto>>(201)]
    public async Task<ActionResult<ApiResponse<AdminGenreDto>>> CreateGenre(GenreInput input, CancellationToken ct) =>
        StatusCode(201, new ApiResponse<AdminGenreDto>(await service.SaveGenreAsync(null, input, ct)));
    [Permission("admin:genre:write"), HttpPatch("genres/{id}")]
    public async Task<ApiResponse<AdminGenreDto>> UpdateGenre([StringLength(100)] string id, GenreInput input, CancellationToken ct) => new(await service.SaveGenreAsync(id, input, ct));
    [Permission("admin:genre:write"), HttpDelete("genres/{id}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteGenre([StringLength(100)] string id, [FromQuery] DeleteQuery query, CancellationToken ct)
    { await service.DeleteGenreAsync(id, query.Version!.Value, ct); return NoContent(); }
}
