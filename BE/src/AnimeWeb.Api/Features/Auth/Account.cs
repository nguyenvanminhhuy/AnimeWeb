namespace AnimeWeb.Api.Features.Auth;

public sealed class Account : global::AnimeWeb.Api.Shared.VersionedEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DisplayName { get; set; } = "";
    public string Email { get; set; } = "";
    public string NormalizedEmail { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Status { get; set; } = "active";
    public string? AvatarKey { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AccountAvatar
{
    public string UserId { get; set; } = "";
    public byte[] Content { get; set; } = [];
}

public sealed class LoginSession
{
    public string TokenHash { get; set; } = "";
    public string UserId { get; set; } = "";
    public Account User { get; set; } = null!;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
}

public sealed class AccessRole { public string Code { get; set; } = ""; }
public sealed class AccessPermission { public string Code { get; set; } = ""; }
public sealed class UserRole
{
    public string UserId { get; set; } = "";
    public string RoleCode { get; set; } = "";
}
public sealed class RolePermission
{
    public string RoleCode { get; set; } = "";
    public string PermissionCode { get; set; } = "";
}
