using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Features.Auth;

[ApiController, Route("api/v1/admin/users"), Permission("admin:user:read")]
public sealed class AdminUsersController(AdminUserService service) : ControllerBase
{
    [HttpGet]
    public Task<SummaryResponse<AdminUserDto, UserSummary>> List([FromQuery] AdminQuery query, CancellationToken ct) => service.ListAsync(query, ct);
    [HttpGet("{id}")]
    public async Task<ApiResponse<AdminUserDto>> Get([StringLength(100)] string id, CancellationToken ct) => new(await service.GetAsync(id, ct));
    [HttpPatch("{id}/status"), Permission("admin:user:status:write")]
    public async Task<ApiResponse<AdminUserDto>> SetStatus([StringLength(100)] string id, AccountStatusInput input, CancellationToken ct) =>
        new(await service.SetStatusAsync(User.UserId(), id, input, ct));
    [HttpPatch("{id}/role"), Permission("admin:user:role:write")]
    public async Task<ApiResponse<AdminUserDto>> SetRole([StringLength(100)] string id, AccountRoleInput input, CancellationToken ct) =>
        new(await service.SetRoleAsync(User.UserId(), id, input, ct));

}
