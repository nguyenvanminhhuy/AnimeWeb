using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using AnimeWeb.Api.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Auth;

public sealed record AdminUserDto(string Id, string DisplayName, string Email, string Status, DateTimeOffset CreatedAt, string[] Roles, long Version, string? AvatarUrl);
public sealed class AccountStatusInput
{
    [Required, RegularExpression("^(active|blocked)$")]
    public string Status { get; set; } = "";
    [Required, Range(1, long.MaxValue)]
    public long? Version { get; set; }
}
public sealed class AccountRoleInput
{
    [Required, RegularExpression("^(user|manage|admin)$")]
    public string Role { get; set; } = "";
    [Required, Range(1, long.MaxValue)]
    public long? Version { get; set; }
}
public sealed record UserSummary(int Total, int Active, int Blocked);
public sealed class AdminUserService(AnimeWebDbContext db, TimeProvider time)
{
    private IQueryable<AdminUserDto> Project(IQueryable<Account> query) => query.Select(x => new AdminUserDto(x.Id, x.DisplayName,
        x.Email, x.Status, x.CreatedAt, db.UserRoles.Where(r => r.UserId == x.Id).OrderBy(r => r.RoleCode).Select(r => r.RoleCode).ToArray(), x.Version,
        x.AvatarKey == null ? null : "/api/v1/common/avatars/" + x.Id + "/" + x.AvatarKey));
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

    public async Task<AdminUserDto> SetStatusAsync(string actorId, string id, AccountStatusInput input, CancellationToken ct)
    {
        var status = FeatureRules.Choice(input.Status, "status", "active", "blocked");
        if (input.Version is not > 0) throw ApiFailure.Invalid("version");
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // Share the bootstrap lock to serialize changes to the active administrator set.
        var adminLock = "animeweb-bootstrap-admin";
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({adminLock}, 0))", ct);
        // Recheck after waiting for the lock: the actor may have been blocked meanwhile.
        if (!await db.Accounts.AnyAsync(x => x.Id == actorId && x.Status == "active", ct)
            || !await (from role in db.UserRoles
                       join permission in db.RolePermissions on role.RoleCode equals permission.RoleCode
                       where role.UserId == actorId && permission.PermissionCode == "admin:user:status:write"
                       select role.UserId).AnyAsync(ct))
            throw new ApiFailure(403, "FORBIDDEN", "Account status changes require an active administrator.");
        // Login and password changes take this same account lock, preventing a concurrent new session after blocking.
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({id}, 0))", ct);
        var user = await db.Accounts.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(user, input.Version.Value);
        if (status == "blocked")
        {
            if (actorId == id) throw new ApiFailure(409, "SELF_BLOCK_NOT_ALLOWED", "Administrators cannot block their own account.");
            if (user.Status == "active" && await db.UserRoles.AnyAsync(x => x.UserId == id && x.RoleCode == "admin", ct)
                && await db.Accounts.CountAsync(x => x.Status == "active" && db.UserRoles.Any(r => r.UserId == x.Id && r.RoleCode == "admin"), ct) <= 1)
                throw new ApiFailure(409, "LAST_ACTIVE_ADMIN", "The last active administrator cannot be blocked.");
            await db.LoginSessions.Where(x => x.UserId == id && x.RevokedAt == null)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.RevokedAt, time.GetUtcNow()), ct);
        }
        user.Status = status;
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return await GetAsync(id, ct);
    }
    public async Task<AdminUserDto> SetRoleAsync(string actorId, string id, AccountRoleInput input, CancellationToken ct)
    {
        var role = FeatureRules.Choice(input.Role, "role", "user", "manage", "admin");
        if (input.Version is not > 0) throw ApiFailure.Invalid("version");
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // All changes to the active admin set share the bootstrap/status lock, then the login lock.
        var adminLock = "animeweb-bootstrap-admin";
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({adminLock}, 0))", ct);
        if (!await db.Accounts.AnyAsync(x => x.Id == actorId && x.Status == "active", ct)
            || !await (from assigned in db.UserRoles
                       join permission in db.RolePermissions on assigned.RoleCode equals permission.RoleCode
                       where assigned.UserId == actorId && permission.PermissionCode == "admin:user:role:write"
                       select assigned.UserId).AnyAsync(ct))
            throw new ApiFailure(403, "FORBIDDEN", "Role changes require an active administrator.");
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({id}, 0))", ct);
        var user = await db.Accounts.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw ApiFailure.NotFound();
        FeatureRules.Version(user, input.Version.Value);
        var roles = await db.UserRoles.Where(x => x.UserId == id).ToListAsync(ct);
        if (actorId == id && role != "admin")
            throw new ApiFailure(409, "SELF_ROLE_CHANGE_NOT_ALLOWED", "Administrators cannot demote their own account.");
        if (role != "admin" && user.Status == "active" && roles.Any(x => x.RoleCode == "admin")
            && await db.Accounts.CountAsync(x => x.Status == "active" && db.UserRoles.Any(r => r.UserId == x.Id && r.RoleCode == "admin"), ct) <= 1)
            throw new ApiFailure(409, "LAST_ACTIVE_ADMIN", "The last active administrator cannot be demoted.");
        // Replace the complete assignment with exactly one supported role. A true no-op preserves sessions/version.
        if (roles.Count != 1 || roles[0].RoleCode != role)
        {
            db.UserRoles.RemoveRange(roles.Where(x => x.RoleCode != role));
            if (!roles.Any(x => x.RoleCode == role)) db.UserRoles.Add(new() { UserId = id, RoleCode = role });
            db.Entry(user).Property(x => x.Version).IsModified = true;
            await db.LoginSessions.Where(x => x.UserId == id && x.RevokedAt == null)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.RevokedAt, time.GetUtcNow()), ct);
            await db.SaveChangesAsync(ct);
        }
        await transaction.CommitAsync(ct);
        return await GetAsync(id, ct);
    }

}
