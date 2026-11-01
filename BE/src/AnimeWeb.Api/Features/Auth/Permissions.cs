namespace AnimeWeb.Api.Features.Auth;

public static class Permissions
{
    public static readonly string[] Personal = ["catalog:read", "playback:read", "comment:read",
        "library:read:own", "library:write:own", "progress:read:own", "progress:write:own",
        "comment:create", "comment:update:own", "comment:delete:own"];
    public static readonly string[] AdminRead = ["admin:dashboard:read", "admin:anime:read", "admin:genre:read",
        "admin:episode:read", "admin:playback:read", "admin:comment:read", "admin:user:read"];
    public static readonly string[] AdminWrite = ["admin:anime:write", "admin:genre:write", "admin:episode:write",
        "admin:playback:write", "admin:comment:moderate"];
    public static IEnumerable<string> All => Personal.Concat(AdminRead).Concat(AdminWrite);
    public static IEnumerable<string> ForRole(string role) => role switch
    {
        "user" => Personal,
        "manage" => Personal.Concat(AdminRead),
        "admin" => All,
        _ => []
    };
}
