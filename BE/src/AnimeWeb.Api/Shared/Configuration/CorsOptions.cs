namespace AnimeWeb.Api.Shared.Configuration;

public sealed class CorsOptions
{
    public string[] AllowedOrigins { get; set; } = [];

    public static bool IsValidOrigin(string origin) =>
        Uri.TryCreate(origin, UriKind.Absolute, out var uri)
        && uri.Scheme is "http" or "https"
        && string.IsNullOrEmpty(uri.UserInfo)
        && string.IsNullOrEmpty(uri.Query)
        && string.IsNullOrEmpty(uri.Fragment)
        && uri.AbsolutePath == "/"
        && !origin.Contains('*');
}
