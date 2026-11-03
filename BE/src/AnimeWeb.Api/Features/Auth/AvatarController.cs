using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Auth;

[ApiController, Route("api/v1/me/avatar"), Permission("profile:avatar:write:own")]
public sealed class AvatarController(AvatarService service) : ControllerBase
{
    [HttpPut, RequestSizeLimit(AvatarService.MaxBytes + 1)]
    public async Task<ApiResponse<ProfileDto>> Upload([FromQuery, Required, Range(1, long.MaxValue)] long? version, CancellationToken ct)
    {
        if (Request.ContentType?.Split(';')[0].Trim() != "image/png")
            throw new ApiFailure(415, "UNSUPPORTED_MEDIA_TYPE", "Upload a PNG image.");
        using var content = new MemoryStream();
        var buffer = new byte[8192];
        int read;
        while ((read = await Request.Body.ReadAsync(buffer, ct)) > 0)
        {
            if (content.Length + read > AvatarService.MaxBytes)
                throw new ApiFailure(413, "AVATAR_TOO_LARGE", "Avatar exceeds 2 MiB.");
            content.Write(buffer, 0, read);
        }
        return new(await service.SaveAsync(User.UserId(), version!.Value, content.ToArray(), ct));
    }
    [HttpDelete]
    public async Task<ApiResponse<ProfileDto>> Delete([FromQuery, Required, Range(1, long.MaxValue)] long? version, CancellationToken ct) =>
        new(await service.SaveAsync(User.UserId(), version!.Value, null, ct));
}

[ApiController, Route("api/v1/common/avatars")]
public sealed class PublicAvatarController(AvatarService service) : ControllerBase
{
    [AllowAnonymous, HttpGet("{id}/{key}")]
    public async Task<IActionResult> Image([StringLength(100)] string id, [StringLength(32)] string key, CancellationToken ct)
    {
        var content = await service.ReadAsync(id, key, ct);
        Response.Headers.XContentTypeOptions = "nosniff";
        Response.Headers.CacheControl = "no-cache";
        return File(content, "image/png");
    }
}
