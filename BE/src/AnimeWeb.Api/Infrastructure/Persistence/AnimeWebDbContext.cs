using AnimeWeb.Api.Features.Anime;
using AnimeWeb.Api.Features.Episodes;
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

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AnimeWebDbContext).Assembly);
}
