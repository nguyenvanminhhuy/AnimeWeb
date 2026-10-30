using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Health;

[ApiController]
[Route("api/v1/health")]
public sealed class HealthController(AnimeWebDbContext database) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<ApiResponse<HealthStatus>>(StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<HealthStatus>> Get() => Ok(new ApiResponse<HealthStatus>(new("ok")));

    [HttpGet("ready")]
    [ProducesResponseType<ApiResponse<HealthStatus>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiErrorResponse>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<HealthStatus>>> GetReadinessAsync(CancellationToken cancellationToken)
    {
        if (!await database.Database.CanConnectAsync(cancellationToken))
        {
            return StatusCode(503, ApiErrors.Create(HttpContext, 503));
        }
        return Ok(new ApiResponse<HealthStatus>(new("ready")));
    }
}

public sealed record HealthStatus(string Status);
