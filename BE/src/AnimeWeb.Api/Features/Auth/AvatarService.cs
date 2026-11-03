using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Auth;

public sealed class AvatarService(AnimeWebDbContext db, AccountService accounts)
{
    public const int MaxBytes = 2 * 1024 * 1024;
    public static string? Url(string id, string? key) => key is null ? null : $"/api/v1/common/avatars/{id}/{key}";

    public async Task<ProfileDto> SaveAsync(string userId, long version, byte[]? content, CancellationToken ct)
    {
        if (version < 1) throw ApiFailure.Invalid("version");
        if (content is not null) AvatarPng.Validate(content);
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // Same account lock as login/password/status/role. Recheck authorization after waiting.
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({userId}, 0))", ct);
        var user = await db.Accounts.SingleAsync(x => x.Id == userId, ct);
        if (user.Status != "active" || !await (from assigned in db.UserRoles
                                               join permission in db.RolePermissions on assigned.RoleCode equals permission.RoleCode
                                               where assigned.UserId == userId && permission.PermissionCode == "profile:avatar:write:own"
                                               select assigned.UserId).AnyAsync(ct))
            throw new ApiFailure(403, "FORBIDDEN", "Avatar changes require an active account with permission.");
        FeatureRules.Version(user, version);
        var avatar = await db.AccountAvatars.SingleOrDefaultAsync(x => x.UserId == userId, ct);
        if (content is null)
        {
            if (avatar is not null) db.AccountAvatars.Remove(avatar);
            user.AvatarKey = null;
        }
        else
        {
            if (avatar is null) db.AccountAvatars.Add(new() { UserId = userId, Content = content });
            else avatar.Content = content;
            user.AvatarKey = Guid.NewGuid().ToString("N");
        }
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return await accounts.ProfileAsync(userId, ct);
    }

    public async Task<byte[]> ReadAsync(string id, string key, CancellationToken ct) =>
        await (from avatar in db.AccountAvatars.AsNoTracking()
               join user in db.Accounts.AsNoTracking() on avatar.UserId equals user.Id
               where user.Id == id && user.AvatarKey == key
               select avatar.Content).SingleOrDefaultAsync(ct) ?? throw ApiFailure.NotFound();
}
