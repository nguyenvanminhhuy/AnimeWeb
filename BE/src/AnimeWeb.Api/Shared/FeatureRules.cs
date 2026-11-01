using System.ComponentModel.DataAnnotations;
using AnimeWeb.Api.Shared.Errors;
using Microsoft.AspNetCore.Mvc;

namespace AnimeWeb.Api.Shared;

public class VersionInput
{
    [Range(0, long.MaxValue)]
    public long Version { get; set; }
}

public sealed class DeleteQuery
{
    [FromQuery(Name = "version"), Required, Range(1, long.MaxValue)]
    public long? Version { get; set; }
}

public static class FeatureRules
{
    public static string Id() => Guid.NewGuid().ToString("N");
    public static void Version(VersionedEntity entity, long expected)
    {
        if (expected != entity.Version) throw ApiFailure.Conflict();
    }
    public static void NewVersion(long expected)
    {
        if (expected != 0) throw ApiFailure.Invalid("version");
    }
    public static string Text(string? value, string field, int min, int max)
    {
        var text = value?.Trim() ?? "";
        if (text.Length < min || text.Length > max) throw ApiFailure.Invalid(field);
        return text;
    }
    public static string Choice(string? value, string field, params string[] choices) =>
        value is not null && choices.Contains(value) ? value : throw ApiFailure.Invalid(field);
    public static string MediaUrl(string? value, string field, bool production)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme is not ("https" or "http")
            || production && uri.Scheme != "https" || !string.IsNullOrEmpty(uri.UserInfo) || value.Length > 2048)
            throw ApiFailure.Invalid(field);
        return value;
    }
}
