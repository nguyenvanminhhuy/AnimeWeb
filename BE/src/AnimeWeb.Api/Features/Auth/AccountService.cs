using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using AnimeWeb.Api.Infrastructure.Persistence;
using AnimeWeb.Api.Shared;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Auth;

public class LoginInput
{
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = "";
    [Required, StringLength(128, MinimumLength = 8)] public string Password { get; set; } = "";
}
public sealed class RegisterInput : LoginInput
{
    [Required, StringLength(40, MinimumLength = 2)] public string DisplayName { get; set; } = "";
}
public sealed class PasswordInput
{
    [Required, StringLength(128, MinimumLength = 8)] public string CurrentPassword { get; set; } = "";
    [Required, StringLength(128, MinimumLength = 8)] public string NewPassword { get; set; } = "";
}
public sealed record ProfileDto(string Id, string DisplayName, string Email, string[] Roles, string[] Permissions,
    string? AvatarUrl = null, long Version = 1);
public sealed record LoginDto(string AccessToken, string TokenType, DateTimeOffset ExpiresAt, ProfileDto Profile);

public sealed class AccountService(AnimeWebDbContext db, IPasswordHasher<Account> hasher, TimeProvider time)
{
    private static readonly Account Dummy = new();
    private static readonly string DummyHash = new PasswordHasher<Account>().HashPassword(Dummy, "unused-dummy-password");
    public static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    public async Task<LoginDto> RegisterAsync(RegisterInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Password)) throw ApiFailure.Invalid("password");
        var user = new Account
        {
            DisplayName = FeatureRules.Text(input.DisplayName, "displayName", 2, 40),
            Email = input.Email.Trim(),
            NormalizedEmail = input.Email.Trim().ToUpperInvariant(),
            CreatedAt = time.GetUtcNow()
        };
        user.PasswordHash = hasher.HashPassword(user, input.Password);
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        db.Accounts.Add(user);
        db.UserRoles.Add(new() { UserId = user.Id, RoleCode = "user" });
        await db.SaveChangesAsync(ct);
        var result = await IssueAsync(user, ct);
        await transaction.CommitAsync(ct);
        return result;
    }

    public async Task<LoginDto> LoginAsync(LoginInput input, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var user = await db.Accounts.SingleOrDefaultAsync(x => x.NormalizedEmail == input.Email.Trim().ToUpperInvariant(), ct);
        if (user is not null)
        {
            var id = user.Id;
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({id}, 0))", ct);
            await db.Entry(user).ReloadAsync(ct);
        }
        var verified = hasher.VerifyHashedPassword(user ?? Dummy, user?.PasswordHash ?? DummyHash, input.Password);
        if (user is null || verified == PasswordVerificationResult.Failed)
            throw new ApiFailure(401, "UNAUTHORIZED", "Invalid email or password.");
        if (user.Status != "active") throw new ApiFailure(403, "FORBIDDEN", "The account is blocked.");
        if (verified == PasswordVerificationResult.SuccessRehashNeeded)
            user.PasswordHash = hasher.HashPassword(user, input.Password);
        var result = await IssueAsync(user, ct);
        await transaction.CommitAsync(ct);
        return result;
    }

    private async Task<LoginDto> IssueAsync(Account user, CancellationToken ct)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expires = time.GetUtcNow().AddDays(7);
        db.LoginSessions.Add(new() { TokenHash = Hash(token), UserId = user.Id, ExpiresAt = expires });
        await db.SaveChangesAsync(ct);
        return new(token, "Bearer", expires, await ProfileAsync(user.Id, ct));
    }

    public async Task<ProfileDto> ProfileAsync(string userId, CancellationToken ct)
    {
        var user = await db.Accounts.AsNoTracking().Where(x => x.Id == userId)
            .Select(x => new { x.Id, x.DisplayName, x.Email, x.AvatarKey, x.Version }).SingleAsync(ct);
        var access = await AccessAsync(userId, ct);
        return new(user.Id, user.DisplayName, user.Email, access.Roles, access.Permissions, AvatarService.Url(user.Id, user.AvatarKey), user.Version);
    }

    public async Task<(string[] Roles, string[] Permissions)> AccessAsync(string userId, CancellationToken ct)
    {
        var roles = await db.UserRoles.Where(x => x.UserId == userId).Select(x => x.RoleCode).OrderBy(x => x).ToArrayAsync(ct);
        var permissions = await (from role in db.UserRoles
                                 join permission in db.RolePermissions on role.RoleCode equals permission.RoleCode
                                 where role.UserId == userId
                                 select permission.PermissionCode).Distinct().OrderBy(x => x).ToArrayAsync(ct);
        return (roles, permissions);
    }

    public Task LogoutAsync(string tokenHash, CancellationToken ct) => db.LoginSessions
        .Where(x => x.TokenHash == tokenHash).ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAt, time.GetUtcNow()), ct);

    public async Task ChangePasswordAsync(string userId, PasswordInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.NewPassword) || input.CurrentPassword == input.NewPassword)
            throw ApiFailure.Invalid("newPassword");
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({userId}, 0))", ct);
        var user = await db.Accounts.SingleAsync(x => x.Id == userId, ct);
        if (hasher.VerifyHashedPassword(user, user.PasswordHash, input.CurrentPassword) == PasswordVerificationResult.Failed)
            throw ApiFailure.Invalid("currentPassword");
        user.PasswordHash = hasher.HashPassword(user, input.NewPassword);
        await db.SaveChangesAsync(ct);
        await db.LoginSessions.Where(x => x.UserId == userId && x.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAt, time.GetUtcNow()), ct);
        await transaction.CommitAsync(ct);
    }
}
