using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Auth;

public sealed record AdminUserDto(string Id, string DisplayName, string Email, string Status, DateTimeOffset CreatedAt, string[] Roles);
public sealed record UserSummary(int Total, int Active, int Blocked);
public sealed class AdminUserService(AnimeWebDbContext db)
{
    private IQueryable<AdminUserDto> Project(IQueryable<Account> query) => query.Select(x => new AdminUserDto(x.Id, x.DisplayName,
        x.Email, x.Status, x.CreatedAt, db.UserRoles.Where(r => r.UserId == x.Id).OrderBy(r => r.RoleCode).Select(r => r.RoleCode).ToArray()));
    public async Task<SummaryResponse<AdminUserDto, UserSummary>> ListAsync(AdminQuery filters, CancellationToken ct)
    {
        var summary = new UserSummary(await db.Accounts.CountAsync(ct), await db.Accounts.CountAsync(x => x.Status == "active", ct),
            await db.Accounts.CountAsync(x => x.Status == "blocked", ct));
        var query = db.Accounts.AsNoTracking();
        var search = filters.Q?.Trim().ToLower();
        if (!string.IsNullOrEmpty(search)) query = query.Where(x => x.DisplayName.ToLower().Contains(search) || x.Email.ToLower().Contains(search));
        if (filters.Status is not null)
        { var status = FeatureRules.Choice(filters.Status, "status", "active", "blocked"); query = query.Where(x => x.Status == status); }
        var sort = FeatureRules.Choice(filters.Sort ?? "newest", "sort", "newest", "oldest", "name");
        query = sort == "name" ? query.OrderBy(x => x.DisplayName.ToLower()).ThenBy(x => x.Id) : sort == "oldest"
            ? query.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id) : query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id);
        var result = await Project(query).PageAsync(filters, ct);
        return new(result.Data, result.Meta, summary);
    }
    public async Task<AdminUserDto> GetAsync(string id, CancellationToken ct) => await Project(db.Accounts.AsNoTracking().Where(x => x.Id == id))
        .SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
}
