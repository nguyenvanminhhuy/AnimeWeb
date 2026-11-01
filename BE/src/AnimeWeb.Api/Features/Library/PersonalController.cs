using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Library;

[ApiController, Route("api/v1/me")]
public sealed class PersonalController(PersonalService service) : ControllerBase
{
    [HttpGet("library"), Permission("library:read:own")]
    public Task<SummaryResponse<LibraryRow, CollectionSummary>> Library([FromQuery] PersonalQuery query, CancellationToken ct) => service.LibraryAsync(User.UserId(), query, ct);
    [HttpGet("library/summary"), Permission("library:read:own")]
    public async Task<ApiResponse<PersonalSummary>> Summary(CancellationToken ct) => new(await service.SummaryAsync(User.UserId(), ct));
    [HttpPut("library/{animeId}"), Permission("library:write:own")]
    public async Task<ApiResponse<LibraryDto>> SaveLibrary([StringLength(100)] string animeId, LibraryInput input, CancellationToken ct) =>
        new(await service.SaveLibraryAsync(User.UserId(), animeId, input, ct));
    [HttpDelete("library/{animeId}"), Permission("library:write:own")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> DeleteLibrary([StringLength(100)] string animeId, [FromQuery] DeleteQuery query, CancellationToken ct)
    {
        await service.DeleteLibraryAsync(User.UserId(), animeId, query.Version!.Value, ct);
        return NoContent();
    }
    [HttpGet("progress"), Permission("progress:read:own")]
    public Task<SummaryResponse<ProgressRow, CollectionSummary>> Progress([FromQuery] PersonalQuery query, CancellationToken ct) => service.ProgressAsync(User.UserId(), query, ct);
    [HttpPut("progress/{episodeId}"), Permission("progress:write:own")]
    public async Task<ApiResponse<ProgressDto>> SaveProgress([StringLength(100)] string episodeId, ProgressInput input, CancellationToken ct) =>
        new(await service.SaveProgressAsync(User.UserId(), episodeId, input, ct));
}
