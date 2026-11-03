using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Tests.Integration;

// This assembly is registered only by ApiFactory, never by the deployed application.
[ApiController]
[Route("_tests/pipeline")]
public sealed class PipelineProbeController : ControllerBase
{
    private static readonly byte[] payload = Enumerable.Range(0, 256 * 1024).Select(i => (byte)(i % 251)).ToArray();
    [HttpGet("media")]
    public IActionResult Media() => File(payload, "application/octet-stream", enableRangeProcessing: true);
    [HttpGet("client")]
    public IActionResult Client() => Ok(new { ip = HttpContext.Connection.RemoteIpAddress?.ToString(), scheme = Request.Scheme });
    [HttpPost("validation")]
    public IActionResult Validate(ProbeRequest request) => NoContent();

    [HttpGet("exception")]
    public IActionResult Throw() => throw new InvalidOperationException("fixture-secret-must-not-leak");
}

public sealed record ProbeRequest([Required] string Name);
