using System.Security.Claims;
using AnimeWeb.Api.Features.Anime;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Features.Comments;
using AnimeWeb.Api.Features.Episodes;
using AnimeWeb.Api.Features.Playback;
using AnimeWeb.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Features.Audit;

internal static class AuditCapture
{
    public static async Task CaptureAsync(AnimeWebDbContext db, HttpContext? http, TimeProvider time, CancellationToken ct)
    {
        if (http?.User.Identity?.IsAuthenticated != true || !http.Request.Path.StartsWithSegments("/api/v1/admin")) return;
        var actor = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (actor is null) return;
        var actorName = await db.Accounts.AsNoTracking().Where(x => x.Id == actor).Select(x => x.DisplayName).SingleAsync(ct);
        var changes = db.ChangeTracker.Entries().Where(x => x.State is EntityState.Added or EntityState.Modified or EntityState.Deleted).ToArray();
        foreach (var entry in changes)
        {
            var target = entry.Entity switch
            {
                Anime.Anime a => ("anime", a.Id, a.Title),
                Genre g => ("genre", g.Id, g.Name),
                Season s => ("season", s.Id, s.Id),
                Episode e => ("episode", e.Id, e.Title),
                PlaybackSource s => ("source", s.Id, s.Id),
                SubtitleTrack s => ("subtitle", s.Id, s.Id),
                Comment c => ("comment", c.Id, c.Id),
                Account a => ("account", a.Id, a.DisplayName),
                _ => default
            };
            if (target.Item1 is null) continue;
            // Store field names only. Never serialize entity values, request bodies or source URLs.
            var fields = entry.Properties.Where(p => p.IsModified && p.Metadata.Name is not
                ("Version" or "PasswordHash" or "Email" or "NormalizedEmail" or "AvatarKey"))
                .Select(p => p.Metadata.Name).Order().ToArray();
            if (entry.Entity is Anime.Anime && changes.Any(x => x.Entity is AnimeGenre link && link.AnimeId == target.Item2))
                fields = fields.Append("Genres").Distinct().Order().ToArray();
            if (target.Item1 == "account" && http.Request.Path.Value?.EndsWith("/role", StringComparison.Ordinal) == true)
                fields = ["Role"];
            var action = entry.State == EntityState.Added ? "create" : entry.State == EntityState.Deleted ? "delete" : "update";
            if (entry.Entity is Anime.Anime anime && entry.State == EntityState.Modified
                && entry.Property("PublicationStatus").IsModified)
                action = anime.PublicationStatus == "archived" ? "archive"
                    : entry.Property("PublicationStatus").OriginalValue as string == "archived" ? "restore" : "update";
            if (target.Item1 == "account") action = fields.Contains("Role") ? "change_role" : "change_status";
            if (target.Item1 == "comment") action = "moderate";
            db.AuditEntries.Add(new AuditEntry
            {
                ActorId = actor,
                ActorName = actorName,
                ResourceType = target.Item1,
                ResourceId = target.Item2,
                TargetLabel = target.Item3.Length > 300 ? target.Item3[..300] : target.Item3,
                Action = action,
                ChangedFields = fields,
                OccurredAt = time.GetUtcNow()
            });
        }
    }
}
