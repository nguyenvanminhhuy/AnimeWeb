using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Tests.Integration;

// This assembly is registered only by ApiFactory, never by the deployed application.
[ApiController]
[Route("_tests/pipeline")]
public sealed class PipelineProbeController : ControllerBase
{
    [HttpPost("validation")]
    public IActionResult Validate(ProbeRequest request) => NoContent();

    [HttpGet("exception")]
    public IActionResult Throw() => throw new InvalidOperationException("fixture-secret-must-not-leak");
}

public sealed record ProbeRequest([Required] string Name);
