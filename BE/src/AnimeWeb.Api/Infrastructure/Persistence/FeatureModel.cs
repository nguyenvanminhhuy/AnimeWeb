using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Features.Comments;
using AnimeWeb.Api.Features.Library;
using AnimeWeb.Api.Features.Playback;
using AnimeWeb.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace AnimeWeb.Api.Infrastructure.Persistence;

internal static class FeatureModel
{
    public static void Configure(ModelBuilder model)
    {
        var users = model.Entity<Account>();
        users.ToTable("Accounts", t => t.HasCheckConstraint("CK_Accounts_Status", "\"Status\" IN ('active','blocked')"));
        users.HasKey(x => x.Id);
        users.Property(x => x.DisplayName).HasMaxLength(40);
        users.Property(x => x.Email).HasMaxLength(254);
        users.Property(x => x.NormalizedEmail).HasMaxLength(254);
        users.Property(x => x.PasswordHash).HasMaxLength(1024);
        users.HasIndex(x => x.NormalizedEmail).IsUnique();
        var sessions = model.Entity<LoginSession>();
        sessions.HasKey(x => x.TokenHash);
        sessions.Property(x => x.TokenHash).HasMaxLength(64);
        sessions.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        sessions.HasIndex(x => new { x.UserId, x.ExpiresAt });
        model.Entity<AccessRole>().HasKey(x => x.Code);
        model.Entity<AccessPermission>().HasKey(x => x.Code);
        model.Entity<UserRole>().HasKey(x => new { x.UserId, x.RoleCode });
        model.Entity<UserRole>().HasOne<Account>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<UserRole>().HasOne<AccessRole>().WithMany().HasForeignKey(x => x.RoleCode).OnDelete(DeleteBehavior.Restrict);
        model.Entity<RolePermission>().HasKey(x => new { x.RoleCode, x.PermissionCode });
        model.Entity<RolePermission>().HasOne<AccessRole>().WithMany().HasForeignKey(x => x.RoleCode).OnDelete(DeleteBehavior.Restrict);
        model.Entity<RolePermission>().HasOne<AccessPermission>().WithMany().HasForeignKey(x => x.PermissionCode).OnDelete(DeleteBehavior.Restrict);
        model.Entity<AccessRole>().HasData(new[] { "user", "manage", "admin" }.Select(code => new AccessRole { Code = code }));
        model.Entity<AccessPermission>().HasData(Permissions.All.Select(code => new AccessPermission { Code = code }));
        model.Entity<RolePermission>().HasData(new[] { "user", "manage", "admin" }.SelectMany(role =>
            Permissions.ForRole(role).Select(permission => new RolePermission { RoleCode = role, PermissionCode = permission })));

        var library = model.Entity<LibraryEntry>();
        library.HasKey(x => new { x.UserId, x.AnimeId });
        library.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        library.HasOne(x => x.Anime).WithMany().HasForeignKey(x => x.AnimeId).OnDelete(DeleteBehavior.Restrict);
        library.ToTable("LibraryEntries", t => t.HasCheckConstraint("CK_Library_Status",
            "\"Status\" IN ('plan_to_watch','watching','completed','on_hold','dropped')"));
        library.HasIndex(x => new { x.UserId, x.UpdatedAt });
        var progress = model.Entity<WatchProgress>();
        progress.HasKey(x => new { x.UserId, x.EpisodeId });
        progress.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        progress.HasOne(x => x.Episode).WithMany().HasForeignKey(x => x.EpisodeId).OnDelete(DeleteBehavior.Restrict);
        progress.HasIndex(x => new { x.UserId, x.UpdatedAt });
        progress.ToTable("WatchProgress", t => t.HasCheckConstraint("CK_Progress_Position", "\"PositionSeconds\" >= 0"));

        var comments = model.Entity<Comment>();
        comments.HasKey(x => x.Id);
        comments.Property(x => x.Body).HasMaxLength(2000);
        comments.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        comments.HasOne(x => x.Anime).WithMany().HasForeignKey(x => x.AnimeId).OnDelete(DeleteBehavior.Restrict);
        comments.HasIndex(x => new { x.AnimeId, x.Status, x.CreatedAt, x.Id });
        comments.ToTable("Comments", t =>
        {
            t.HasCheckConstraint("CK_Comments_Status", "\"Status\" IN ('visible','hidden','deleted')");
            t.HasCheckConstraint("CK_Comments_Body", "(\"Status\"='deleted' AND \"Body\" IS NULL) OR (\"Status\"<>'deleted' AND length(btrim(\"Body\")) BETWEEN 1 AND 2000)");
        });
        var moderation = model.Entity<CommentModeration>();
        moderation.HasKey(x => x.Id);
        moderation.Property(x => x.Reason).HasMaxLength(300);
        moderation.HasOne(x => x.Comment).WithMany(x => x.Moderations).HasForeignKey(x => x.CommentId).OnDelete(DeleteBehavior.Restrict);
        moderation.HasOne(x => x.Moderator).WithMany().HasForeignKey(x => x.ModeratorId).OnDelete(DeleteBehavior.Restrict);
        moderation.ToTable("CommentModerations", t => t.HasCheckConstraint("CK_Moderation_Action", "\"Action\" IN ('hide','restore')"));
        var source = model.Entity<PlaybackSource>();
        source.HasKey(x => x.Id);
        source.HasOne(x => x.Episode).WithMany().HasForeignKey(x => x.EpisodeId).OnDelete(DeleteBehavior.Restrict);
        source.HasIndex(x => new { x.EpisodeId, x.Enabled });
        source.ToTable("PlaybackSources", t => t.HasCheckConstraint("CK_Source_Type", "\"Type\" IN ('mp4','hls')"));
        var track = model.Entity<SubtitleTrack>();
        track.HasKey(x => x.Id);
        track.HasOne(x => x.Source).WithMany(x => x.Subtitles).HasForeignKey(x => x.PlaybackSourceId).OnDelete(DeleteBehavior.Restrict);
        track.HasIndex(x => x.PlaybackSourceId).IsUnique().HasFilter("\"IsDefault\" = TRUE");
        track.ToTable("SubtitleTracks", t => t.HasCheckConstraint("CK_Track_Format", "\"Format\" IN ('vtt','srt')"));
        model.Entity<ViewSession>().HasKey(x => x.Id);
        model.Entity<ViewSession>().HasOne(x => x.Episode).WithMany().HasForeignKey(x => x.EpisodeId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<ViewSession>().HasIndex(x => x.StartedAt);
        model.Entity<ViewEvent>().HasKey(x => new { x.AnimeId, x.ViewerHash, x.Bucket });
        model.Entity<ViewEvent>().HasOne(x => x.Anime).WithMany().HasForeignKey(x => x.AnimeId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<Features.Anime.Anime>().Property(x => x.Subtitle).HasMaxLength(300);
        model.Entity<Features.Anime.Genre>().Property<string>("NormalizedName")
            .HasComputedColumnSql("upper(btrim(\"Name\"))", stored: true);
        model.Entity<Features.Anime.Genre>().HasIndex("NormalizedName").IsUnique();
        foreach (var entity in model.Model.GetEntityTypes().ToArray())
        {
            if (typeof(VersionedEntity).IsAssignableFrom(entity.ClrType))
                model.Entity(entity.ClrType).Property(nameof(VersionedEntity.Version)).IsConcurrencyToken().HasDefaultValue(1L);
            foreach (var property in entity.GetProperties().Where(p => p.ClrType == typeof(string) && p.GetMaxLength() == null
                && p.Name is not ("Synopsis" or "NormalizedName")))
                property.SetMaxLength(property.Name.EndsWith("Id") || property.Name.EndsWith("Code") || property.Name == "Code" ? 100 : 2048);
        }
    }
}
