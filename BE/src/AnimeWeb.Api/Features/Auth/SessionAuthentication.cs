using System.Security.Claims;
using System.Text.Encodings.Web;
using AnimeWeb.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AnimeWeb.Api.Features.Auth;

public sealed class PermissionAttribute(string permission) : AuthorizeAttribute(permission);

public static class SessionIdentity
{
    public static string UserId(this ClaimsPrincipal user) => user.FindFirstValue(ClaimTypes.NameIdentifier)!;
}

public sealed class SessionAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger, UrlEncoder encoder, AnimeWebDbContext db, AccountService accounts, TimeProvider time)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "SessionBearer";
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers.Authorization.ToString();
        if (header.Length == 0) return AuthenticateResult.NoResult();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return AuthenticateResult.Fail("Invalid authorization.");
        var token = header[7..];
        if (token.Length != 64 || !token.All(Uri.IsHexDigit)) return AuthenticateResult.Fail("Invalid session.");
        var hash = AccountService.Hash(token);
        var session = await db.LoginSessions.AsNoTracking().Include(x => x.User)
            .SingleOrDefaultAsync(x => x.TokenHash == hash && x.RevokedAt == null && x.ExpiresAt > time.GetUtcNow(), Context.RequestAborted);
        if (session is null) return AuthenticateResult.Fail("Invalid session.");
        var profile = await accounts.ProfileAsync(session.UserId, Context.RequestAborted);
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, session.UserId),
            new("sessionHash", hash), new("accountStatus", session.User.Status) };
        claims.AddRange(profile.Roles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(profile.Permissions.Select(permission => new Claim("permission", permission)));
        return AuthenticateResult.Success(new(new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName)), SchemeName));
    }
    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = 401;
        Response.Headers.WWWAuthenticate = "Bearer";
        return Task.CompletedTask;
    }
    protected override Task HandleForbiddenAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = 403;
        return Task.CompletedTask;
    }
}
