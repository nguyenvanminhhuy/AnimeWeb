namespace AnimeWeb.Api.Features.Playback;

public sealed class PlaybackOptions
{
    public string? PublicMediaBaseUrl { get; set; }
    public static bool IsValid(string? value, bool development) => string.IsNullOrEmpty(value)
        || Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.UserInfo.Length == 0 && uri.Query.Length == 0 && uri.Fragment.Length == 0
        && (uri.Scheme == "https" || development && uri.Scheme == "http");
}
