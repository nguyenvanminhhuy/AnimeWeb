using System.Security.Claims;
using AnimeWeb.Api.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AnimeWeb.Api.Features.Auth;

[ApiController, Route("api/v1/auth"), EnableRateLimiting("auth")]
public sealed class AuthController(AccountService service) : ControllerBase
{
    [AllowAnonymous, HttpPost("register")]
    [ProducesResponseType<ApiResponse<LoginDto>>(201)]
    public async Task<ActionResult<ApiResponse<LoginDto>>> Register(RegisterInput input, CancellationToken ct) =>
        StatusCode(201, new ApiResponse<LoginDto>(await service.RegisterAsync(input, ct)));
    [AllowAnonymous, HttpPost("login")]
    [ProducesResponseType<global::AnimeWeb.Api.Shared.Errors.ApiErrorResponse>(401)]
    [ProducesResponseType<global::AnimeWeb.Api.Shared.Errors.ApiErrorResponse>(403)]
    public async Task<ApiResponse<LoginDto>> Login(LoginInput input, CancellationToken ct) => new(await service.LoginAsync(input, ct));
    [Authorize, HttpPost("logout")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await service.LogoutAsync(User.FindFirstValue("sessionHash")!, ct);
        return NoContent();
    }
}

[ApiController, Authorize, Route("api/v1/me")]
public sealed class ProfileController(AccountService service) : ControllerBase
{
    [HttpGet]
    public async Task<ApiResponse<ProfileDto>> Profile(CancellationToken ct) => new(await service.ProfileAsync(User.UserId(), ct));
    [HttpPost("change-password"), EnableRateLimiting("auth")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> ChangePassword(PasswordInput input, CancellationToken ct)
    {
        await service.ChangePasswordAsync(User.UserId(), input, ct);
        return NoContent();
    }
}
