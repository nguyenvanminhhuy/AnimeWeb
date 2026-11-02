using AnimeWeb.Api.Features.Anime;
using AnimeWeb.Api.Features.Auth;
using AnimeWeb.Api.Features.Comments;
using AnimeWeb.Api.Features.Episodes;
using AnimeWeb.Api.Features.Library;
using AnimeWeb.Api.Features.Playback;
using AnimeWeb.Api.Shared;
using Microsoft.EntityFrameworkCore;
using AnimeEntity = AnimeWeb.Api.Features.Anime.Anime;

namespace AnimeWeb.Api.Infrastructure.Persistence;

public sealed class AnimeWebDbContext(DbContextOptions<AnimeWebDbContext> options) : DbContext(options)
{
    public DbSet<AnimeEntity> Anime => Set<AnimeEntity>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<AnimeGenre> AnimeGenres => Set<AnimeGenre>();
    public DbSet<Season> Seasons => Set<Season>();
    public DbSet<Episode> Episodes => Set<Episode>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<AccountAvatar> AccountAvatars => Set<AccountAvatar>();
    public DbSet<LoginSession> LoginSessions => Set<LoginSession>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<LibraryEntry> LibraryEntries => Set<LibraryEntry>();
    public DbSet<WatchProgress> WatchProgress => Set<WatchProgress>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<CommentModeration> CommentModerations => Set<CommentModeration>();
    public DbSet<PlaybackSource> PlaybackSources => Set<PlaybackSource>();
    public DbSet<SubtitleTrack> SubtitleTracks => Set<SubtitleTrack>();
    public DbSet<ViewSession> ViewSessions => Set<ViewSession>();
    public DbSet<ViewEvent> ViewEvents => Set<ViewEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AnimeWebDbContext).Assembly);
        FeatureModel.Configure(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<VersionedEntity>().Where(e => e.State == EntityState.Modified))
            entry.Entity.Version = checked(entry.Property(e => e.Version).OriginalValue + 1);
        return base.SaveChangesAsync(cancellationToken);
    }
}
